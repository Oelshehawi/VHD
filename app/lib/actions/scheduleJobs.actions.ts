"use server";
import { revalidatePath, unstable_cache } from "next/cache";
import connectMongo from "../connect";
import {
  Schedule,
  PayrollPeriod,
  Report,
  AuditLog,
  Invoice,
} from "../../../models/reactDataSchema";
import {
  PayrollPeriodType,
  ScheduleType,
  ReportType,
  InvoiceType,
} from "../typeDefinitions";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { calculateJobDurationFromPrice, minutesToPayrollHours } from "../utils";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Server action to fetch pending and overdue invoices for AddJob modal
 * Used by TanStack Query in client components
 */
export async function getPendingInvoices(): Promise<InvoiceType[]> {
  await connectMongo();
  try {
    const invoices = await Invoice.aggregate([
      { $match: { status: { $in: ["pending", "overdue"] } } },
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $match: { "client.isArchived": { $ne: true } } },
      { $sort: { dateIssued: -1 } },
    ]);

    const formattedItems = (items: any[]) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    return invoices.map((invoice: any) => ({
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      // @ts-ignore
      dateIssued: invoice.dateIssued.toISOString(),
      // @ts-ignore
      dateDue: invoice.dateDue.toISOString(),
      items: formattedItems(invoice.items),
      frequency: invoice.frequency,
      location: invoice.location,
      notes: invoice.notes,
      status: invoice.status,
      clientId: invoice.clientId.toString(),
    })) as InvoiceType[];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch pending invoices");
  }
}

/**
 * Adds a specified number of days to a date.
 * @param {Date} date - The original date.
 * @param {number} days - Number of days to add.
 * @returns {Date} - The new date.
 */
const addDays: (date: Date, days: number) => Date = (
  date: Date,
  days: number,
): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(0, 0, 0, 0); // Reset to start of day (UTC)
  return result;
};

const resetTimeToMidnight = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setUTCHours(0, 0, 0, 0); // Reset to the start of day (UTC)
  return newDate;
};

// Helper function to find or create a payroll period for a given date
export const findOrCreatePayrollPeriod = async (
  date: Date,
): Promise<PayrollPeriodType | null> => {
  // Normalize the date to the start of the day (midnight UTC)
  const normalizedDate = resetTimeToMidnight(date);

  // Step 1: Try to find an existing payroll period that includes the given date
  let payrollPeriod = await PayrollPeriod.findOne({
    startDate: { $lte: normalizedDate },
    endDate: { $gte: normalizedDate },
  });

  if (payrollPeriod) {
    return payrollPeriod;
  }

  // Step 2: Define the base start date for payroll periods (October 3, 2024)
  const baseStartDate = resetTimeToMidnight(
    new Date(Date.UTC(2024, 9, 3, 0, 0, 0)),
  ); // Months are 0-indexed (9 = October)

  const periodLength = 14; // Payroll period length is 14 days

  // Step 3: Retrieve the latest existing payroll period
  let latestPayrollPeriod = await PayrollPeriod.findOne().sort({ endDate: -1 });

  let newStartDate: Date;

  if (latestPayrollPeriod) {
    // Initialize newStartDate to the day after the latest payroll period's endDate
    newStartDate = addDays(new Date(latestPayrollPeriod.endDate), 1);
  } else {
    // If no existing periods, start from the base start date
    newStartDate = baseStartDate;
  }

  // Step 4: Iteratively create payroll periods until the period containing the target date is created
  while (newStartDate <= normalizedDate) {
    // Calculate the end date of the new payroll period
    const newEndDate = addDays(newStartDate, periodLength - 1);
    newEndDate.setUTCHours(23, 59, 59, 999); // Set end of day (UTC)

    // Define the payday (3 days after the end date)
    const payDay = addDays(newEndDate, 3);

    // Create the new payroll period
    const newPayrollPeriod = new PayrollPeriod({
      startDate: newStartDate,
      endDate: newEndDate,
      cutoffDate: newEndDate,
      payDay: payDay,
    } as PayrollPeriodType);

    await newPayrollPeriod.save();

    latestPayrollPeriod = newPayrollPeriod;

    newStartDate = addDays(newEndDate, 1);
  }

  payrollPeriod = await PayrollPeriod.findOne({
    startDate: { $lte: normalizedDate },
    endDate: { $gte: normalizedDate },
  });

  return payrollPeriod;
};

export async function createSchedule(
  scheduleData: ScheduleType,
  performedBy: string = "system",
) {
  try {
    await connectMongo();

    // Trim jobTitle to remove leading/trailing spaces
    if (scheduleData.jobTitle) {
      scheduleData.jobTitle = scheduleData.jobTitle.trim();
    }

    if (typeof scheduleData.startDateTime === "string") {
      scheduleData.startDateTime = new Date(
        scheduleData.startDateTime,
      ) as Date & string;
    }

    // If hours are not provided or are the default 4, calculate based on invoice price
    if (!scheduleData.hours || scheduleData.hours === 4) {
      try {
        // Fetch the invoice to get the total price
        const invoice = await Invoice.findById(
          scheduleData.invoiceRef,
        ).lean<InvoiceType>();
        if (invoice && invoice.items) {
          const totalPrice = invoice.items.reduce(
            (sum: number, item: any) => sum + (item.price || 0),
            0,
          );

          // Calculate duration in minutes and convert to payroll bucket hours
          const durationInMinutes = calculateJobDurationFromPrice(totalPrice);
          scheduleData.hours = minutesToPayrollHours(durationInMinutes);
        }
      } catch (error) {
        console.warn(
          "Could not calculate duration from invoice price, using default:",
          error,
        );
        // Fall back to default 4 hours if calculation fails
        scheduleData.hours = 4;
      }
    }

    // Find or create the appropriate payroll period
    const payrollPeriod = await findOrCreatePayrollPeriod(
      new Date(scheduleData.startDateTime),
    );

    // Assign the payrollPeriod ID to the schedule
    scheduleData.payrollPeriod = payrollPeriod?._id || "";

    const newSchedule = new Schedule(scheduleData);
    await newSchedule.save();

    // Fetch the invoice to get the invoiceId for audit logging
    const invoice = await Invoice.findById(
      scheduleData.invoiceRef,
    ).lean<InvoiceType>();

    // Create audit log entry for schedule creation
    if (invoice) {
      await AuditLog.create({
        invoiceId: invoice.invoiceId,
        action: "schedule_created",
        timestamp: new Date(),
        performedBy: performedBy,
        details: {
          newValue: {
            jobTitle: scheduleData.jobTitle,
            location: scheduleData.location,
            startDateTime: scheduleData.startDateTime,
            hours: scheduleData.hours,
          },
          reason: "Schedule created for invoice",
          metadata: {
            clientId: invoice.clientId,
          },
        },
        success: true,
      });
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create schedule");
  }

  revalidatePath("/schedule");
}

export const deleteJob = async (jobId: string) => {
  await connectMongo();
  try {
    // First, fetch the schedule to get photos before deleting
    const schedule = await Schedule.findById(jobId);

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Delete estimate photos from Cloudinary
    if (schedule.photos && schedule.photos.length > 0) {
      const estimatePhotos = schedule.photos.filter(
        (photo: any) => photo.type === "estimate",
      );

      // Delete each estimate photo from Cloudinary
      for (const photo of estimatePhotos) {
        try {
          // Extract public_id from Cloudinary URL
          const matches = photo.url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
          if (matches && matches[1]) {
            const publicId = matches[1];
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted estimate photo from Cloudinary: ${publicId}`);
          }
        } catch (cloudinaryError) {
          console.error(
            "Failed to delete estimate photo from Cloudinary:",
            cloudinaryError,
          );
          // Continue with job deletion even if Cloudinary delete fails
        }
      }
    }

    // Now delete the schedule from MongoDB
    await Schedule.findByIdAndDelete(jobId);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete job with id");
  }

  revalidatePath("/schedule");
};

export const updateSchedule = async ({
  scheduleId,
  confirmed,
  deadRun,
  onSiteContact,
  accessInstructions,
  performedBy = "system",
}: {
  scheduleId: string;
  confirmed?: boolean;
  deadRun?: boolean;
  onSiteContact?: { name: string; phone: string; email?: string };
  accessInstructions?: string;
  performedBy?: string;
}) => {
  await connectMongo();
  try {
    // Build update object with only provided fields
    const updateFields: {
      confirmed?: boolean;
      deadRun?: boolean;
      onSiteContact?: { name: string; phone: string; email?: string };
      accessInstructions?: string;
    } = {};
    if (confirmed !== undefined) updateFields.confirmed = confirmed;
    if (deadRun !== undefined) updateFields.deadRun = deadRun;
    if (onSiteContact !== undefined) updateFields.onSiteContact = onSiteContact;
    if (accessInstructions !== undefined)
      updateFields.accessInstructions = accessInstructions;

    // Fetch the schedule to get job details for audit logging
    const schedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      updateFields,
      { new: true },
    );

    if (schedule) {
      // Create audit log entry for schedule confirmation/unconfirmation
      const invoice = await Invoice.findById(
        schedule.invoiceRef,
      ).lean<InvoiceType>();

      if (invoice) {
        // Determine action type based on what was updated
        let action: string;
        let reason: string;
        if (confirmed !== undefined) {
          action = confirmed ? "schedule_confirmed" : "schedule_unconfirmed";
          reason = `Schedule ${confirmed ? "confirmed" : "unconfirmed"}`;
        } else if (deadRun !== undefined) {
          action = deadRun
            ? "schedule_dead_run_marked"
            : "schedule_dead_run_cleared";
          reason = `Schedule ${deadRun ? "marked as dead run" : "dead run cleared"}`;
        } else if (
          onSiteContact !== undefined ||
          accessInstructions !== undefined
        ) {
          action = "schedule_updated";
          reason = "Schedule access information updated";
        } else {
          action = "schedule_updated";
          reason = "Schedule updated";
        }

        await AuditLog.create({
          invoiceId: invoice.invoiceId,
          action,
          timestamp: new Date(),
          performedBy,
          details: {
            newValue: {
              jobTitle: schedule.jobTitle,
              location: schedule.location,
              startDateTime: schedule.startDateTime,
              invoiceMongoId: invoice._id.toString(), // Add MongoDB _id
              ...updateFields,
            },
            reason,
            metadata: {
              clientId: invoice.clientId,
            },
          },
          success: true,
        });
      }
    }

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the schedule");
  }
};

export const updateJob = async ({
  scheduleId,
  jobTitle,
  location,
  startDateTime,
  assignedTechnicians,
  technicianNotes,
  hours,
  onSiteContact,
  accessInstructions,
}: {
  scheduleId: string;
  jobTitle: string;
  location: string;
  startDateTime: string;
  assignedTechnicians: string[];
  technicianNotes?: string;
  hours?: number;
  onSiteContact?: { name: string; phone: string; email?: string };
  accessInstructions?: string;
}) => {
  await connectMongo();
  try {
    // Trim jobTitle to remove leading/trailing spaces
    const trimmedJobTitle = jobTitle.trim();
    // Parse startDateTime - if it's an ISO string, it's already in UTC
    // which is what MongoDB expects
    const updatedStartDate = new Date(startDateTime);

    // Find or create the appropriate payroll period
    const payrollPeriod = await findOrCreatePayrollPeriod(updatedStartDate);

    // Get the current schedule to access invoiceRef
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Build update object
    const updateFields: any = {
      jobTitle: trimmedJobTitle,
      location,
      startDateTime: updatedStartDate,
      assignedTechnicians,
      payrollPeriod: payrollPeriod?._id,
      technicianNotes,
      onSiteContact,
      accessInstructions,
    };

    // Only include hours if provided
    if (hours !== undefined) {
      updateFields.hours = hours;
    }

    // Update the schedule with the new details and payroll period
    await Schedule.findByIdAndUpdate(scheduleId, updateFields, { new: true });

    // Sync invoice dateIssued if this is the only schedule linked to the invoice
    if (schedule.invoiceRef) {
      const schedulesForInvoice = await Schedule.countDocuments({
        invoiceRef: schedule.invoiceRef,
      });

      if (schedulesForInvoice === 1) {
        // Extract date only (without time) from startDateTime for invoice dateIssued
        const dateOnlyStr = updatedStartDate.toISOString().split("T")[0];
        const dateIssuedValue = new Date(dateOnlyStr + "T00:00:00.000Z");

        await Invoice.findByIdAndUpdate(schedule.invoiceRef, {
          dateIssued: dateIssuedValue,
        });
      }
    }

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the job");
  }
};

export async function getTechnicians() {
  const WEEK_SECONDS = 60 * 60 * 24 * 7;

  const getTechniciansCached = unstable_cache(
    async () => {
      const users: any = await clerkClient();
      const userList = await users.users.getUserList({
        limit: 100,
      });

      const technicians = userList.data.filter(
        (user: any) => user.publicMetadata.isTechnician === true,
      );
      return technicians.map((user: any) => ({
        id: user.id,
        name: user.fullName,
        hourlyRate: user.publicMetadata.hourlyRate,
      }));
    },
    ["getTechnicians"],
    { revalidate: WEEK_SECONDS },
  );

  return getTechniciansCached();
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function searchScheduledJobs(query: string, limit = 20) {
  await connectMongo();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const { sessionClaims, userId } = auth();
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  const regex = new RegExp(escapeRegex(trimmed), "i");
  const match: any = {
    $or: [{ jobTitle: regex }, { location: regex }],
  };

  if (!canManage && userId) {
    match.assignedTechnicians = userId;
  }

  const jobs = await Schedule.find(match)
    .sort({ startDateTime: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .lean<ScheduleType[]>();

  return JSON.parse(JSON.stringify(jobs));
}

export const updateShiftHoursBatch = async (
  updates: { scheduleId: string; hoursWorked: number }[],
) => {
  await connectMongo();
  try {
    if (updates.length === 0) {
      return;
    }

    // Use bulkWrite for efficient batch updates
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.scheduleId },
        update: { $set: { hours: update.hoursWorked } },
      },
    }));

    const result = await Schedule.bulkWrite(bulkOps);

    // Check if all updates were successful
    if (result.modifiedCount !== updates.length) {
      console.warn(
        `Expected to update ${updates.length} shifts, but only ${result.modifiedCount} were modified`,
      );
    }

    revalidatePath("/payroll");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update shift hours");
  }
};

export const updateDeadRun = async ({
  scheduleId,
  deadRun,
}: {
  scheduleId: string;
  deadRun: boolean;
}) => {
  await connectMongo();
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { deadRun },
      { new: true },
    );

    if (!updatedSchedule) {
      throw new Error("Schedule not found");
    }

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update deadRun status");
  }
};

export const createOrUpdateReport = async (reportData: ReportType) => {
  await connectMongo();
  try {
    // Check if this schedule already has a report
    let existingReport = await Report.findOne({
      scheduleId: reportData.scheduleId,
    });

    if (existingReport) {
      // DEBUG: Log what we're about to update
      console.log("=== SERVER: createOrUpdateReport UPDATE ===");
      console.log("Existing report ID:", existingReport._id);
      console.log(
        "reportData.ecologyUnit:",
        JSON.stringify(reportData.ecologyUnit, null, 2),
      );
      console.log(
        "reportData.accessPanels:",
        JSON.stringify(reportData.accessPanels, null, 2),
      );

      // Update existing report - use $set to completely replace fields (prevents old data from persisting)
      existingReport = await Report.findByIdAndUpdate(
        existingReport._id,
        { $set: reportData },
        { new: true },
      );

      console.log(
        "Updated report.ecologyUnit:",
        JSON.stringify(existingReport?.ecologyUnit, null, 2),
      );

      // Return a plain JavaScript object, not a Mongoose document
      return JSON.parse(JSON.stringify(existingReport));
    } else {
      // Create new report
      const newReport = new Report(reportData);
      await newReport.save();

      // Return a plain JavaScript object, not a Mongoose document
      return JSON.parse(JSON.stringify(newReport));
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create/update report");
  }
};

export const getReportByScheduleId = async (scheduleId: string) => {
  await connectMongo();
  try {
    const report = await Report.findOne({ scheduleId });
    // Convert to plain JavaScript object before returning
    return report ? JSON.parse(JSON.stringify(report)) : null;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch report");
  }
};

export const deleteReport = async (reportId: string) => {
  await connectMongo();
  try {
    const deletedReport = await Report.findByIdAndDelete(reportId);
    if (!deletedReport) {
      throw new Error("Report not found");
    }
    revalidatePath("/schedule");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete report");
  }
};

export const getReportsByJobNameAndLocation = async (
  jobTitle: string,
  location: string,
) => {
  await connectMongo();
  try {
    // First, find schedules with similar job titles and locations
    const schedules = await Schedule.find({
      $and: [
        {
          $or: [
            { jobTitle: { $regex: jobTitle, $options: "i" } }, // Case-insensitive match
            { jobTitle: jobTitle }, // Exact match
          ],
        },
        {
          $or: [
            { location: { $regex: location, $options: "i" } }, // Case-insensitive match
            { location: location }, // Exact match
          ],
        },
      ],
    })
      .sort({ startDateTime: -1 })
      .limit(10) // Get last 10 similar schedules
      .lean();

    if (!schedules || schedules.length === 0) {
      return [];
    }

    // Get all reports for these schedules
    const scheduleIds = schedules.map((schedule: any) =>
      schedule._id?.toString(),
    );
    const reports = await Report.find({ scheduleId: { $in: scheduleIds } })
      .sort({ dateCompleted: -1 })
      .lean();

    if (!reports || reports.length === 0) {
      return [];
    }

    // Map reports with schedule information for better context and ensure proper serialization
    return reports.map((report: any) => {
      const relatedSchedule = schedules.find(
        (schedule: any) =>
          schedule._id?.toString() === report.scheduleId?.toString(),
      );

      return {
        _id: report._id.toString(),
        scheduleId: report.scheduleId.toString(),
        jobTitle: report.jobTitle || relatedSchedule?.jobTitle || "",
        location: report.location || relatedSchedule?.location || "",
        dateCompleted:
          report.dateCompleted instanceof Date
            ? report.dateCompleted.toISOString()
            : report.dateCompleted,
        technicianId: report.technicianId || "",
        fuelType: report.fuelType || "",
        cookingVolume: report.cookingVolume || "",
        cookingEquipment: report.cookingEquipment || [],
        equipmentDetails: report.equipmentDetails || {},
        cleaningDetails: report.cleaningDetails || {},
        inspectionItems: report.inspectionItems || {},
        recommendedCleaningFrequency: report.recommendedCleaningFrequency || 0,
        comments: report.comments || "",
        recommendations: report.recommendations || "",
        lastServiceDate:
          report.lastServiceDate instanceof Date
            ? report.lastServiceDate.toISOString()
            : report.lastServiceDate,
      };
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
};

/**
 * Check if a schedule and report exist for an invoice
 * Returns object with hasSchedule and hasReport flags
 */
export async function getReportStatusByInvoiceId(
  invoiceId: string,
): Promise<{ hasSchedule: boolean; hasReport: boolean }> {
  await connectMongo();
  try {
    // Find schedules linked to this invoice
    const schedules = await Schedule.find({ invoiceRef: invoiceId }).lean();

    if (!schedules || schedules.length === 0) {
      return { hasSchedule: false, hasReport: false };
    }

    // Check if any schedule has a report
    const scheduleIds = schedules.map((s: any) => s._id.toString());
    const reportCount = await Report.countDocuments({
      scheduleId: { $in: scheduleIds },
    });

    return { hasSchedule: true, hasReport: reportCount > 0 };
  } catch (error) {
    console.error("Error checking report status:", error);
    return { hasSchedule: false, hasReport: false };
  }
}

"use server";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import connectMongo from "../connect";
import {
  Schedule,
  PayrollPeriod,
  Report,
  AuditLog,
  Invoice,
  Photo,
} from "../../../models/reactDataSchema";
import {
  PayrollPeriodType,
  ScheduleType,
  ReportType,
  InvoiceType,
  NOTIFICATION_TYPES,
} from "../typeDefinitions";
import { clerkClient, auth } from "@clerk/nextjs/server";
import {
  calculateJobDurationFromPrice,
  minutesToPayrollHours,
  formatDateTimeStringUTC,
} from "../utils";
import {
  ACTUAL_SERVICE_DURATION_MAX_MINUTES,
  evaluateDurationConfidence,
} from "../serviceDurationRules";
import { v2 as cloudinary } from "cloudinary";
import { syncInvoiceDateIssuedAndJobsDueSoon } from "./invoiceDateSync";
import { createNotification } from "./notifications.actions";
import { getScheduleDisplayDateKey } from "../utils/scheduleDayUtils";
import { runAutoScheduleInsightAnalysis } from "./scheduleInsights.actions";
import { requireAdmin } from "../auth/utils";
import { resolveHistoricalDurationForLocation } from "../historicalServiceDuration.data";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function safeRunAutoInsights(params: {
  dateKeys: string[];
  technicianIds?: string[];
}) {
  try {
    const uniqueDateKeys = [...new Set(params.dateKeys.filter(Boolean))];
    if (uniqueDateKeys.length === 0) return;

    const uniqueTechIds = [
      ...new Set((params.technicianIds || []).filter(Boolean)),
    ];

    await runAutoScheduleInsightAnalysis({
      dateKeys: uniqueDateKeys,
      technicianIds: uniqueTechIds,
    });
  } catch (error) {
    console.error("Auto schedule insight analysis failed:", error);
  }
}

function sumInvoiceTotal(
  items: InvoiceType["items"] | undefined,
): number | null {
  if (!Array.isArray(items)) return null;
  const total = items.reduce((sum: number, item: any) => {
    const parsed = Number(item?.price);
    if (!Number.isFinite(parsed)) return sum;
    return sum + parsed;
  }, 0);
  return Number.isFinite(total) ? total : null;
}

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
    if (scheduleData.location) {
      scheduleData.location = scheduleData.location.trim();
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

    // Populate historical duration from past completions at same location
    if (scheduleData.historicalServiceDurationMinutes == null) {
      const historicalMinutes = await resolveHistoricalDurationForLocation(
        scheduleData.location,
      );
      if (historicalMinutes != null) {
        scheduleData.historicalServiceDurationMinutes = historicalMinutes;
      }
    }

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

    // Notify assigned technicians
    if (
      scheduleData.assignedTechnicians &&
      scheduleData.assignedTechnicians.length > 0
    ) {
      for (const technicianId of scheduleData.assignedTechnicians) {
        try {
          await createNotification({
            userId: technicianId,
            title: "New Job Assigned",
            body: `You've been assigned to: ${scheduleData.jobTitle} at ${scheduleData.location} on ${formatDateTimeStringUTC(scheduleData.startDateTime)}`,
            type: NOTIFICATION_TYPES.JOB_ASSIGNED,
            metadata: {
              scheduleId: newSchedule._id.toString(),
              link: `/schedule?date=${new Date(scheduleData.startDateTime).toISOString().split("T")[0]}`,
            },
          });
        } catch (notifError) {
          console.error(
            "Failed to send notification to technician:",
            notifError,
          );
          // Don't fail the entire operation if notification fails
        }
      }
    }

    void safeRunAutoInsights({
      dateKeys: [getScheduleDisplayDateKey(scheduleData.startDateTime)],
      technicianIds: scheduleData.assignedTechnicians || [],
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create schedule");
  }

  revalidatePath("/schedule");
}

export const deleteJob = async (jobId: string) => {
  await connectMongo();
  try {
    const scheduleToDelete = await Schedule.findById(
      jobId,
    ).lean<ScheduleType | null>();

    // Delete estimate photos from Cloudinary and photos collection
    const estimatePhotos = await Photo.find({
      scheduleId: jobId,
      type: "estimate",
    }).lean();

    for (const photo of estimatePhotos) {
      try {
        const matches = photo.cloudinaryUrl.match(
          /\/upload\/(?:v\d+\/)?(.+?)\./,
        );
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
      }
    }

    if (estimatePhotos.length > 0) {
      await Photo.deleteMany({
        scheduleId: jobId,
        type: "estimate",
      });
    }

    // Now delete the schedule from MongoDB
    await Schedule.findByIdAndDelete(jobId);

    if (scheduleToDelete) {
      void safeRunAutoInsights({
        dateKeys: [getScheduleDisplayDateKey(scheduleToDelete.startDateTime)],
        technicianIds: scheduleToDelete.assignedTechnicians || [],
      });
    }
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

      void safeRunAutoInsights({
        dateKeys: [getScheduleDisplayDateKey(schedule.startDateTime)],
        technicianIds: schedule.assignedTechnicians || [],
      });
    }

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the schedule");
  }
};

export async function getScheduleActualDurationReview(
  scheduleId: string,
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    scheduleId: string;
    actualServiceDurationMinutes?: number;
    actualServiceDurationSource?:
      | "after_photo"
      | "mark_completed"
      | "admin_edit";
    confidence: "good" | "needs_review";
    reasons: { code: string; message: string }[];
    priceCheckStatus: string;
    expectedMinutesFromPrice: number | null;
    expectedRangeLabel: string | null;
    cutoffMinutes: number;
  };
}> {
  try {
    await requireAdmin();
    await connectMongo();

    const schedule = await Schedule.findById(
      scheduleId,
    ).lean<ScheduleType | null>();
    if (!schedule) {
      return { success: false, message: "Schedule not found" };
    }

    const invoice = await Invoice.findById(schedule.invoiceRef)
      .select("items")
      .lean<Pick<InvoiceType, "items"> | null>();
    const invoiceTotal = sumInvoiceTotal(invoice?.items);

    const review = evaluateDurationConfidence({
      actualServiceDurationMinutes: schedule.actualServiceDurationMinutes,
      scheduleHours: schedule.hours,
      invoiceTotal,
    });

    return {
      success: true,
      data: {
        scheduleId: schedule._id.toString(),
        actualServiceDurationMinutes: schedule.actualServiceDurationMinutes,
        actualServiceDurationSource: schedule.actualServiceDurationSource,
        confidence: review.confidence,
        reasons: review.reasons,
        priceCheckStatus: review.priceCheckStatus,
        expectedMinutesFromPrice: review.expectedMinutesFromPrice,
        expectedRangeLabel: review.expectedRangeLabel,
        cutoffMinutes: review.cutoffMinutes,
      },
    };
  } catch (error) {
    console.error("Database Error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, message: "Unauthorized" };
    }
    return { success: false, message: "Failed to evaluate schedule duration" };
  }
}

export async function updateScheduleActualServiceDuration(input: {
  scheduleId: string;
  actualServiceDurationMinutes?: number;
  clear?: boolean;
  performedBy?: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    scheduleId: string;
    actualServiceDurationMinutes?: number;
    actualServiceDurationSource?:
      | "after_photo"
      | "mark_completed"
      | "admin_edit";
  };
}> {
  try {
    await requireAdmin();
    await connectMongo();

    const scheduleId = input.scheduleId?.trim();
    if (!scheduleId) {
      return { success: false, message: "scheduleId is required" };
    }

    const clear = input.clear === true;
    if (!clear) {
      if (
        typeof input.actualServiceDurationMinutes !== "number" ||
        !Number.isFinite(input.actualServiceDurationMinutes)
      ) {
        return {
          success: false,
          message: "actualServiceDurationMinutes must be a finite number",
        };
      }

      if (input.actualServiceDurationMinutes < 0) {
        return {
          success: false,
          message: "actualServiceDurationMinutes must be non-negative",
        };
      }

      if (
        input.actualServiceDurationMinutes > ACTUAL_SERVICE_DURATION_MAX_MINUTES
      ) {
        return {
          success: false,
          message: `actualServiceDurationMinutes must be <= ${ACTUAL_SERVICE_DURATION_MAX_MINUTES}`,
        };
      }
    }

    const updateQuery = clear
      ? {
          $unset: {
            actualServiceDurationMinutes: 1,
            actualServiceDurationSource: 1,
          },
        }
      : {
          $set: {
            actualServiceDurationMinutes: input.actualServiceDurationMinutes,
            actualServiceDurationSource: "admin_edit",
          },
        };

    const schedule = await Schedule.findByIdAndUpdate(scheduleId, updateQuery, {
      new: true,
      runValidators: true,
    }).lean<ScheduleType | null>();

    if (!schedule) {
      return { success: false, message: "Schedule not found" };
    }

    const invoice = await Invoice.findById(
      schedule.invoiceRef,
    ).lean<InvoiceType | null>();
    if (invoice) {
      await AuditLog.create({
        invoiceId: invoice.invoiceId,
        action: "schedule_updated",
        timestamp: new Date(),
        performedBy: input.performedBy || "manager",
        details: {
          newValue: {
            scheduleId: schedule._id.toString(),
            actualServiceDurationMinutes:
              schedule.actualServiceDurationMinutes ?? null,
            actualServiceDurationSource:
              schedule.actualServiceDurationSource ?? null,
          },
          reason: clear
            ? "Actual service duration cleared by admin"
            : "Actual service duration edited by admin",
          metadata: {
            clientId: invoice.clientId,
          },
        },
        success: true,
      });
    }

    revalidatePath("/schedule");

    return {
      success: true,
      message: clear
        ? "Actual service duration cleared"
        : "Actual service duration updated",
      data: {
        scheduleId: schedule._id.toString(),
        actualServiceDurationMinutes: schedule.actualServiceDurationMinutes,
        actualServiceDurationSource: schedule.actualServiceDurationSource,
      },
    };
  } catch (error) {
    console.error("Database Error:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }
    return {
      success: false,
      message: "Failed to update actual service duration",
    };
  }
}

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
    const trimmedLocation = location.trim();
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

    const previousStartDate =
      schedule.startDateTime instanceof Date
        ? schedule.startDateTime
        : new Date(schedule.startDateTime);
    const previousLocation = String(schedule.location || "").trim();
    const locationChanged = trimmedLocation !== previousLocation;

    // Build update object
    const updateFields: any = {
      jobTitle: trimmedJobTitle,
      location: trimmedLocation,
      startDateTime: updatedStartDate,
      assignedTechnicians,
      payrollPeriod: payrollPeriod?._id,
    };

    // Only include hours if provided
    if (hours !== undefined) {
      updateFields.hours = hours;
    }

    // Only include optional fields when explicitly provided
    if (technicianNotes !== undefined) {
      updateFields.technicianNotes = technicianNotes;
    }
    if (onSiteContact !== undefined) {
      updateFields.onSiteContact = onSiteContact;
    }
    if (accessInstructions !== undefined) {
      updateFields.accessInstructions = accessInstructions;
    }

    let nextHistoricalDurationMinutes: number | null = null;
    if (locationChanged) {
      nextHistoricalDurationMinutes =
        await resolveHistoricalDurationForLocation(trimmedLocation);
      if (nextHistoricalDurationMinutes != null) {
        updateFields.historicalServiceDurationMinutes =
          nextHistoricalDurationMinutes;
      }
    }

    // Update the schedule with the new details and payroll period
    const updateQuery: any = { $set: updateFields };
    if (locationChanged && nextHistoricalDurationMinutes == null) {
      updateQuery.$unset = { historicalServiceDurationMinutes: 1 };
    }
    await Schedule.findByIdAndUpdate(scheduleId, updateQuery, { new: true });

    // Detect technician changes and send notifications
    const previousTechnicians = schedule.assignedTechnicians || [];
    const newTechnicians = assignedTechnicians || [];

    // Find newly assigned technicians
    const addedTechnicians = newTechnicians.filter(
      (techId) => !previousTechnicians.includes(techId),
    );

    // Notify newly assigned technicians
    for (const technicianId of addedTechnicians) {
      try {
        await createNotification({
          userId: technicianId,
          title: "New Job Assigned",
          body: `You've been assigned to: ${trimmedJobTitle} at ${trimmedLocation} on ${formatDateTimeStringUTC(updatedStartDate)}`,
          type: NOTIFICATION_TYPES.JOB_ASSIGNED,
          metadata: {
            scheduleId: scheduleId,
            link: `/schedule?date=${updatedStartDate.toISOString().split("T")[0]}`,
          },
        });
      } catch (notifError) {
        console.error("Failed to send notification to technician:", notifError);
        // Don't fail the entire operation if notification fails
      }
    }

    const isRescheduled =
      !Number.isNaN(previousStartDate.getTime()) &&
      previousStartDate.getTime() !== updatedStartDate.getTime();

    if (isRescheduled) {
      const scheduleUpdateRecipients = newTechnicians.filter((techId) =>
        previousTechnicians.includes(techId),
      );

      const oldDateLabel = formatDateTimeStringUTC(previousStartDate);
      const newDateLabel = formatDateTimeStringUTC(updatedStartDate);

      for (const technicianId of scheduleUpdateRecipients) {
        try {
          await createNotification({
            userId: technicianId,
            title: "Job Rescheduled",
            body: `${trimmedJobTitle} moved from ${oldDateLabel} to ${newDateLabel}`,
            type: NOTIFICATION_TYPES.SCHEDULE_UPDATE,
            metadata: {
              scheduleId: scheduleId,
              link: `/schedule?date=${updatedStartDate.toISOString().split("T")[0]}`,
            },
          });
        } catch (notifError) {
          console.error(
            "Failed to send reschedule notification to technician:",
            notifError,
          );
        }
      }
    }

    // Sync linked invoice dateIssued whenever the job is rescheduled.
    if (schedule.invoiceRef) {
      await syncInvoiceDateIssuedAndJobsDueSoon({
        invoiceId: schedule.invoiceRef.toString(),
        dateIssued: updatedStartDate,
      });
    }

    const oldDateKey = getScheduleDisplayDateKey(schedule.startDateTime);
    const newDateKey = getScheduleDisplayDateKey(updatedStartDate);
    void safeRunAutoInsights({
      dateKeys: [oldDateKey, newDateKey],
      technicianIds: [...previousTechnicians, ...newTechnicians],
    });

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
        (user: any) => user.publicMetadata?.isTechnician === true,
      );
      return technicians.map((user: any) => ({
        id: user.id,
        name:
          user.fullName ||
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.primaryEmailAddress?.emailAddress ||
          user.id,
        hourlyRate:
          typeof user.publicMetadata?.hourlyRate === "number"
            ? user.publicMetadata.hourlyRate
            : 0,
        depotAddress:
          typeof user.publicMetadata?.depotAddress === "string" &&
          user.publicMetadata.depotAddress.trim().length > 0
            ? user.publicMetadata.depotAddress.trim()
            : null,
      }));
    },
    ["getTechnicians"],
    { revalidate: WEEK_SECONDS, tags: ["technicians"] },
  );

  return getTechniciansCached();
}

export async function updateTechnicianDepotAddress(
  technicianId: string,
  depotAddress: string | null,
): Promise<{
  success: boolean;
  message: string;
  depotAddress?: string | null;
}> {
  try {
    const { sessionClaims } = await auth();
    const canManage = (sessionClaims as any)?.isManager?.isManager === true;

    if (!canManage) {
      return {
        success: false,
        message: "Unauthorized: Manager access required",
      };
    }

    const normalizedTechnicianId = technicianId.trim();
    if (!normalizedTechnicianId) {
      return {
        success: false,
        message: "Technician ID is required",
      };
    }

    const normalizedDepotAddress = (depotAddress || "").trim();
    const nextDepotAddress =
      normalizedDepotAddress.length > 0 ? normalizedDepotAddress : null;

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(normalizedTechnicianId);

    const currentMetadata = (user.publicMetadata || {}) as Record<
      string,
      unknown
    >;
    if (currentMetadata.isTechnician !== true) {
      return {
        success: false,
        message: "Selected user is not marked as a technician",
      };
    }

    await clerk.users.updateUser(normalizedTechnicianId, {
      publicMetadata: {
        ...currentMetadata,
        depotAddress: nextDepotAddress,
      },
    });

    revalidateTag("technicians", "max");
    revalidatePath("/payroll");
    revalidatePath("/schedule");

    return {
      success: true,
      message: nextDepotAddress
        ? "Depot address updated"
        : "Depot address cleared",
      depotAddress: nextDepotAddress,
    };
  } catch (error) {
    console.error("Failed to update technician depot address:", error);
    return {
      success: false,
      message: "Failed to update depot address",
    };
  }
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function searchScheduledJobs(query: string, limit = 20) {
  await connectMongo();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const { sessionClaims, userId } = await auth();
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

export const createOrUpdateReport = async (reportData: ReportType) => {
  await connectMongo();
  try {
    // Check if this schedule already has a report
    let existingReport = await Report.findOne({
      scheduleId: reportData.scheduleId,
    });

    if (existingReport) {
      // Update existing report - use $set to completely replace fields (prevents old data from persisting)
      existingReport = await Report.findByIdAndUpdate(
        existingReport._id,
        { $set: reportData },
        { new: true },
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
 * Check if a schedule and completed report exist for an invoice
 * Returns object with hasSchedule and hasReport flags
 * hasReport is true only if the report is completed (or has no reportStatus for backward compatibility)
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

    // Check if any schedule has a completed report
    // Include reports with reportStatus "completed" or without reportStatus (backward compatibility)
    const scheduleIds = schedules.map((s: any) => s._id.toString());
    const reportCount = await Report.countDocuments({
      scheduleId: { $in: scheduleIds },
      $or: [
        { reportStatus: "completed" },
        { reportStatus: { $exists: false } },
      ],
    });

    return { hasSchedule: true, hasReport: reportCount > 0 };
  } catch (error) {
    console.error("Error checking report status:", error);
    return { hasSchedule: false, hasReport: false };
  }
}

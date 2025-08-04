"use server";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import {
  Schedule,
  PayrollPeriod,
  Report,
} from "../../../models/reactDataSchema";
import {
  PayrollPeriodType,
  ScheduleType,
  ReportType,
} from "../typeDefinitions";
import { clerkClient } from "@clerk/nextjs/server";
import { calculateJobDurationFromPrice, convertMinutesToHours } from "../utils";
import { Invoice } from "../../../models/reactDataSchema";
import { InvoiceType } from "../typeDefinitions";

/**
 * Adds a specified number of days to a date.
 * @param {Date} date - The original date.
 * @param {number} days - Number of days to add.
 * @returns {Date} - The new date.
 */
const addDays: (date: Date, days: number) => Date = (date: Date, days: number): Date => {
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

export async function createSchedule(scheduleData: ScheduleType) {
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
        const invoice = await Invoice.findById(scheduleData.invoiceRef).lean<InvoiceType>();
        if (invoice && invoice.items) {
          const totalPrice = invoice.items.reduce(
            (sum: number, item: any) => sum + (item.price || 0),
            0,
          );
          
          // Calculate duration in minutes and convert to hours
          const durationInMinutes = calculateJobDurationFromPrice(totalPrice);
          scheduleData.hours = convertMinutesToHours(durationInMinutes);
          
          console.log(`Calculated job duration: $${totalPrice} → ${durationInMinutes} minutes → ${scheduleData.hours} hours`);
        }
      } catch (error) {
        console.warn("Could not calculate duration from invoice price, using default:", error);
        // Fall back to default 2.5 hours if calculation fails
        scheduleData.hours = 2.5;
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
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create schedule");
  }

  revalidatePath("/schedule");
}

export const deleteJob = async (jobId: string) => {
  await connectMongo();
  try {
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
}: {
  scheduleId: string;
  confirmed: boolean;
}) => {
  await connectMongo();
  try {
    await Schedule.findByIdAndUpdate(scheduleId, { confirmed }, { new: true });
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
}: {
  scheduleId: string;
  jobTitle: string;
  location: string;
  startDateTime: string;
  assignedTechnicians: string[];
  technicianNotes?: string;
}) => {
  await connectMongo();
  try {
    // Trim jobTitle to remove leading/trailing spaces
    const trimmedJobTitle = jobTitle.trim();
    const updatedStartDate = new Date(startDateTime);

    // Find or create the appropriate payroll period
    const payrollPeriod = await findOrCreatePayrollPeriod(updatedStartDate);

    // Update the schedule with the new details and payroll period
    await Schedule.findByIdAndUpdate(
      scheduleId,
      {
        jobTitle: trimmedJobTitle,
        location,
        startDateTime: updatedStartDate,
        assignedTechnicians,
        payrollPeriod: payrollPeriod?._id,
        technicianNotes,
      },
      { new: true },
    );

    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the job");
  }
};

export async function getTechnicians() {
  const users: any = await clerkClient();
  const userList = await users.users.getUserList({
    limit: 100,
  });


  const technicians = userList.data.filter((user: any) => user.publicMetadata.isTechnician === true);
  return technicians.map((user: any) => ({
    id: user.id,
    name: user.fullName,
    hourlyRate: user.publicMetadata.hourlyRate,
  }));
}

export const updateShiftHours = async ({
  scheduleId,
  hoursWorked,
}: {
  scheduleId: string;
  hoursWorked: number;
}) => {
  await connectMongo();
  try {
    const schedule = await Schedule.findOne({ _id: scheduleId });
    if (!schedule) {
      throw new Error("Job not found");
    }
    schedule.hours = hoursWorked;
    await schedule.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update shift hours");
  }

  revalidatePath("/payroll");
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
      // Update existing report
      existingReport = await Report.findByIdAndUpdate(
        existingReport._id,
        reportData,
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

"use server";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Schedule, PayrollPeriod } from "../../../models/reactDataSchema";
import { PayrollPeriodType, ScheduleType } from "../typeDefinitions";
import { clerkClient } from "@clerk/nextjs/server";



/**
 * Adds a specified number of days to a date.
 * @param {Date} date - The original date.
 * @param {number} days - Number of days to add.
 * @returns {Date} - The new date.
 */
const addDays = (date: Date, days: number): Date => {
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
  const baseStartDate = resetTimeToMidnight(new Date(Date.UTC(2024, 9, 3, 0, 0, 0))); // Months are 0-indexed (9 = October)

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
    });

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

    if (typeof scheduleData.startDateTime === "string") {
      scheduleData.startDateTime = new Date(
        scheduleData.startDateTime,
      ) as Date & string;
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
}: {
  scheduleId: string;
  jobTitle: string;
  location: string;
  startDateTime: string;
  assignedTechnicians: string[];
}) => {
  await connectMongo();
  try {
    const updatedStartDate = new Date(startDateTime);

    // Find or create the appropriate payroll period
    const payrollPeriod = await findOrCreatePayrollPeriod(updatedStartDate);

    // Update the schedule with the new details and payroll period
    await Schedule.findByIdAndUpdate(
      scheduleId,
      {
        jobTitle,
        location,
        startDateTime: updatedStartDate,
        assignedTechnicians,
        payrollPeriod: payrollPeriod?._id ,
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
  const users: any = await clerkClient().users.getUserList();
  return users.data.map((user: any) => ({
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

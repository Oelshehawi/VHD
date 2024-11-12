// lib/scheduleAndShifts.ts

"use server";

import connectMongo from "./connect";
import { Schedule, PayrollPeriod } from "../../models/reactDataSchema";
import { ScheduleType, ShiftType, PayrollPeriodType } from "./typeDefinitions";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Fetch all scheduled jobs with their shifts.
 */
export const fetchAllScheduledJobsWithShifts = async (): Promise<
  ScheduleType[]
> => {
  await connectMongo();
  try {
    const scheduledJobs = await Schedule.find();
    return scheduledJobs.map((job) => ({
      _id: job._id.toString(),
      invoiceRef: job.invoiceRef.toString(),
      jobTitle: job.jobTitle || "",
      location: job.location,
      assignedTechnicians: job.assignedTechnicians,
      startDateTime: job.startDateTime.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      confirmed: job.confirmed,
      hours: job.hours,
      shifts: job.shifts || [],
      payrollPeriod: job.payrollPeriod ? job.payrollPeriod.toString() : "",
      deadRun: job.deadRun,
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch all scheduled jobs with shifts");
  }
};
/**
 * Fetch scheduled jobs filtered by a specific payroll period.
 * @param payrollPeriodId - The ID of the payroll period.
 */

export const fetchScheduledJobsByPayrollPeriod = async (
  payrollPeriodId: string,
): Promise<ScheduleType[]> => {
  await connectMongo();
  try {
    const scheduledJobs = await Schedule.find({
      payrollPeriod: payrollPeriodId,
    });

    return scheduledJobs.map((job) => ({
      _id: job._id.toString(),
      invoiceRef: job.invoiceRef.toString(),
      jobTitle: job.jobTitle || "",
      location: job.location,
      assignedTechnicians: job.assignedTechnicians,
      startDateTime: job.startDateTime.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      confirmed: job.confirmed,
      hours: job.hours,
      shifts: job.shifts || [],
      payrollPeriod: job.payrollPeriod.toString(),
      deadRun: job.deadRun,
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch scheduled jobs by payroll period");
  }
};

/**
 * Fetch all payroll periods.
 */
export const fetchAllPayrollPeriods = async (): Promise<
  PayrollPeriodType[]
> => {
  await connectMongo();
  try {
    const payrollPeriods = await PayrollPeriod.find().sort({ startDate: -1 });

    return payrollPeriods.map((pp) => ({
      _id: pp._id.toString(),
      startDate: pp.startDate.toLocaleString("en-US", { timeZone: "UTC" }),
      endDate: pp.endDate.toLocaleString("en-US", { timeZone: "UTC" }),
      cutoffDate: pp.cutoffDate.toLocaleString("en-US", { timeZone: "UTC" }),
      payDay: pp.payDay.toLocaleString("en-US", { timeZone: "UTC" }),
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch payroll periods");
  }
};

/**
 * Fetch shifts for a specific technician within a payroll period.
 * @param technicianId - The ID of the technician.
 * @param payrollPeriodId - The ID of the payroll period.
 */

export const fetchShiftsForTechnician = async (
  technicianId: string,
  payrollPeriodId: string,
): Promise<ShiftType[]> => {
  await connectMongo();
  try {
    const schedules = await Schedule.find({
      assignedTechnicians: technicianId,
      payrollPeriod: payrollPeriodId,
    }).populate("payrollPeriod");

    const shifts = schedules.flatMap(
      (schedule) =>
        schedule.shifts
          ?.filter((shift) => shift.technicianId === technicianId)
          .map((shift) => ({
            _id: shift._id.toString(),
            technicianId: shift.technicianId,
            clockIn: shift.clockIn,
            clockOut: shift.clockOut,
            jobDetails: shift.jobDetails,
            hoursWorked: shift.hoursWorked,
          })) || [],
    );

    return shifts;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch shifts for technician");
  }
};

/**
 * Fetch a technician by ID.
 * @param technicianId - The ID of the technician.
 */
export const fetchTechnicianById = async (
  technicianId: string,
): Promise<Partial<any> | null> => {
  await connectMongo(); // If needed to connect MongoDB
  try {
    const technician = await clerkClient().users.getUser(technicianId); // Fetch from Clerk
    if (!technician) return null;

    // Map only the fields that might exist in Clerk
    return {
      id: technician.id || "",
      name: technician.fullName || "Unknown",
      email: technician.emailAddresses[0]?.emailAddress || "",
      hourlyRate: technician.publicMetadata?.hourlyRate || 0,
      // Add other relevant optional fields from Clerk as needed
    };
  } catch (error) {
    console.error("Error fetching technician from Clerk:", error);
    throw new Error("Failed to fetch technician by ID");
  }
};

/**
 * Fetch a payroll period by ID.
 * @param payrollPeriodId - The ID of the payroll period.
 */
export const fetchPayrollPeriodById = async (
  payrollPeriodId: string,
): Promise<PayrollPeriodType | null> => {
  await connectMongo();
  try {
    const payrollPeriod = await PayrollPeriod.findById(payrollPeriodId);
    if (!payrollPeriod) return null;

    return {
      _id: payrollPeriod._id.toString(),
      startDate: payrollPeriod.startDate.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      endDate: payrollPeriod.endDate.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      cutoffDate: payrollPeriod.cutoffDate.toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      payDay: payrollPeriod.payDay.toLocaleString("en-US", { timeZone: "UTC" }),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch payroll period by ID");
  }
};

export const fetchSchedulesForTechnician = async (
  technicianId: string,
): Promise<ScheduleType[]> => {
  const schedules = await Schedule.find({
    assignedTechnicians: technicianId,
  }).lean();

  return schedules.map((schedule) => ({
    _id: schedule._id.toString(),
    invoiceRef: schedule.invoiceRef.toString(),
    jobTitle: schedule.jobTitle,
    location: schedule.location,
    startDateTime: schedule.startDateTime.toLocaleString("en-US", {
      timeZone: "UTC",
    }),
    assignedTechnicians: schedule.assignedTechnicians,
    confirmed: schedule.confirmed,
    hours: schedule.hours,
    shifts: schedule.shifts,
    payrollPeriod: schedule.payrollPeriod
      ? schedule.payrollPeriod.toString()
      : "",
    deadRun: schedule.deadRun,
  }));
};

export const fetchPayrollPeriodsForTechnician = async (
  technicianId: string,
): Promise<PayrollPeriodType[]> => {
  const schedules = await Schedule.find({
    assignedTechnicians: technicianId,
  }).lean();
  const payrollPeriodIds = schedules
    .map((schedule) => schedule.payrollPeriod)
    .filter((pp) => pp != null)
    .map((pp) => pp.toString());

  const uniquePayrollPeriodIds = Array.from(new Set(payrollPeriodIds));

  const payrollPeriods = await PayrollPeriod.find({
    _id: { $in: uniquePayrollPeriodIds },
  }).lean();

  return payrollPeriods.map((pp) => ({
    _id: pp._id.toString(),
    startDate: pp.startDate.toLocaleString("en-US", { timeZone: "UTC" }),
    endDate: pp.endDate.toLocaleString("en-US", { timeZone: "UTC" }),
    cutoffDate: pp.cutoffDate.toLocaleString("en-US", { timeZone: "UTC" }),
    payDay: pp.payDay.toLocaleString("en-US", { timeZone: "UTC" }),
  }));
};

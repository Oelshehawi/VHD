// lib/scheduleAndShifts.ts

"use server";

import connectMongo from "./connect";
import { Schedule, PayrollPeriod } from "../../models/reactDataSchema";
import { ScheduleType, ShiftType, PayrollPeriodType } from "./typeDefinitions";
import { clerkClient, auth } from "@clerk/nextjs/server";

/**
 * Fetch all scheduled jobs with their shifts.
 * Supports optional date range filtering for performance.
 */
export const fetchAllScheduledJobsWithShifts = async (
  rangeStart?: Date,
  rangeEnd?: Date,
): Promise<ScheduleType[]> => {
  await connectMongo();
  try {
    const query: any = {};

    // Apply date range filter if provided
    if (rangeStart && rangeEnd) {
      query.startDateTime = {
        $gte: rangeStart,
        $lte: rangeEnd,
      };
    }

    const scheduledJobs = await Schedule.find(query).lean();
    return scheduledJobs.map((job: any) => ({
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
      shifts:
        job.shifts?.map((shift: any) => ({
          _id: shift._id.toString(),
          technicianId: shift.technicianId,
          clockIn: shift.clockIn,
          clockOut: shift.clockOut,
          jobDetails: shift.jobDetails,
          hoursWorked: shift.hoursWorked,
        })) || [],
      payrollPeriod: job.payrollPeriod ? job.payrollPeriod.toString() : "",
      deadRun: job.deadRun,
      technicianNotes: job.technicianNotes,
      onSiteContact: job.onSiteContact || undefined,
      accessInstructions: job.accessInstructions || undefined,
      actualServiceDurationMinutes: job.actualServiceDurationMinutes,
      actualServiceDurationSource: job.actualServiceDurationSource,
      historicalServiceDurationMinutes: job.historicalServiceDurationMinutes,
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch all scheduled jobs with shifts");
  }
};

/**
 * Server action for client-side incremental schedule loading.
 * Applies the same visibility rules as the schedule page initial fetch.
 */
export const fetchVisibleScheduledJobsWithShifts = async (
  rangeStartISO: string,
  rangeEndISO: string,
): Promise<ScheduleType[]> => {
  const rangeStart = new Date(rangeStartISO);
  const rangeEnd = new Date(rangeEndISO);

  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    throw new Error("Invalid schedule range");
  }

  if (rangeStart > rangeEnd) {
    throw new Error("Invalid schedule range bounds");
  }

  const [scheduledJobs, authResult] = await Promise.all([
    fetchAllScheduledJobsWithShifts(rangeStart, rangeEnd),
    auth(),
  ]);

  const { sessionClaims, userId } = authResult as any;
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (canManage) {
    return scheduledJobs;
  }

  if (!userId) {
    return [];
  }

  return scheduledJobs.filter((job) =>
    job.assignedTechnicians.includes(userId),
  );
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
    }).lean();

    return scheduledJobs.map((job: any) => ({
      _id: job._id.toString(),
      invoiceRef: job.invoiceRef.toString(),
      jobTitle: job.jobTitle || "",
      location: job.location,
      assignedTechnicians: job.assignedTechnicians,
      startDateTime: new Date(job.startDateTime).toLocaleString("en-US", {
        timeZone: "UTC",
      }),
      confirmed: job.confirmed,
      hours: job.hours,
      shifts:
        job.shifts?.map((shift: any) => ({
          _id: shift._id.toString(),
          technicianId: shift.technicianId,
          clockIn: shift.clockIn,
          clockOut: shift.clockOut,
          jobDetails: shift.jobDetails,
          hoursWorked: shift.hoursWorked,
        })) || [],
      payrollPeriod: job.payrollPeriod ? job.payrollPeriod.toString() : "",
      deadRun: job.deadRun,
      technicianNotes: job.technicianNotes,
      onSiteContact: job.onSiteContact || undefined,
      accessInstructions: job.accessInstructions || undefined,
      actualServiceDurationMinutes: job.actualServiceDurationMinutes,
      actualServiceDurationSource: job.actualServiceDurationSource,
      historicalServiceDurationMinutes: job.historicalServiceDurationMinutes,
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
 * Fetch a technician by ID.
 * @param technicianId - The ID of the technician.
 */
export const fetchTechnicianById = async (
  technicianId: string,
): Promise<Partial<any> | null> => {
  await connectMongo();
  try {
    const technicianget = await clerkClient();

    const technician = await technicianget.users.getUser(technicianId);
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

  return schedules.map((schedule: any) => ({
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
    shifts: schedule.shifts?.map((shift: any) => ({
      _id: shift._id.toString(),
      technicianId: shift.technicianId,
      clockIn: shift.clockIn,
      clockOut: shift.clockOut,
      jobDetails: shift.jobDetails,
      hoursWorked: shift.hoursWorked,
    })),
    payrollPeriod: schedule.payrollPeriod
      ? schedule.payrollPeriod.toString()
      : "",
    deadRun: schedule.deadRun,
    technicianNotes: schedule.technicianNotes,
    onSiteContact: schedule.onSiteContact || undefined,
    accessInstructions: schedule.accessInstructions || undefined,
    actualServiceDurationMinutes: schedule.actualServiceDurationMinutes,
    actualServiceDurationSource: schedule.actualServiceDurationSource,
    historicalServiceDurationMinutes: schedule.historicalServiceDurationMinutes,
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

  return payrollPeriods.map((pp: any) => ({
    _id: pp._id.toString(),
    startDate: pp.startDate.toLocaleString("en-US", { timeZone: "UTC" }),
    endDate: pp.endDate.toLocaleString("en-US", { timeZone: "UTC" }),
    cutoffDate: pp.cutoffDate.toLocaleString("en-US", { timeZone: "UTC" }),
    payDay: pp.payDay.toLocaleString("en-US", { timeZone: "UTC" }),
  }));
};

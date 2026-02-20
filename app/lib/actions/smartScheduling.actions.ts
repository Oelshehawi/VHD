"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import {
  JobsDueSoon,
  Invoice,
  Client,
  Schedule,
} from "../../../models/reactDataSchema";
import type {
  DueInvoiceType,
  ScheduleType,
  TravelTimeRequest,
} from "../typeDefinitions";
import { getBatchTravelTimeSummaries } from "./travelTime.actions";
import { format, parse } from "date-fns";
import {
  parseDateParts,
  toUtcDateFromParts,
  calculateDateDueFromParts,
  calculateNextReminderDateFromParts,
} from "../utils/datePartsUtils";
import { createJobsDueSoonForInvoice } from "./actions";
import { resolveHistoricalDurationForLocation } from "../historicalServiceDuration.data";

export interface ScheduleJobSearchResult {
  _id: string;
  jobTitle: string;
  location: string;
  clientName: string;
  clientId: string;
  invoiceRef: string;
  actualServiceDurationMinutes?: number;
  historicalServiceDurationMinutes?: number;
  startDateTime: string;
}

export interface SerializedScheduleJob {
  _id: string;
  jobTitle: string;
  location: string;
  startDateTime: string;
  assignedTechnicians: string[];
  confirmed: boolean;
  hours: number;
  deadRun: boolean;
}

export interface SerializedTravelSegment {
  from: string;
  to: string;
  typicalMinutes: number;
  km: number;
  travelNotes?: string;
  routePolyline?: string;
  fromKind?: "depot" | "job";
  toKind?: "depot" | "job";
  fromJobId?: string;
  toJobId?: string;
}

export interface DaySchedulingOption {
  date: string;
  dateFormatted: string;
  existingJobsCount: number;
  currentTotalTravelMinutes: number;
  currentTotalTravelKm: number;
  projectedTotalTravelMinutes: number;
  projectedTotalTravelKm: number;
  extraTravelMinutes: number;
  extraTravelKm: number;
  existingJobs: SerializedScheduleJob[];
  projectedSegments: SerializedTravelSegment[];
  isPartial: boolean;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getStoredScheduleDateKey(value: Date | string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value || "").trim();
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const localeMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (localeMatch) {
    const month = Number.parseInt(localeMatch[1] || "0", 10);
    const day = Number.parseInt(localeMatch[2] || "0", 10);
    const year = Number.parseInt(localeMatch[3] || "0", 10);
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

/**
 * Search Schedule jobs by job title or location
 */
export async function searchScheduleJobs(
  query: string,
): Promise<ScheduleJobSearchResult[]> {
  await connectMongo();

  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim();
  const regex = new RegExp(
    searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i",
  );

  const results = await Schedule.aggregate([
    {
      $match: {
        $or: [{ jobTitle: regex }, { location: regex }],
      },
    },
    // Lookup invoice to get client info
    {
      $lookup: {
        from: "invoices",
        localField: "invoiceRef",
        foreignField: "_id",
        as: "invoice",
      },
    },
    {
      $addFields: {
        invoice: { $arrayElemAt: ["$invoice", 0] },
      },
    },
    // Lookup client for name
    {
      $lookup: {
        from: "clients",
        localField: "invoice.clientId",
        foreignField: "_id",
        as: "client",
      },
    },
    {
      $match: {
        $or: [
          { "client.isArchived": { $ne: true } },
          { "client.isArchived": { $exists: false } },
        ],
      },
    },
    {
      $addFields: {
        client: { $arrayElemAt: ["$client", 0] },
      },
    },
    {
      $project: {
        _id: 1,
        jobTitle: 1,
        location: 1,
        invoiceRef: 1,
        actualServiceDurationMinutes: 1,
        historicalServiceDurationMinutes: 1,
        startDateTime: 1,
        clientName: { $ifNull: ["$client.clientName", "Unknown"] },
        clientId: { $ifNull: ["$invoice.clientId", null] },
      },
    },
    { $sort: { startDateTime: -1 } }, // Most recent first
    { $limit: 50 },
  ]);

  return results.map((row) => ({
    _id: String(row._id),
    jobTitle: row.jobTitle || "",
    location: row.location || "",
    clientName: row.clientName || "Unknown",
    clientId: row.clientId ? String(row.clientId) : "",
    invoiceRef: String(row.invoiceRef),
    actualServiceDurationMinutes: row.actualServiceDurationMinutes,
    historicalServiceDurationMinutes: row.historicalServiceDurationMinutes,
    startDateTime:
      row.startDateTime instanceof Date
        ? row.startDateTime.toISOString()
        : String(row.startDateTime),
  }));
}

/**
 * Analyze scheduling options for a Schedule job across a month
 * Returns ranked day suggestions based on drive time impact
 */
export async function analyzeSchedulingOptions(
  scheduleJobId: string,
  monthDate: string, // YYYY-MM-DD format
  newJobLocation: string,
  newJobTitle: string,
  depotAddress: string | null,
  startHour: number = 8,
  startMinute: number = 0,
  durationMinutes: number = 240,
): Promise<DaySchedulingOption[]> {
  await connectMongo();

  const parsedMonth = parseDateParts(monthDate);
  if (!parsedMonth) {
    return [];
  }

  const monthStart = new Date(
    Date.UTC(parsedMonth.year, parsedMonth.month - 1, 1, 0, 0, 0, 0),
  );
  const monthEnd = new Date(
    Date.UTC(parsedMonth.year, parsedMonth.month, 0, 23, 59, 59, 999),
  );

  const todayDateKey = new Date().toISOString().slice(0, 10);
  const totalDaysInMonth = new Date(
    Date.UTC(parsedMonth.year, parsedMonth.month, 0),
  ).getUTCDate();
  const dayKeys: string[] = [];
  for (let day = 1; day <= totalDaysInMonth; day += 1) {
    const dayDate = new Date(
      Date.UTC(parsedMonth.year, parsedMonth.month - 1, day, 0, 0, 0, 0),
    );
    const dateKey = dayDate.toISOString().slice(0, 10);
    if (dateKey < todayDateKey) continue;

    // Exclude Friday (5) and Saturday (6)
    const dow = dayDate.getUTCDay();
    if (dow === 5 || dow === 6) continue;

    dayKeys.push(dateKey);
  }

  // Fetch all scheduled jobs in the month
  const schedules = await Schedule.find({
    startDateTime: {
      $gte: monthStart,
      $lte: monthEnd,
    },
  }).lean();

  // Group jobs by date and serialize for client components
  const jobsByDate = new Map<string, ScheduleType[]>();
  const serializedJobsByDate = new Map<string, SerializedScheduleJob[]>();
  schedules.forEach((schedule: any) => {
    const dateKey = getStoredScheduleDateKey(schedule.startDateTime);
    if (!dateKey) return;
    if (!jobsByDate.has(dateKey)) {
      jobsByDate.set(dateKey, []);
      serializedJobsByDate.set(dateKey, []);
    }
    jobsByDate.get(dateKey)!.push(schedule as unknown as ScheduleType);
    serializedJobsByDate.get(dateKey)!.push({
      _id: String(schedule._id),
      jobTitle: schedule.jobTitle || "",
      location: schedule.location || "",
      startDateTime:
        schedule.startDateTime instanceof Date
          ? schedule.startDateTime.toISOString()
          : String(schedule.startDateTime),
      assignedTechnicians: schedule.assignedTechnicians || [],
      confirmed: schedule.confirmed || false,
      hours: schedule.hours || 4,
      deadRun: schedule.deadRun || false,
    });
  });

  // Get source job for invoice linkage in projected records
  const sourceJob = (await Schedule.findById(scheduleJobId, {
    invoiceRef: 1,
  }).lean()) as any;
  if (!sourceJob) {
    return [];
  }

  // Duration now comes from client input; fallback remains 4 hours.
  const parsedDuration = Number(durationMinutes);
  const estimatedDurationMinutes =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? Math.min(24 * 60, Math.round(parsedDuration))
      : 240;

  // Calculate current travel times for each day
  const currentTravelRequests: TravelTimeRequest[] = [];
  for (const dateKey of dayKeys) {
    const dayJobs = jobsByDate.get(dateKey) || [];

    if (dayJobs.length > 0) {
      currentTravelRequests.push({
        date: dateKey,
        jobs: dayJobs,
        depotAddress,
      });
    }
  }

  // Get current travel time summaries
  const currentSummaries = await getBatchTravelTimeSummaries(
    currentTravelRequests,
  );
  const currentTravelByDate = new Map<
    string,
    { minutes: number; km: number }
  >();
  currentSummaries.forEach((summary) => {
    currentTravelByDate.set(summary.date, {
      minutes: summary.totalTravelMinutes,
      km: summary.totalTravelKm,
    });
  });

  // Now calculate projected travel times with the new job added
  const projectedTravelRequests: TravelTimeRequest[] = [];

  for (const dateKey of dayKeys) {
    const dayJobs = jobsByDate.get(dateKey) || [];
    const dayParts = parseDateParts(dateKey);
    if (!dayParts) {
      continue;
    }

    const dayStart = new Date(
      Date.UTC(
        dayParts.year,
        dayParts.month - 1,
        dayParts.day,
        startHour,
        startMinute,
        0,
        0,
      ),
    );

    const newJob: ScheduleType = {
      _id: "new-job-temp" as any,
      jobTitle: newJobTitle,
      location: newJobLocation,
      startDateTime: dayStart.toISOString(),
      assignedTechnicians: [], // Will be assigned in wizard
      confirmed: false,
      invoiceRef: sourceJob.invoiceRef?.toString() || "",
      hours: Math.max(1, Math.ceil(estimatedDurationMinutes / 60)), // Convert minutes to hours
      payrollPeriod: "",
      deadRun: false,
    } as ScheduleType;

    // Add new job to the day's jobs
    const jobsWithNew = [...dayJobs, newJob];

    if (jobsWithNew.length > 0) {
      projectedTravelRequests.push({
        date: dateKey,
        jobs: jobsWithNew,
        depotAddress,
      });
    }
  }

  // Get projected travel time summaries (includes segments + polylines for map)
  const projectedSummaries = await getBatchTravelTimeSummaries(
    projectedTravelRequests,
  );
  const projectedByDate = new Map<
    string,
    {
      minutes: number;
      km: number;
      segments: SerializedTravelSegment[];
      isPartial: boolean;
    }
  >();
  projectedSummaries.forEach((summary) => {
    projectedByDate.set(summary.date, {
      minutes: summary.totalTravelMinutes,
      km: summary.totalTravelKm,
      segments: summary.segments.map((seg) => ({
        from: seg.from,
        to: seg.to,
        typicalMinutes: Math.round(seg.typicalMinutes),
        km: Math.round(seg.km * 10) / 10,
        travelNotes: seg.travelNotes,
        routePolyline: seg.routePolyline,
        fromKind: seg.fromKind,
        toKind: seg.toKind,
        fromJobId: seg.fromJobId,
        toJobId: seg.toJobId,
      })),
      isPartial: summary.isPartial,
    });
  });

  // Build options with rankings
  const options: DaySchedulingOption[] = dayKeys.map((dateKey) => {
    const current = currentTravelByDate.get(dateKey) || { minutes: 0, km: 0 };
    const projected = projectedByDate.get(dateKey) || {
      minutes: 0,
      km: 0,
      segments: [],
      isPartial: false,
    };
    const extraMinutes = Math.round(projected.minutes - current.minutes);
    const extraKm = Math.round((projected.km - current.km) * 10) / 10;

    return {
      date: dateKey,
      dateFormatted: format(
        parse(dateKey, "yyyy-MM-dd", new Date()),
        "EEEE, MMM d",
      ),
      existingJobsCount: (serializedJobsByDate.get(dateKey) || []).length,
      currentTotalTravelMinutes: Math.round(current.minutes),
      currentTotalTravelKm: Math.round(current.km * 10) / 10,
      projectedTotalTravelMinutes: Math.round(projected.minutes),
      projectedTotalTravelKm: Math.round(projected.km * 10) / 10,
      extraTravelMinutes: extraMinutes,
      extraTravelKm: extraKm,
      existingJobs: serializedJobsByDate.get(dateKey) || [],
      projectedSegments: projected.segments,
      isPartial: projected.isPartial,
    };
  });

  // Sort by projected total travel time (least total first), then by existing jobs count
  options.sort((a, b) => {
    if (a.projectedTotalTravelMinutes !== b.projectedTotalTravelMinutes) {
      return a.projectedTotalTravelMinutes - b.projectedTotalTravelMinutes;
    }
    return a.existingJobsCount - b.existingJobsCount;
  });

  return options;
}

/**
 * Get full Schedule job details including invoice and client info
 */
export async function getScheduleJobDetails(scheduleJobId: string): Promise<{
  schedule: ScheduleType;
  invoice: any;
  client: any;
} | null> {
  await connectMongo();

  const schedule = (await Schedule.findById(scheduleJobId).lean()) as any;
  if (!schedule) {
    return null;
  }

  const invoice = await Invoice.findById(schedule.invoiceRef).lean();
  if (!invoice) {
    return null;
  }

  const client = await Client.findById((invoice as any).clientId).lean();
  if (!client) {
    return null;
  }

  return {
    schedule: schedule as unknown as ScheduleType,
    invoice,
    client,
  };
}

/**
 * Create a new invoice and schedule from an existing Schedule job
 */
export async function createInvoiceAndScheduleFromJob(
  sourceScheduleJobId: string,
  dateIssued: string, // YYYY-MM-DD format
  startDateTime: string, // ISO string
  assignedTechnicians: string[],
  technicianNotes?: string,
  accessInstructions?: string,
  onSiteContact?: { name: string; phone: string; email?: string },
): Promise<{
  success: boolean;
  invoiceId?: string;
  scheduleId?: string;
  error?: string;
}> {
  await connectMongo();

  try {
    // Get source schedule job
    const sourceSchedule = (await Schedule.findById(
      sourceScheduleJobId,
    ).lean()) as any;
    if (!sourceSchedule) {
      return { success: false, error: "Source schedule job not found" };
    }

    // Get source invoice
    const sourceInvoice = (await Invoice.findById(
      sourceSchedule.invoiceRef,
    ).lean()) as any;
    if (!sourceInvoice) {
      return { success: false, error: "Source invoice not found" };
    }

    // Get client
    const client = (await Client.findById(
      sourceInvoice.clientId,
    ).lean()) as any;
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Generate new invoice number
    const clientPrefix = client.prefix || "CLIENT";
    const latestInvoice = await Invoice.findOne({ clientId: client._id })
      .sort({ invoiceId: -1 })
      .lean();

    let newInvoiceNumber = 0;
    if (latestInvoice) {
      const latestId = (latestInvoice as any).invoiceId as string;
      const parts = latestId.split("-");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const latestNumber = parseInt(lastPart, 10);
        if (!isNaN(latestNumber)) {
          newInvoiceNumber = latestNumber + 1;
        }
      }
    }

    const invoiceIdStr = `${clientPrefix}-${newInvoiceNumber.toString().padStart(3, "0")}`;

    // Parse dates
    const dateIssuedParts = parseDateParts(dateIssued);
    if (!dateIssuedParts) {
      return { success: false, error: "Invalid dateIssued format" };
    }

    const dateIssuedDate = toUtcDateFromParts(dateIssuedParts);
    const frequency = sourceInvoice.frequency || 2;
    const dateDue =
      calculateDateDueFromParts(dateIssuedParts, frequency) ?? dateIssuedDate;

    // Create new invoice copying from source
    const newInvoice = new Invoice({
      invoiceId: invoiceIdStr,
      clientId: client._id,
      jobTitle: sourceInvoice.jobTitle,
      location: sourceInvoice.location,
      items:
        sourceInvoice.items?.map((item: any) => ({
          description: item.description,
          details: item.details || "",
          price: item.price,
        })) || [],
      notes: sourceInvoice.notes || "",
      frequency: frequency,
      dateIssued: dateIssuedDate,
      dateDue,
      status: "pending",
      paymentReminders: sourceInvoice.paymentReminders
        ? {
            enabled: sourceInvoice.paymentReminders.enabled,
            frequency: sourceInvoice.paymentReminders.frequency,
            nextReminderDate:
              sourceInvoice.paymentReminders.enabled &&
              sourceInvoice.paymentReminders.frequency &&
              sourceInvoice.paymentReminders.frequency !== "none"
                ? calculateNextReminderDateFromParts(
                    dateIssuedParts,
                    sourceInvoice.paymentReminders.frequency,
                  )
                : undefined,
            lastReminderSent: undefined,
            reminderHistory: [],
          }
        : undefined,
    } as any);

    await newInvoice.save();

    // Create JobsDueSoon record
    await createJobsDueSoonForInvoice(
      newInvoice._id.toString(),
      client._id.toString(),
      sourceInvoice.jobTitle || "",
      dateDue,
    );

    const parsedStartDateTime = new Date(startDateTime);
    if (Number.isNaN(parsedStartDateTime.getTime())) {
      return { success: false, error: "Invalid startDateTime format" };
    }

    // Create schedule using the same direct-save pattern as auto scheduling requests.
    const scheduleData: any = {
      invoiceRef: newInvoice._id,
      jobTitle: String(sourceInvoice.jobTitle || "").trim(),
      location: String(sourceInvoice.location || "").trim(),
      startDateTime: parsedStartDateTime,
      assignedTechnicians: Array.isArray(assignedTechnicians)
        ? assignedTechnicians
        : [],
      confirmed: false,
      hours: sourceSchedule.actualServiceDurationMinutes
        ? Math.ceil(sourceSchedule.actualServiceDurationMinutes / 60)
        : sourceSchedule.historicalServiceDurationMinutes
          ? Math.ceil(sourceSchedule.historicalServiceDurationMinutes / 60)
          : sourceSchedule.hours || 4,
      deadRun: false,
      technicianNotes: technicianNotes || "",
      accessInstructions: accessInstructions || "",
      onSiteContact: onSiteContact || undefined,
    };

    const historicalMinutes = await resolveHistoricalDurationForLocation(
      scheduleData.location,
    );
    if (historicalMinutes != null) {
      scheduleData.historicalServiceDurationMinutes = historicalMinutes;
    }

    const createdSchedule = new Schedule(scheduleData as ScheduleType);
    await createdSchedule.save();

    const scheduleId = createdSchedule._id.toString();

    revalidatePath("/schedule");

    return {
      success: true,
      invoiceId: newInvoice._id.toString(),
      scheduleId,
    };
  } catch (error: any) {
    console.error("Error creating invoice and schedule:", error);
    return {
      success: false,
      error: error.message || "Failed to create invoice and schedule",
    };
  }
}

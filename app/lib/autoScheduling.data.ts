/**
 * Auto Scheduling Data Functions
 *
 * These are data-fetching functions that should NOT be server actions.
 * No "use server" directive - these are GET operations, not mutations.
 */

import connectMongo from "./connect";
import { getEmailForPurpose } from "./utils";
import {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  SchedulingRequest,
} from "../../models/reactDataSchema";
import {
  ClientSchedulingPattern,
  SchedulingRequestType,
  SchedulingContext,
  DueInvoiceType,
  ClientType,
  InvoiceType,
  DayAvailability,
  RequestedTime,
} from "./typeDefinitions";

/**
 * Validate a scheduling token and return full context for the scheduling page
 */
export async function getSchedulingContext(
  token: string,
  requestedTime?: RequestedTime,
  estimatedHours: number = 4,
): Promise<SchedulingContext> {
  await connectMongo();

  try {
    // Find JobsDueSoon by token
    const jobsDueSoon = (await JobsDueSoon.findOne({
      schedulingToken: token,
      schedulingTokenExpiry: { $gt: new Date() },
    }).lean()) as DueInvoiceType | null;

    if (!jobsDueSoon) {
      return { valid: false, error: "Invalid or expired scheduling link" };
    }

    // Check if already has a scheduling request
    if (jobsDueSoon.schedulingRequestId) {
      const existingRequest = (await SchedulingRequest.findById(
        jobsDueSoon.schedulingRequestId,
      ).lean()) as SchedulingRequestType | null;
      if (
        existingRequest &&
        existingRequest.status !== "expired" &&
        existingRequest.status !== "cancelled"
      ) {
        // Return the existing request so page can show success state
        return {
          valid: false,
          error: "A scheduling request has already been submitted for this job",
          existingRequest: JSON.parse(JSON.stringify(existingRequest)),
        };
      }
    }

    // Fetch client and invoice
    const [client, invoice] = await Promise.all([
      Client.findById(
        jobsDueSoon.clientId,
      ).lean() as Promise<ClientType | null>,
      Invoice.findById(
        jobsDueSoon.invoiceId,
      ).lean() as Promise<InvoiceType | null>,
    ]);

    if (!client || !invoice) {
      return { valid: false, error: "Client or invoice not found" };
    }

    // Get client's scheduling pattern
    const pattern = await getClientSchedulingPattern(
      jobsDueSoon.clientId.toString(),
    );

    // Use pattern's usual time if no specific time requested
    const timeToCheck = requestedTime ||
      pattern?.usualTime || { hour: 9, minute: 0 };

    // Get available days for next 12 weeks
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks

    const availableDays = await getAvailableDays(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      timeToCheck,
      (invoice as any).estimatedHours || estimatedHours,
    );

    return {
      valid: true,
      jobsDueSoon: JSON.parse(JSON.stringify(jobsDueSoon)),
      client: JSON.parse(JSON.stringify(client)),
      invoice: JSON.parse(JSON.stringify(invoice)),
      pattern: pattern || undefined,
      availableDays,
    };
  } catch (error) {
    console.error("Error getting scheduling context:", error);
    return { valid: false, error: "Failed to load scheduling information" };
  }
}

/**
 * Analyze client's historical schedules to determine their "usual" day/time
 */
export async function getClientSchedulingPattern(
  clientId: string,
): Promise<ClientSchedulingPattern | null> {
  await connectMongo();

  try {
    // Get all invoices for this client
    const clientInvoices = await Invoice.find({ clientId })
      .select("_id")
      .lean();
    const invoiceIds = clientInvoices.map((inv) => inv._id);

    if (invoiceIds.length === 0) {
      return null;
    }

    // Get past schedules for this client (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const schedules = await Schedule.find({
      invoiceRef: { $in: invoiceIds },
      startDateTime: { $gte: twoYearsAgo },
    })
      .sort({ startDateTime: -1 })
      .limit(20)
      .lean();

    if (schedules.length < 1) {
      return null; // Not enough data to determine pattern
    }

    // Count occurrences of each day
    const dayCounts: Record<number, number> = {};
    // Track exact times (rounded to nearest 15 min)
    const exactTimeCounts: Record<string, number> = {};

    for (const schedule of schedules) {
      // Extract time from ISO string to avoid timezone conversion issues
      const dateStr =
        schedule.startDateTime instanceof Date
          ? schedule.startDateTime.toISOString()
          : String(schedule.startDateTime);

      // Parse the ISO string directly to get UTC values
      const date = new Date(dateStr);
      const dayOfWeek = date.getUTCDay();
      const hour = date.getUTCHours();
      const minute = date.getUTCMinutes();

      // Count day
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;

      // Count exact time (round to nearest 15 min)
      let roundedMinute = Math.round(minute / 15) * 15;
      let roundedHour = hour;
      if (roundedMinute === 60) {
        roundedMinute = 0;
        roundedHour = (roundedHour + 1) % 24;
      }
      const exactTimeKey = `${roundedHour}:${roundedMinute}`;
      exactTimeCounts[exactTimeKey] = (exactTimeCounts[exactTimeKey] || 0) + 1;
    }

    // Find most common day
    const sortedDays = Object.entries(dayCounts).sort(([, a], [, b]) => b - a);
    const usualDayEntry = sortedDays[0];
    if (!usualDayEntry) {
      return null;
    }
    const [usualDay] = usualDayEntry;
    const usualDayOfWeek = parseInt(usualDay, 10);

    // Find most common exact time
    const sortedExactTimes = Object.entries(exactTimeCounts).sort(
      ([, a], [, b]) => b - a,
    );
    let usualTime: RequestedTime = { hour: 9, minute: 0 }; // Default
    if (sortedExactTimes.length > 0 && sortedExactTimes[0]) {
      const [timeStr] = sortedExactTimes[0];
      const [hourStr, minuteStr] = timeStr.split(":");
      usualTime = {
        hour: parseInt(hourStr || "9", 10),
        minute: parseInt(minuteStr || "0", 10),
      };
    }

    // Calculate confidence based on consistency
    const totalSchedules = schedules.length;
    const topDayCount = usualDayEntry[1] || 0;
    const confidence = topDayCount / totalSchedules;

    return {
      usualDayOfWeek,
      usualTime,
      confidence,
    };
  } catch (error) {
    console.error("Error getting client scheduling pattern:", error);
    return null;
  }
}

/**
 * Get available days for a date range, checking if specific time + duration conflicts
 * with existing schedules.
 *
 * @param startDate - Start of date range (YYYY-MM-DD)
 * @param endDate - End of date range (YYYY-MM-DD)
 * @param requestedTime - The exact time being requested (hour, minute)
 * @param estimatedHours - How long the job will take
 */
export async function getAvailableDays(
  startDate: string,
  endDate: string,
  requestedTime?: RequestedTime,
  estimatedHours: number = 4,
): Promise<DayAvailability[]> {
  await connectMongo();

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Default time if not provided
    const reqTime = requestedTime || { hour: 9, minute: 0 };

    // Get all schedules in the date range
    const schedules = await Schedule.find({
      startDateTime: { $gte: start, $lte: end },
    })
      .select("startDateTime hours")
      .lean();

    // Build a map of busy time ranges by date
    const busyTimes: Record<
      string,
      Array<{ blockedStart: number; blockedEnd: number }>
    > = {};

    for (const schedule of schedules) {
      const date = new Date(schedule.startDateTime);
      const dateKey = date.toISOString().slice(0, 10);
      const startHour = date.getUTCHours();
      const startMinute = date.getUTCMinutes();
      const durationHours = schedule.hours || 4;

      // TODO: Revisit buffer logic in more detail in the future
      // Using 50% of duration as buffer (extends both before AND after)
      // This prevents overlapping bookings (e.g., 9am can't book if 8:30am exists)
      const bufferMinutes = durationHours * 0.5 * 60;

      // Calculate time in minutes from midnight
      const jobStartMinutes = startHour * 60 + startMinute;

      // Buffer extends both directions: before and after the job start
      // 9am job with 4hr = 2hr buffer → blocks 7am-11am
      const blockedStart = jobStartMinutes - bufferMinutes;
      const blockedEnd = jobStartMinutes + bufferMinutes;

      if (!busyTimes[dateKey]) {
        busyTimes[dateKey] = [];
      }
      busyTimes[dateKey]!.push({ blockedStart, blockedEnd });
    }

    // Calculate the requested time range (using 50% buffer extending both ways)
    // TODO: Revisit buffer logic in more detail in the future
    const bufferMinutes = estimatedHours * 0.5 * 60;
    const reqTimeMinutes = reqTime.hour * 60 + reqTime.minute;
    const reqBlockedStart = reqTimeMinutes - bufferMinutes;
    const reqBlockedEnd = reqTimeMinutes + bufferMinutes;

    // Generate availability for each day
    const availability: DayAvailability[] = [];
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    while (current <= end) {
      const dateKey = current.toISOString().slice(0, 10);
      const dayOfWeek = current.getUTCDay();
      const isPast = current.getTime() < today.getTime();

      // Friday (5) and Saturday (6) are unavailable
      const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;

      if (isFridayOrSaturday) {
        availability.push({
          date: dateKey,
          available: false,
          conflictReason: "We don't work on Fridays or Saturdays",
        });
      } else if (isPast) {
        availability.push({
          date: dateKey,
          available: false,
          conflictReason: "Date has passed",
        });
      } else {
        // Check for schedule conflicts
        const dayBusyTimes = busyTimes[dateKey] || [];
        let hasConflict = false;

        for (const busy of dayBusyTimes) {
          // Check for overlap using strict inequality (< and >) so edges are bookable
          // Example: 9am job with 3hr buffer blocks 6:01am-11:59am
          // So 6am and 12pm requests are still available
          if (
            reqBlockedEnd > busy.blockedStart &&
            reqBlockedStart < busy.blockedEnd
          ) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) {
          availability.push({
            date: dateKey,
            available: false,
            conflictReason: "Already booked at this time",
          });
        } else {
          availability.push({
            date: dateKey,
            available: true,
          });
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return availability;
  } catch (error) {
    console.error("Error getting available days:", error);
    return [];
  }
}

/**
 * Fetch updated availability for a specific time (used when user changes custom time)
 */
export async function refreshAvailability(
  token: string,
  requestedTime: RequestedTime,
  estimatedHours: number = 4,
): Promise<DayAvailability[]> {
  await connectMongo();

  try {
    // Validate token first
    const jobsDueSoon = (await JobsDueSoon.findOne({
      schedulingToken: token,
      schedulingTokenExpiry: { $gt: new Date() },
    }).lean()) as DueInvoiceType | null;

    if (!jobsDueSoon) {
      return [];
    }

    // Get availability for next 12 weeks
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks

    return await getAvailableDays(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      requestedTime,
      estimatedHours,
    );
  } catch (error) {
    console.error("Error refreshing availability:", error);
    return [];
  }
}

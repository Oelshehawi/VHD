/**
 * Auto Scheduling Data Functions
 *
 * These are data-fetching functions that should NOT be server actions.
 * No "use server" directive - these are GET operations, not mutations.
 */

import { createHash } from "crypto";
import connectMongo from "./connect";
import {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  SchedulingRequest,
  TravelTimeCache,
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
import {
  BUSINESS_TIME_ZONE,
  fakeUtcStoredToRealUtcIso,
  getEffectiveServiceDurationMinutes,
  getPlanningServiceWindowMinutes,
} from "./serviceDurationRules";
import { SERVICE_DAY_CUTOFF_HOUR } from "./utils/scheduleDayUtils";
import { resolveHistoricalDurationForLocation } from "./historicalServiceDuration.data";

const SCHEDULING_HORIZON_DAYS = 365; // hard cap at 1 year from today
const DEFAULT_DEPOT_FALLBACK_ADDRESS = "7151 Lindsay Rd Richmond, BC V7C 2P5";
const DAILY_TRAVEL_LIMIT_MINUTES = 4 * 60;
const CLOSE_ROUTE_MAX_MINUTES = 30;
const DEPOT_RETURN_GAP_MINUTES = 2 * 60;
const CACHE_TTL_DAYS = 90;
const GOOGLE_ROUTES_CONCURRENCY_LIMIT = 5;
const HOUR_BUCKET_SIZE = 2;
const AUTO_SCHEDULING_DEBUG = (() => {
  const raw = (process.env.AUTO_SCHEDULING_DEBUG || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
})();
const AUTO_SCHEDULING_DEBUG_DATE = (
  process.env.AUTO_SCHEDULING_DEBUG_DATE || ""
).trim();

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const DEPARTURE_BUCKET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  hour12: false,
});

function normalizeAddress(address: string): string {
  return address
    .trim()
    .toLowerCase()
    .replace(/\bst\b/g, "street")
    .replace(/\bave\b/g, "avenue")
    .replace(/\bdr\b/g, "drive")
    .replace(/\brd\b/g, "road")
    .replace(/\bblvd\b/g, "boulevard")
    .replace(/\bcrt\b/g, "court")
    .replace(/\bct\b/g, "court")
    .replace(/\bpl\b/g, "place")
    .replace(/\bcres\b/g, "crescent")
    .replace(/\bhwy\b/g, "highway")
    .replace(/\s+/g, " ");
}

function getDepartureBucketKey(departureDateTimeIso: string): string {
  const realUtcIso =
    fakeUtcStoredToRealUtcIso(departureDateTimeIso) ?? departureDateTimeIso;
  const parsed = new Date(realUtcIso);
  if (Number.isNaN(parsed.getTime())) {
    return "wX|hX";
  }

  const parts = DEPARTURE_BUCKET_FORMATTER.formatToParts(parsed);
  const weekdayLabel =
    parts.find((part) => part.type === "weekday")?.value || "";
  const hourLabel = parts.find((part) => part.type === "hour")?.value || "";

  const weekday = WEEKDAY_INDEX[weekdayLabel] ?? parsed.getUTCDay();
  const hourParsed = Number.parseInt(hourLabel, 10);
  const hour = Number.isFinite(hourParsed)
    ? Math.min(23, Math.max(0, hourParsed === 24 ? 0 : hourParsed))
    : parsed.getUTCHours();
  const hourBucket = Math.floor(hour / HOUR_BUCKET_SIZE);
  return `w${weekday}|h${hourBucket}`;
}

function computeTravelPairHash(
  origin: string,
  destination: string,
  departureDateTimeIso: string,
): string {
  const normalized = `${normalizeAddress(origin)}|${normalizeAddress(destination)}|${getDepartureBucketKey(departureDateTimeIso)}`;
  return createHash("sha256").update(normalized).digest("hex");
}

function isoFromDateKeyAndMinutes(dateKey: string, minutes: number): string {
  const [year, month, day] = dateKey.split("-").map((v) => Number(v));
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return new Date(
    Date.UTC(
      year || 1970,
      (month || 1) - 1,
      day || 1,
      Math.max(0, hour),
      Math.max(0, minute),
      0,
      0,
    ),
  ).toISOString();
}

function getServiceDayDateKey(date: Date): string {
  // Service-day cutoff changes ordering, not date grouping.
  // Keep records on their stored date key.
  return date.toISOString().slice(0, 10);
}

function toServiceDayMinutes(hour: number, minute: number): number {
  const adjustedHour = hour < SERVICE_DAY_CUTOFF_HOUR ? hour + 24 : hour;
  return adjustedHour * 60 + minute;
}

function shouldLogAutoSchedulingDebug(dateKey?: string): boolean {
  if (!AUTO_SCHEDULING_DEBUG) {
    return false;
  }
  if (!AUTO_SCHEDULING_DEBUG_DATE) {
    return true;
  }
  return Boolean(dateKey && dateKey === AUTO_SCHEDULING_DEBUG_DATE);
}

function logAutoSchedulingDebug(
  event: string,
  payload: Record<string, unknown>,
  dateKey?: string,
): void {
  if (!shouldLogAutoSchedulingDebug(dateKey)) {
    return;
  }
  console.info(`[auto-scheduling][${event}] ${JSON.stringify(payload)}`);
}

type BusyDayWindow = {
  blockedStart: number;
  blockedEnd: number;
  travelEnd: number;
  location: string;
};

type TravelPairInput = {
  origin: string;
  destination: string;
  departureDateTimeIso: string;
};

type TravelSegmentHash = {
  pairHash: string;
  pair: TravelPairInput;
};

type HydratedTravelEstimate = {
  originAddress: string;
  destinationAddress: string;
  pairHash: string;
  typicalMinutes: number;
  estimatedKm: number;
};

function sanitizeEstimateValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 10) / 10);
}

function parseGoogleDurationSeconds(duration: string): number {
  const match = duration.match(/^(\d+)s$/);
  if (!match) return 0;
  return Number.parseInt(match[1] || "0", 10);
}

function buildTravelSegmentHash(
  origin: string,
  destination: string,
  departureDateTimeIso: string,
): TravelSegmentHash {
  return {
    pairHash: computeTravelPairHash(origin, destination, departureDateTimeIso),
    pair: {
      origin,
      destination,
      departureDateTimeIso,
    },
  };
}

async function fetchGoogleRouteEstimate(
  pair: TravelPairInput,
  apiKey: string,
): Promise<HydratedTravelEstimate | null> {
  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: pair.origin },
          destination: { address: pair.destination },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          ...(() => {
            const realDeparture =
              fakeUtcStoredToRealUtcIso(pair.departureDateTimeIso) ??
              pair.departureDateTimeIso;
            return new Date(realDeparture).getTime() > Date.now()
              ? { departureTime: realDeparture }
              : {};
          })(),
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route?.duration || !route?.distanceMeters) {
      return null;
    }

    const durationSeconds = parseGoogleDurationSeconds(String(route.duration));
    const distanceKm = Number(route.distanceMeters) / 1000;

    return {
      originAddress: pair.origin,
      destinationAddress: pair.destination,
      pairHash: computeTravelPairHash(
        pair.origin,
        pair.destination,
        pair.departureDateTimeIso,
      ),
      typicalMinutes: sanitizeEstimateValue(durationSeconds / 60),
      estimatedKm: sanitizeEstimateValue(distanceKm),
    };
  } catch {
    return null;
  }
}

async function hydrateMissingTravelEstimates(
  pairs: TravelPairInput[],
): Promise<Map<string, number>> {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey || pairs.length === 0) {
    return new Map();
  }

  const dedupedByHash = new Map<string, TravelPairInput>();
  for (const pair of pairs) {
    const hash = computeTravelPairHash(
      pair.origin,
      pair.destination,
      pair.departureDateTimeIso,
    );
    if (!dedupedByHash.has(hash)) {
      dedupedByHash.set(hash, pair);
    }
  }

  const uniquePairs = Array.from(dedupedByHash.values());
  const estimates: HydratedTravelEstimate[] = [];

  for (
    let idx = 0;
    idx < uniquePairs.length;
    idx += GOOGLE_ROUTES_CONCURRENCY_LIMIT
  ) {
    const batch = uniquePairs.slice(idx, idx + GOOGLE_ROUTES_CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((pair) => fetchGoogleRouteEstimate(pair, apiKey)),
    );
    for (const estimate of batchResults) {
      if (estimate) {
        estimates.push(estimate);
      }
    }
  }

  if (estimates.length === 0) {
    return new Map();
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  await TravelTimeCache.bulkWrite(
    estimates.map((estimate) => ({
      updateOne: {
        filter: { pairHash: estimate.pairHash },
        update: {
          $set: {
            originAddress: estimate.originAddress,
            destinationAddress: estimate.destinationAddress,
            pairHash: estimate.pairHash,
            typicalMinutes: estimate.typicalMinutes,
            estimatedKm: estimate.estimatedKm,
            expiresAt,
          },
        },
        upsert: true,
      },
    })),
  );

  return new Map(
    estimates.map((estimate) => [estimate.pairHash, estimate.typicalMinutes]),
  );
}

function buildDayTravelSegments(
  dateKey: string,
  dayBusyTimes: BusyDayWindow[],
): TravelSegmentHash[] {
  if (dayBusyTimes.length === 0) {
    return [];
  }

  const routePoints: Array<{ location: string; departureMinutes: number }> = [];
  const firstJob = dayBusyTimes[0]!;
  routePoints.push({
    location: DEFAULT_DEPOT_FALLBACK_ADDRESS,
    departureMinutes: firstJob.blockedStart,
  });

  for (let idx = 0; idx < dayBusyTimes.length; idx++) {
    const currentJob = dayBusyTimes[idx]!;
    const nextJob = dayBusyTimes[idx + 1];

    routePoints.push({
      location: currentJob.location,
      departureMinutes: currentJob.travelEnd,
    });

    if (
      nextJob &&
      nextJob.blockedStart - currentJob.travelEnd >= DEPOT_RETURN_GAP_MINUTES
    ) {
      routePoints.push({
        location: DEFAULT_DEPOT_FALLBACK_ADDRESS,
        departureMinutes: currentJob.travelEnd,
      });
      routePoints.push({
        location: DEFAULT_DEPOT_FALLBACK_ADDRESS,
        departureMinutes: nextJob.blockedStart,
      });
    }
  }

  const lastJob = dayBusyTimes[dayBusyTimes.length - 1]!;
  routePoints.push({
    location: DEFAULT_DEPOT_FALLBACK_ADDRESS,
    departureMinutes: lastJob.travelEnd,
  });

  const segments: TravelSegmentHash[] = [];
  for (let idx = 0; idx < routePoints.length - 1; idx++) {
    const from = routePoints[idx]!;
    const to = routePoints[idx + 1]!;

    if (normalizeAddress(from.location) === normalizeAddress(to.location)) {
      continue;
    }

    segments.push(
      buildTravelSegmentHash(
        from.location,
        to.location,
        isoFromDateKeyAndMinutes(dateKey, from.departureMinutes),
      ),
    );
  }

  return segments;
}

export function getSchedulingDateRange(_dueDateInput?: string | Date | null): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + SCHEDULING_HORIZON_DAYS);

  return { startDate, endDate };
}

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

    const requestedEstimatedHoursRaw = Number((invoice as any).estimatedHours);
    const requestedEstimatedHours =
      Number.isFinite(requestedEstimatedHoursRaw) &&
      requestedEstimatedHoursRaw > 0
        ? requestedEstimatedHoursRaw
        : estimatedHours;
    const requestedHistoricalServiceDurationMinutes =
      await resolveHistoricalDurationForLocation(invoice.location);

    // Get client's scheduling pattern
    const pattern = await getClientSchedulingPattern(
      jobsDueSoon.clientId.toString(),
    );

    // Use pattern's usual time if no specific time requested
    const timeToCheck = requestedTime ||
      pattern?.usualTime || { hour: 9, minute: 0 };

    // Get available days across the scheduling horizon.
    const { startDate, endDate } = getSchedulingDateRange(
      jobsDueSoon.dateDue || invoice.dateDue,
    );

    const availableDays = await getAvailableDays(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      timeToCheck,
      requestedEstimatedHours,
      invoice.location,
      requestedHistoricalServiceDurationMinutes,
    );

    return {
      valid: true,
      jobsDueSoon: JSON.parse(JSON.stringify(jobsDueSoon)),
      client: JSON.parse(JSON.stringify(client)),
      invoice: JSON.parse(JSON.stringify(invoice)),
      pattern: pattern || undefined,
      availableDays,
      requestedEstimatedHours,
      requestedHistoricalServiceDurationMinutes,
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
  requestedLocation?: string,
  requestedHistoricalServiceDurationMinutes?: number | null,
): Promise<DayAvailability[]> {
  await connectMongo();

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const queryStart = new Date(start);
    queryStart.setUTCHours(0, 0, 0, 0);
    const queryEnd = new Date(end);
    queryEnd.setUTCDate(queryEnd.getUTCDate() + 1);
    queryEnd.setUTCHours(SERVICE_DAY_CUTOFF_HOUR, 0, 0, 0);

    // Default time if not provided
    const reqTime = requestedTime || { hour: 9, minute: 0 };

    // Get all schedules in the date range
    const schedules = await Schedule.find({
      startDateTime: { $gte: queryStart, $lt: queryEnd },
    })
      .select(
        "startDateTime hours actualServiceDurationMinutes historicalServiceDurationMinutes location",
      )
      .lean();

    // Build a map of planned windows by date.
    // Planning windows use effective service duration + a fixed turnaround buffer.
    const busyTimes: Record<string, BusyDayWindow[]> = {};

    for (const schedule of schedules) {
      const date = new Date(schedule.startDateTime);
      if (Number.isNaN(date.getTime())) {
        continue;
      }
      const dateKey = getServiceDayDateKey(date);
      const startHour = date.getUTCHours();
      const startMinute = date.getUTCMinutes();
      const baseDurationMinutes = getEffectiveServiceDurationMinutes({
        actualServiceDurationMinutes: (schedule as any)
          .actualServiceDurationMinutes,
        historicalServiceDurationMinutes: (schedule as any)
          .historicalServiceDurationMinutes,
        scheduleHours: (schedule as any).hours,
        fallbackHours: 4,
      });
      const durationMinutes = getPlanningServiceWindowMinutes({
        actualServiceDurationMinutes: (schedule as any)
          .actualServiceDurationMinutes,
        historicalServiceDurationMinutes: (schedule as any)
          .historicalServiceDurationMinutes,
        scheduleHours: (schedule as any).hours,
        fallbackHours: 4,
      });

      // Calculate time in minutes from midnight
      const jobStartMinutes = toServiceDayMinutes(startHour, startMinute);
      const blockedStart = jobStartMinutes;
      const blockedEnd = jobStartMinutes + durationMinutes;
      const travelEnd = jobStartMinutes + baseDurationMinutes;

      if (!busyTimes[dateKey]) {
        busyTimes[dateKey] = [];
      }
      busyTimes[dateKey]!.push({
        blockedStart,
        blockedEnd,
        travelEnd,
        location:
          String((schedule as any).location || "").trim() ||
          DEFAULT_DEPOT_FALLBACK_ADDRESS,
      });
    }

    for (const dateKey of Object.keys(busyTimes)) {
      busyTimes[dateKey]!.sort((a, b) => a.blockedStart - b.blockedStart);
    }

    const existingDayTravelSegments = new Map<string, TravelSegmentHash[]>();
    for (const [dateKey, dayBusyTimes] of Object.entries(busyTimes)) {
      existingDayTravelSegments.set(
        dateKey,
        buildDayTravelSegments(dateKey, dayBusyTimes),
      );
    }

    const requestedDurationMinutes = getPlanningServiceWindowMinutes({
      actualServiceDurationMinutes: undefined,
      historicalServiceDurationMinutes:
        requestedHistoricalServiceDurationMinutes,
      scheduleHours: estimatedHours,
      fallbackHours: 4,
    });
    const requestedBaseDurationMinutes = getEffectiveServiceDurationMinutes({
      actualServiceDurationMinutes: undefined,
      historicalServiceDurationMinutes:
        requestedHistoricalServiceDurationMinutes,
      scheduleHours: estimatedHours,
      fallbackHours: 4,
    });
    const reqTimeMinutes = toServiceDayMinutes(reqTime.hour, reqTime.minute);
    const reqBlockedStart = reqTimeMinutes;
    const reqBlockedEnd = reqTimeMinutes + requestedDurationMinutes;
    const reqTravelEnd = reqTimeMinutes + requestedBaseDurationMinutes;
    const normalizedRequestedLocation =
      String(requestedLocation || "").trim() || DEFAULT_DEPOT_FALLBACK_ADDRESS;
    if (AUTO_SCHEDULING_DEBUG) {
      logAutoSchedulingDebug(
        "availability-request",
        {
          startDate,
          endDate,
          requestedTime: reqTime,
          estimatedHours,
          requestedHistoricalServiceDurationMinutes,
          requestedLocation: normalizedRequestedLocation,
        },
        AUTO_SCHEDULING_DEBUG_DATE || startDate,
      );
    }

    const dayRows: Array<{
      date: string;
      available: boolean;
      conflictReason?: string;
      prevTravelHash?: string;
      prevTravelPair?: TravelPairInput;
      prevJobEndMinutes?: number;
      prevJobLocation?: string;
      nextTravelHash?: string;
      nextTravelPair?: TravelPairInput;
      nextJobStartMinutes?: number;
      nextJobLocation?: string;
    }> = [];
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
        dayRows.push({
          date: dateKey,
          available: false,
          conflictReason: "We don't work on Fridays or Saturdays",
        });
      } else if (isPast) {
        dayRows.push({
          date: dateKey,
          available: false,
          conflictReason: "Date has passed",
        });
      } else {
        // Check for direct service-window overlap.
        const dayBusyTimes = busyTimes[dateKey] || [];
        let hasConflict = false;

        for (const busy of dayBusyTimes) {
          if (
            reqBlockedEnd > busy.blockedStart &&
            reqBlockedStart < busy.blockedEnd
          ) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) {
          dayRows.push({
            date: dateKey,
            available: false,
            conflictReason: "Already booked at this time",
          });
        } else {
          let previousJob:
            | {
                blockedStart: number;
                blockedEnd: number;
                travelEnd: number;
                location: string;
              }
            | undefined;
          let nextJob:
            | {
                blockedStart: number;
                blockedEnd: number;
                travelEnd: number;
                location: string;
              }
            | undefined;

          for (const busy of dayBusyTimes) {
            if (busy.blockedEnd <= reqBlockedStart) {
              previousJob = busy;
            } else if (!nextJob && busy.blockedStart >= reqBlockedEnd) {
              nextJob = busy;
            }
          }

          const row: {
            date: string;
            available: boolean;
            conflictReason?: string;
            prevTravelHash?: string;
            prevTravelPair?: TravelPairInput;
            prevJobEndMinutes?: number;
            prevJobLocation?: string;
            nextTravelHash?: string;
            nextTravelPair?: TravelPairInput;
            nextJobStartMinutes?: number;
            nextJobLocation?: string;
          } = {
            date: dateKey,
            available: true,
          };

          if (previousJob) {
            const departureIso = isoFromDateKeyAndMinutes(
              dateKey,
              previousJob.travelEnd,
            );
            const prevSegment = buildTravelSegmentHash(
              previousJob.location,
              normalizedRequestedLocation,
              departureIso,
            );
            row.prevTravelHash = prevSegment.pairHash;
            row.prevTravelPair = prevSegment.pair;
            row.prevJobEndMinutes = previousJob.blockedEnd;
            row.prevJobLocation = previousJob.location;
          }

          if (nextJob) {
            const departureIso = isoFromDateKeyAndMinutes(
              dateKey,
              reqTravelEnd,
            );
            const nextSegment = buildTravelSegmentHash(
              normalizedRequestedLocation,
              nextJob.location,
              departureIso,
            );
            row.nextTravelHash = nextSegment.pairHash;
            row.nextTravelPair = nextSegment.pair;
            row.nextJobStartMinutes = nextJob.blockedStart;
            row.nextJobLocation = nextJob.location;
          }

          dayRows.push(row);
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    const requiredPairsByHash = new Map<string, TravelPairInput>();
    for (const row of dayRows) {
      if (row.prevTravelHash && row.prevTravelPair) {
        requiredPairsByHash.set(row.prevTravelHash, row.prevTravelPair);
      }
      if (row.nextTravelHash && row.nextTravelPair) {
        requiredPairsByHash.set(row.nextTravelHash, row.nextTravelPair);
      }
    }
    for (const daySegments of existingDayTravelSegments.values()) {
      for (const segment of daySegments) {
        requiredPairsByHash.set(segment.pairHash, segment.pair);
      }
    }
    const requiredHashes = Array.from(requiredPairsByHash.keys());

    const cachedTravelByHash = new Map<string, number>();
    if (requiredHashes.length > 0) {
      const cachedRows = await TravelTimeCache.find({
        pairHash: { $in: requiredHashes },
      })
        .select("pairHash typicalMinutes")
        .lean<Array<{ pairHash: string; typicalMinutes: number }>>();

      for (const row of cachedRows) {
        if (Number.isFinite(row.typicalMinutes)) {
          cachedTravelByHash.set(row.pairHash, Number(row.typicalMinutes));
        }
      }
    }

    const missingHashesBeforeHydration = requiredHashes.filter(
      (hash) => !cachedTravelByHash.has(hash),
    );
    if (missingHashesBeforeHydration.length > 0) {
      const missingPairs = missingHashesBeforeHydration
        .map((hash) => requiredPairsByHash.get(hash))
        .filter((pair): pair is TravelPairInput => Boolean(pair));
      const hydratedTravelByHash =
        await hydrateMissingTravelEstimates(missingPairs);
      for (const [hash, minutes] of hydratedTravelByHash.entries()) {
        cachedTravelByHash.set(hash, minutes);
      }

      if (AUTO_SCHEDULING_DEBUG) {
        logAutoSchedulingDebug(
          "cache-hydration",
          {
            missingBeforeHydration: missingHashesBeforeHydration.length,
            hydratedCount: hydratedTravelByHash.size,
            missingAfterHydration: requiredHashes.filter(
              (hash) => !cachedTravelByHash.has(hash),
            ).length,
          },
          AUTO_SCHEDULING_DEBUG_DATE || startDate,
        );
      }
    }
    if (AUTO_SCHEDULING_DEBUG) {
      const missingHashes = requiredHashes.length - cachedTravelByHash.size;
      logAutoSchedulingDebug(
        "cache-coverage",
        {
          requiredHashCount: requiredHashes.length,
          cachedHashCount: cachedTravelByHash.size,
          missingHashCount: missingHashes,
        },
        AUTO_SCHEDULING_DEBUG_DATE || startDate,
      );
    }

    const existingDayTravelByDate = new Map<string, number>();
    const dayTravelCoverageByDate = new Map<
      string,
      {
        segmentCount: number;
        cachedSegmentCount: number;
        missingSegmentCount: number;
      }
    >();
    for (const [dateKey, segments] of existingDayTravelSegments.entries()) {
      let cachedSegmentCount = 0;
      const totalTravelMinutes = segments.reduce((sum, segment) => {
        const minutes = cachedTravelByHash.get(segment.pairHash);
        if (minutes != null) {
          cachedSegmentCount += 1;
        }
        return sum + (minutes != null ? minutes : 0);
      }, 0);
      existingDayTravelByDate.set(dateKey, totalTravelMinutes);
      dayTravelCoverageByDate.set(dateKey, {
        segmentCount: segments.length,
        cachedSegmentCount,
        missingSegmentCount: Math.max(0, segments.length - cachedSegmentCount),
      });
      if (AUTO_SCHEDULING_DEBUG) {
        logAutoSchedulingDebug(
          "day-travel-baseline",
          {
            date: dateKey,
            existingDayTravelMinutes: totalTravelMinutes,
            segmentCount: segments.length,
            cachedSegmentCount,
            missingSegmentCount: Math.max(
              0,
              segments.length - cachedSegmentCount,
            ),
          },
          dateKey,
        );
      }
    }

    return dayRows.map((row) => {
      if (!row.available) {
        return row;
      }

      if (
        row.prevTravelHash &&
        row.prevJobEndMinutes != null &&
        !cachedTravelByHash.has(row.prevTravelHash)
      ) {
        if (AUTO_SCHEDULING_DEBUG) {
          logAutoSchedulingDebug(
            "blocked-prev-travel-missing",
            {
              date: row.date,
              prevJobEndMinutes: row.prevJobEndMinutes,
              requestedStartMinutes: reqBlockedStart,
              prevJobLocation: row.prevJobLocation || null,
              requestedLocation: normalizedRequestedLocation,
            },
            row.date,
          );
        }
        return {
          date: row.date,
          available: false,
          conflictReason:
            "Travel estimate unavailable from previous job (conservative fallback)",
        };
      }

      if (
        row.prevTravelHash &&
        row.prevJobEndMinutes != null &&
        cachedTravelByHash.has(row.prevTravelHash)
      ) {
        const travelMinutes = cachedTravelByHash.get(row.prevTravelHash) || 0;
        if (reqBlockedStart < row.prevJobEndMinutes + travelMinutes) {
          if (AUTO_SCHEDULING_DEBUG) {
            logAutoSchedulingDebug(
              "blocked-prev-travel-gap",
              {
                date: row.date,
                prevTravelMinutes: travelMinutes,
                prevJobEndMinutes: row.prevJobEndMinutes,
                requestedStartMinutes: reqBlockedStart,
                prevJobLocation: row.prevJobLocation || null,
                requestedLocation: normalizedRequestedLocation,
              },
              row.date,
            );
          }
          return {
            date: row.date,
            available: false,
            conflictReason:
              "Not enough travel time from previous job (cached route)",
          };
        }
      }

      if (
        row.nextTravelHash &&
        row.nextJobStartMinutes != null &&
        !cachedTravelByHash.has(row.nextTravelHash)
      ) {
        if (AUTO_SCHEDULING_DEBUG) {
          logAutoSchedulingDebug(
            "blocked-next-travel-missing",
            {
              date: row.date,
              nextJobStartMinutes: row.nextJobStartMinutes,
              requestedEndMinutes: reqBlockedEnd,
              nextJobLocation: row.nextJobLocation || null,
              requestedLocation: normalizedRequestedLocation,
            },
            row.date,
          );
        }
        return {
          date: row.date,
          available: false,
          conflictReason:
            "Travel estimate unavailable before next job (conservative fallback)",
        };
      }

      if (
        row.nextTravelHash &&
        row.nextJobStartMinutes != null &&
        cachedTravelByHash.has(row.nextTravelHash)
      ) {
        const travelMinutes = cachedTravelByHash.get(row.nextTravelHash) || 0;
        if (row.nextJobStartMinutes < reqBlockedEnd + travelMinutes) {
          if (AUTO_SCHEDULING_DEBUG) {
            logAutoSchedulingDebug(
              "blocked-next-travel-gap",
              {
                date: row.date,
                nextTravelMinutes: travelMinutes,
                nextJobStartMinutes: row.nextJobStartMinutes,
                requestedEndMinutes: reqBlockedEnd,
                nextJobLocation: row.nextJobLocation || null,
                requestedLocation: normalizedRequestedLocation,
              },
              row.date,
            );
          }
          return {
            date: row.date,
            available: false,
            conflictReason:
              "Not enough travel time before next job (cached route)",
          };
        }
      }

      const existingDayTravelMinutes =
        existingDayTravelByDate.get(row.date) || 0;
      const dayTravelCoverage = dayTravelCoverageByDate.get(row.date);
      if ((dayTravelCoverage?.missingSegmentCount || 0) > 0) {
        if (AUTO_SCHEDULING_DEBUG) {
          logAutoSchedulingDebug(
            "blocked-day-travel-missing",
            {
              date: row.date,
              segmentCount: dayTravelCoverage?.segmentCount ?? 0,
              cachedSegmentCount: dayTravelCoverage?.cachedSegmentCount ?? 0,
              missingSegmentCount: dayTravelCoverage?.missingSegmentCount ?? 0,
            },
            row.date,
          );
        }
        return {
          date: row.date,
          available: false,
          conflictReason:
            "Travel estimate unavailable for this day (conservative fallback)",
        };
      }
      if (existingDayTravelMinutes > DAILY_TRAVEL_LIMIT_MINUTES) {
        const prevTravelMinutes = row.prevTravelHash
          ? cachedTravelByHash.get(row.prevTravelHash)
          : undefined;
        const nextTravelMinutes = row.nextTravelHash
          ? cachedTravelByHash.get(row.nextTravelHash)
          : undefined;

        const closeByTravel =
          (prevTravelMinutes != null &&
            prevTravelMinutes <= CLOSE_ROUTE_MAX_MINUTES) ||
          (nextTravelMinutes != null &&
            nextTravelMinutes <= CLOSE_ROUTE_MAX_MINUTES);

        const closeByAddress =
          (row.prevJobLocation &&
            normalizeAddress(row.prevJobLocation) ===
              normalizeAddress(normalizedRequestedLocation)) ||
          (row.nextJobLocation &&
            normalizeAddress(row.nextJobLocation) ===
              normalizeAddress(normalizedRequestedLocation));

        if (!closeByTravel && !closeByAddress) {
          if (AUTO_SCHEDULING_DEBUG) {
            const coverage = dayTravelCoverageByDate.get(row.date);
            logAutoSchedulingDebug(
              "blocked-day-drive-limit",
              {
                date: row.date,
                existingDayTravelMinutes,
                dailyLimitMinutes: DAILY_TRAVEL_LIMIT_MINUTES,
                prevTravelMinutes: prevTravelMinutes ?? null,
                nextTravelMinutes: nextTravelMinutes ?? null,
                closeByTravel,
                closeByAddress,
                prevJobLocation: row.prevJobLocation || null,
                nextJobLocation: row.nextJobLocation || null,
                requestedLocation: normalizedRequestedLocation,
                segmentCount: coverage?.segmentCount ?? 0,
                cachedSegmentCount: coverage?.cachedSegmentCount ?? 0,
                missingSegmentCount: coverage?.missingSegmentCount ?? 0,
              },
              row.date,
            );
          }
          return {
            date: row.date,
            available: false,
            conflictReason:
              "Day already exceeds drive-time limit (4h) and this job is not close to that route",
          };
        }
        if (AUTO_SCHEDULING_DEBUG) {
          const coverage = dayTravelCoverageByDate.get(row.date);
          logAutoSchedulingDebug(
            "allowed-day-drive-limit-close-exception",
            {
              date: row.date,
              existingDayTravelMinutes,
              dailyLimitMinutes: DAILY_TRAVEL_LIMIT_MINUTES,
              prevTravelMinutes: prevTravelMinutes ?? null,
              nextTravelMinutes: nextTravelMinutes ?? null,
              closeByTravel,
              closeByAddress,
              prevJobLocation: row.prevJobLocation || null,
              nextJobLocation: row.nextJobLocation || null,
              requestedLocation: normalizedRequestedLocation,
              segmentCount: coverage?.segmentCount ?? 0,
              cachedSegmentCount: coverage?.cachedSegmentCount ?? 0,
              missingSegmentCount: coverage?.missingSegmentCount ?? 0,
            },
            row.date,
          );
        }
      }

      if (AUTO_SCHEDULING_DEBUG) {
        const hasNeighborTravelCheck = Boolean(
          row.prevTravelHash || row.nextTravelHash,
        );
        const dayBusyCount = (busyTimes[row.date] || []).length;
        if (dayBusyCount > 0 || hasNeighborTravelCheck) {
          const coverage = dayTravelCoverageByDate.get(row.date);
          logAutoSchedulingDebug(
            "available-day-final",
            {
              date: row.date,
              existingDayTravelMinutes,
              dayBusyCount,
              requestedStartMinutes: reqBlockedStart,
              requestedEndMinutes: reqBlockedEnd,
              prevTravelMinutes: row.prevTravelHash
                ? (cachedTravelByHash.get(row.prevTravelHash) ?? null)
                : null,
              nextTravelMinutes: row.nextTravelHash
                ? (cachedTravelByHash.get(row.nextTravelHash) ?? null)
                : null,
              segmentCount: coverage?.segmentCount ?? 0,
              cachedSegmentCount: coverage?.cachedSegmentCount ?? 0,
              missingSegmentCount: coverage?.missingSegmentCount ?? 0,
            },
            row.date,
          );
        }
      }

      return {
        date: row.date,
        available: true,
      };
    });
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
  requestedHistoricalServiceDurationMinutes?: number | null,
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

    const invoice = await Invoice.findById(jobsDueSoon.invoiceId)
      .select("location")
      .lean();

    const { startDate, endDate } = getSchedulingDateRange(jobsDueSoon.dateDue);

    return await getAvailableDays(
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
      requestedTime,
      estimatedHours,
      (invoice as any)?.location,
      requestedHistoricalServiceDurationMinutes,
    );
  } catch (error) {
    console.error("Error refreshing availability:", error);
    return [];
  }
}

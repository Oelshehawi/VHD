"use server";

import { createHash } from "crypto";
import connectMongo from "../connect";
import { TravelTimeCache } from "../../../models";
import type {
  TravelTimeCacheType,
  TravelTimeSegment,
  DayTravelTimeSummary,
  TravelTimeRequest,
  ScheduleType,
} from "../typeDefinitions";
import { SERVICE_DAY_CUTOFF_HOUR } from "../utils/scheduleDayUtils";
import { fakeUtcStoredToRealUtcIso } from "../serviceDurationRules";

// Address normalization

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

const BUSINESS_TIME_ZONE = "America/Vancouver";
const HOUR_BUCKET_SIZE = 1;

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

/**
 * Convert stored schedule fake-UTC to real UTC before routing bucketing.
 * This uses the shared helper so travel-time math stays consistent with
 * duration analysis and sync/write logic.
 */
function getDepartureBucketKey(departureDateTimeIso: string): string {
  const realUtc =
    fakeUtcStoredToRealUtcIso(departureDateTimeIso) ?? departureDateTimeIso;
  const parsed = new Date(realUtc);
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

function computePairHash(
  origin: string,
  destination: string,
  departureDateTimeIso: string,
): string {
  const normalized = `${normalizeAddress(origin)}|${normalizeAddress(destination)}|${getDepartureBucketKey(departureDateTimeIso)}`;
  return createHash("sha256").update(normalized).digest("hex");
}

function isSelfPair(origin: string, destination: string): boolean {
  return normalizeAddress(origin) === normalizeAddress(destination);
}

function toIsoStringSafe(value: Date | string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toISOString();
}

function getJobEndDateTimeIso(job: ScheduleType): string {
  const start = new Date(job.startDateTime);
  if (Number.isNaN(start.getTime())) {
    return toIsoStringSafe(job.startDateTime);
  }
  const hours = Number.isFinite(job.hours) ? Math.max(job.hours, 0) : 0;
  return new Date(start.getTime() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Routing-only timestamp adjustment for service-day ordering.
 *
 * Business rule:
 * - 00:00-02:59 are treated as end-of-day stops.
 * - 03:00+ are treated as normal same-day stops.
 *
 * We keep persisted schedule timestamps untouched and only adjust the
 * in-memory route timeline used for segment ordering, gap detection, and
 * Google departure-time inputs.
 */
function getServiceDayRoutingStart(value: Date | string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const adjusted = new Date(parsed);
  if (adjusted.getHours() < SERVICE_DAY_CUTOFF_HOUR) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
}

function getRoutingJobStartDateTimeIso(job: ScheduleType): string {
  const adjustedStart = getServiceDayRoutingStart(job.startDateTime);
  if (!adjustedStart) {
    return toIsoStringSafe(job.startDateTime);
  }
  return adjustedStart.toISOString();
}

function getRoutingJobEndDateTimeIso(job: ScheduleType): string {
  const adjustedStart = getServiceDayRoutingStart(job.startDateTime);
  if (!adjustedStart) {
    return getJobEndDateTimeIso(job);
  }
  const hours = Number.isFinite(job.hours) ? Math.max(job.hours, 0) : 0;
  return new Date(
    adjustedStart.getTime() + hours * 60 * 60 * 1000,
  ).toISOString();
}

function sanitizeEstimateValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 10) / 10);
}

// Types

type TravelPairInput = {
  origin: string;
  destination: string;
  departureDateTimeIso: string;
};

type TravelEstimate = {
  originAddress: string;
  destinationAddress: string;
  pairHash: string;
  typicalMinutes: number;
  estimatedKm: number;
  travelNotes?: string;
  routePolyline?: string;
};

// Google Routes API

function parseGoogleDurationSeconds(duration: string): number {
  const match = duration.match(/^(\d+)s$/);
  if (!match) return 0;
  return parseInt(match[1]!, 10);
}

async function fetchGoogleRoute(
  pair: TravelPairInput,
  apiKey: string,
): Promise<TravelEstimate | null> {
  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
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
      const errorBody = await response.text().catch(() => "");
      console.warn(
        `Google Routes API error ${response.status} for ${pair.origin} -> ${pair.destination}`,
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route?.duration || !route?.distanceMeters) {
      console.warn(
        `Google Routes API returned no route for ${pair.origin} -> ${pair.destination}`,
      );
      return null;
    }

    const durationSeconds = parseGoogleDurationSeconds(route.duration);
    const distanceKm = route.distanceMeters / 1000;

    return {
      originAddress: pair.origin,
      destinationAddress: pair.destination,
      pairHash: computePairHash(
        pair.origin,
        pair.destination,
        pair.departureDateTimeIso,
      ),
      typicalMinutes: sanitizeEstimateValue(durationSeconds / 60),
      estimatedKm: sanitizeEstimateValue(distanceKm),
      routePolyline: route.polyline?.encodedPolyline,
    };
  } catch (error) {
    console.warn(
      `Google Routes API fetch failed for ${pair.origin} -> ${pair.destination}:`,
      error,
    );
    return null;
  }
}

async function estimateTravelTimesWithGoogle(
  pairs: TravelPairInput[],
): Promise<TravelEstimate[]> {
  if (pairs.length === 0) return [];

  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey) {
    console.warn(
      "GOOGLE_ROUTES_API_KEY not configured, skipping Google Routes",
    );
    return [];
  }

  const CONCURRENCY_LIMIT = 5;
  const results: TravelEstimate[] = [];

  for (let i = 0; i < pairs.length; i += CONCURRENCY_LIMIT) {
    const batch = pairs.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((pair) => fetchGoogleRoute(pair, apiKey)),
    );
    for (const result of batchResults) {
      if (result) results.push(result);
    }
  }

  return results;
}

// Cache layer

const CACHE_TTL_DAYS = 90;

async function getCachedEstimates(pairs: TravelPairInput[]): Promise<{
  cached: Map<string, TravelTimeCacheType>;
  uncached: { origin: string; destination: string; hash: string }[];
}> {
  await connectMongo();

  const hashes = pairs.map((pair) => ({
    origin: pair.origin,
    destination: pair.destination,
    hash: computePairHash(
      pair.origin,
      pair.destination,
      pair.departureDateTimeIso,
    ),
  }));

  const uniqueHashes = [...new Set(hashes.map((item) => item.hash))];
  const cachedDocs = await TravelTimeCache.find({
    pairHash: { $in: uniqueHashes },
  }).lean<TravelTimeCacheType[]>();

  const cachedMap = new Map<string, TravelTimeCacheType>();
  for (const doc of cachedDocs) {
    cachedMap.set(doc.pairHash, doc);
  }

  const uncached = hashes.filter((item) => !cachedMap.has(item.hash));

  return { cached: cachedMap, uncached };
}

async function storeCacheEntries(entries: TravelEstimate[]): Promise<void> {
  if (entries.length === 0) return;

  await connectMongo();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const ops = entries.map((entry) => {
    return {
      updateOne: {
        filter: { pairHash: entry.pairHash },
        update: {
          $set: {
            originAddress: entry.originAddress,
            destinationAddress: entry.destinationAddress,
            pairHash: entry.pairHash,
            typicalMinutes: entry.typicalMinutes,
            estimatedKm: entry.estimatedKm,
            travelNotes: entry.travelNotes,
            routePolyline: entry.routePolyline,
            expiresAt,
          },
        },
        upsert: true,
      },
    };
  });

  await TravelTimeCache.bulkWrite(ops);
}

// Public API

export async function getBatchTravelTimeSummaries(
  requests: TravelTimeRequest[],
): Promise<DayTravelTimeSummary[]> {
  // 1. Build all route segments and non-self travel pairs
  const allPairs: TravelPairInput[] = [];

  const daySegmentMeta: {
    date: string;
    isPartial: boolean;
    segments: {
      from: string;
      to: string;
      origin: string;
      destination: string;
      departureDateTimeIso: string;
      isSelfPair: boolean;
      fromKind: "depot" | "job";
      toKind: "depot" | "job";
      fromJobId?: string;
      toJobId?: string;
    }[];
  }[] = [];

  for (const request of requests) {
    const sortedJobs = [...request.jobs].sort((a, b) => {
      const routingStartA = getServiceDayRoutingStart(a.startDateTime);
      const routingStartB = getServiceDayRoutingStart(b.startDateTime);

      if (!routingStartA && !routingStartB) return 0;
      if (!routingStartA) return -1;
      if (!routingStartB) return 1;
      return routingStartA.getTime() - routingStartB.getTime();
    });

    const isPartial = !request.depotAddress;
    const segments: {
      from: string;
      to: string;
      origin: string;
      destination: string;
      departureDateTimeIso: string;
      isSelfPair: boolean;
      fromKind: "depot" | "job";
      toKind: "depot" | "job";
      fromJobId?: string;
      toJobId?: string;
    }[] = [];

    if (sortedJobs.length === 0) {
      daySegmentMeta.push({ date: request.date, isPartial, segments: [] });
      continue;
    }

    const locations = sortedJobs.map((job) => ({
      jobId: String(job._id),
      label: job.jobTitle || "Job",
      address: job.location,
      startDateTimeIso: getRoutingJobStartDateTimeIso(job),
      endDateTimeIso: getRoutingJobEndDateTimeIso(job),
    }));

    // Build gap-aware route: insert depot return/departure when gap >= 2h
    const DEPOT_RETURN_GAP_HOURS = 2;

    const routePoints: {
      label: string;
      address: string;
      departureDateTimeIso: string;
      kind: "depot" | "job";
      jobId?: string;
    }[] = [];

    if (request.depotAddress) {
      routePoints.push({
        label: "Depot",
        address: request.depotAddress,
        departureDateTimeIso: locations[0]!.startDateTimeIso,
        kind: "depot",
      });
    }

    for (let locIdx = 0; locIdx < locations.length; locIdx++) {
      const loc = locations[locIdx]!;
      routePoints.push({
        label: loc.label,
        address: loc.address,
        departureDateTimeIso: loc.endDateTimeIso,
        kind: "job",
        jobId: loc.jobId,
      });

      // Check gap to next job — if large enough, insert depot return + departure
      if (request.depotAddress && locIdx < locations.length - 1) {
        const nextLoc = locations[locIdx + 1]!;
        const currentEndMs = new Date(loc.endDateTimeIso).getTime();
        const nextStartMs = new Date(nextLoc.startDateTimeIso).getTime();
        const gapHours = (nextStartMs - currentEndMs) / (1000 * 60 * 60);

        if (gapHours >= DEPOT_RETURN_GAP_HOURS) {
          // Return to depot after current job
          routePoints.push({
            label: "Depot",
            address: request.depotAddress,
            departureDateTimeIso: loc.endDateTimeIso,
            kind: "depot",
          });
          // Depart from depot to next job
          routePoints.push({
            label: "Depot",
            address: request.depotAddress,
            departureDateTimeIso: nextLoc.startDateTimeIso,
            kind: "depot",
          });
        }
      }
    }

    if (request.depotAddress) {
      routePoints.push({
        label: "Depot",
        address: request.depotAddress,
        departureDateTimeIso: locations[locations.length - 1]!.endDateTimeIso,
        kind: "depot",
      });
    }

    for (
      let segmentIndex = 0;
      segmentIndex < routePoints.length - 1;
      segmentIndex++
    ) {
      const from = routePoints[segmentIndex]!;
      const to = routePoints[segmentIndex + 1]!;
      const selfPair = isSelfPair(from.address, to.address);

      segments.push({
        from: from.label,
        to: to.label,
        origin: from.address,
        destination: to.address,
        departureDateTimeIso: from.departureDateTimeIso,
        isSelfPair: selfPair,
        fromKind: from.kind,
        toKind: to.kind,
        fromJobId: from.jobId,
        toJobId: to.jobId,
      });

      if (!selfPair) {
        allPairs.push({
          origin: from.address,
          destination: to.address,
          departureDateTimeIso: from.departureDateTimeIso,
        });
      }
    }

    daySegmentMeta.push({ date: request.date, isPartial, segments });
  }

  // 2. Deduplicate pairs for cache lookup
  const uniquePairMap = new Map<string, TravelPairInput>();
  for (const pair of allPairs) {
    const hash = computePairHash(
      pair.origin,
      pair.destination,
      pair.departureDateTimeIso,
    );
    if (!uniquePairMap.has(hash)) {
      uniquePairMap.set(hash, pair);
    }
  }
  const uniquePairs = Array.from(uniquePairMap.values());

  // 3. Check cache
  const cached = new Map<string, TravelTimeCacheType>();
  let uncached: { origin: string; destination: string; hash: string }[] = [];

  if (uniquePairs.length > 0) {
    const cacheResult = await getCachedEstimates(uniquePairs);
    uncached = cacheResult.uncached;
    for (const [hash, estimate] of cacheResult.cached.entries()) {
      cached.set(hash, estimate);
    }
  }

  // 4. Estimate uncached pairs via Google Routes API
  if (uncached.length > 0) {
    const departureTimeByHash = new Map<string, string>();
    for (const pair of uniquePairs) {
      departureTimeByHash.set(
        computePairHash(
          pair.origin,
          pair.destination,
          pair.departureDateTimeIso,
        ),
        pair.departureDateTimeIso,
      );
    }

    const uncachedPairs: TravelPairInput[] = uncached.map((entry) => ({
      origin: entry.origin,
      destination: entry.destination,
      departureDateTimeIso:
        departureTimeByHash.get(entry.hash) || toIsoStringSafe(new Date()),
    }));

    const googleResults = await estimateTravelTimesWithGoogle(uncachedPairs);

    if (googleResults.length > 0) {
      await storeCacheEntries(googleResults);
      for (const result of googleResults) {
        cached.set(result.pairHash, {
          ...result,
          expiresAt: new Date(
            Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
          ),
        });
      }
    }
  }

  // 5. Build summaries
  return daySegmentMeta.map((meta) => {
    const segments: TravelTimeSegment[] = meta.segments.flatMap((segment) => {
      if (segment.isSelfPair) {
        return [];
      }

      const hash = computePairHash(
        segment.origin,
        segment.destination,
        segment.departureDateTimeIso,
      );
      const estimate = cached.get(hash);

      if (estimate) {
        return [
          {
            from: segment.from,
            to: segment.to,
            typicalMinutes: estimate.typicalMinutes,
            km: estimate.estimatedKm,
            travelNotes: estimate.travelNotes,
            routePolyline: estimate.routePolyline,
            fromKind: segment.fromKind,
            toKind: segment.toKind,
            fromJobId: segment.fromJobId,
            toJobId: segment.toJobId,
          },
        ];
      }

      return [
        {
          from: segment.from,
          to: segment.to,
          typicalMinutes: 0,
          km: 0,
          travelNotes: "Unable to estimate",
          routePolyline: undefined,
          fromKind: segment.fromKind,
          toKind: segment.toKind,
          fromJobId: segment.fromJobId,
          toJobId: segment.toJobId,
        },
      ];
    });

    const totalTravelMinutes = segments.reduce(
      (sum, segment) => sum + segment.typicalMinutes,
      0,
    );
    const totalTravelKm = segments.reduce(
      (sum, segment) => sum + segment.km,
      0,
    );

    return {
      date: meta.date,
      totalTravelMinutes,
      totalTravelKm,
      segments,
      isPartial: meta.isPartial,
    };
  });
}

import { resolveHistoricalDurationForLocation } from "./historicalServiceDuration.data";

interface ResolveScheduleHistoricalDurationArgs {
  location: string | null | undefined;
  explicitHistoricalServiceDurationMinutes?: number | null;
  sourceHistoricalServiceDurationMinutes?: number | null;
}

/**
 * Centralized historical-duration precedence for new schedule creation:
 * 1) explicit value already on payload
 * 2) source schedule historical value (clone flows)
 * 3) location-based lookup from most recent actual duration
 */
export async function resolveHistoricalDurationForScheduleCreate(
  args: ResolveScheduleHistoricalDurationArgs,
): Promise<number | null> {
  if (args.explicitHistoricalServiceDurationMinutes != null) {
    return args.explicitHistoricalServiceDurationMinutes;
  }

  if (args.sourceHistoricalServiceDurationMinutes != null) {
    return args.sourceHistoricalServiceDurationMinutes;
  }

  return resolveHistoricalDurationForLocation(args.location);
}

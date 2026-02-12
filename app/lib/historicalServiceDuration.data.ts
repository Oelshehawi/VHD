import connectMongo from "./connect";
import { Schedule } from "../../models/reactDataSchema";
import { ACTUAL_SERVICE_DURATION_MAX_MINUTES } from "./serviceDurationRules";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLooseLocationRegex(location: string): RegExp {
  const collapsed = location.trim().replace(/\s+/g, " ");
  const pattern = collapsed
    .split(" ")
    .filter(Boolean)
    .map((part) => escapeRegExp(part))
    .join("\\s+");
  return new RegExp(`^\\s*${pattern}\\s*$`, "i");
}

/**
 * Single source of truth for historical-duration lookups.
 *
 * Returns the most recent actualServiceDurationMinutes found for schedules
 * matching the provided location (whitespace-insensitive, case-insensitive).
 */
export async function resolveHistoricalDurationForLocation(
  location: string | null | undefined,
): Promise<number | null> {
  const trimmed = String(location ?? "").trim();
  if (!trimmed) return null;

  await connectMongo();

  const result = await Schedule.findOne(
    {
      location: buildLooseLocationRegex(trimmed),
      actualServiceDurationMinutes: {
        $exists: true,
        $ne: null,
        $gte: 0,
        $lte: ACTUAL_SERVICE_DURATION_MAX_MINUTES,
      },
    },
    { actualServiceDurationMinutes: 1 },
    { sort: { startDateTime: -1 } },
  ).lean();

  if (!result) return null;
  const minutes = Number((result as any).actualServiceDurationMinutes);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

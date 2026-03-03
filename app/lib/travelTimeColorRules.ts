export type TravelLoadLevel = "good" | "caution" | "high";

export const TARGET_WORKDAY_MINUTES = 8 * 60;

const TARGET_OVERAGE_WARNING_MINUTES = 90;
const ABSOLUTE_GREEN_MAX_MINUTES = 90;
const ABSOLUTE_CAUTION_MAX_MINUTES = 150;

type TravelLoadInput = {
  travelMinutes: number;
  workMinutes?: number | null;
};

const TEXT_CLASS_BY_LEVEL: Record<TravelLoadLevel, string> = {
  good: "text-green-600 dark:text-green-400",
  caution: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

const BG_CLASS_BY_LEVEL: Record<TravelLoadLevel, string> = {
  good: "bg-green-500/10",
  caution: "bg-amber-500/10",
  high: "bg-red-500/10",
};

function normalizeMinutes(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, value);
}

export function resolveTravelLoadLevel({
  travelMinutes,
  workMinutes,
}: TravelLoadInput): TravelLoadLevel {
  const normalizedTravel = normalizeMinutes(travelMinutes) ?? 0;
  const normalizedWork = normalizeMinutes(workMinutes);

  if (normalizedWork != null && normalizedWork > 0) {
    const totalMinutes = normalizedTravel + normalizedWork;
    if (totalMinutes <= TARGET_WORKDAY_MINUTES) return "good";
    if (totalMinutes <= TARGET_WORKDAY_MINUTES + TARGET_OVERAGE_WARNING_MINUTES)
      return "caution";
    return "high";
  }

  if (normalizedTravel < ABSOLUTE_GREEN_MAX_MINUTES) return "good";
  if (normalizedTravel <= ABSOLUTE_CAUTION_MAX_MINUTES) return "caution";
  return "high";
}

export function getTravelLoadTextClass(input: TravelLoadInput): string {
  return TEXT_CLASS_BY_LEVEL[resolveTravelLoadLevel(input)];
}

export function getTravelLoadBgClass(input: TravelLoadInput): string {
  return BG_CLASS_BY_LEVEL[resolveTravelLoadLevel(input)];
}

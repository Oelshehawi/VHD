import { format } from "date-fns";

/**
 * Service-day boundary for schedule ordering.
 *
 * Business rule:
 * - 03:00 is the first time slot of the service day.
 * - 00:00-02:59 are treated as the *end* of that same service day.
 *
 * Example:
 * - 2026-02-15 02:00 should sort as one of the last jobs on Feb 15.
 * - 2026-02-15 03:00 should sort as one of the first jobs on Feb 15.
 *
 * This changes ordering only. Date grouping stays on the stored schedule date.
 */
export const SERVICE_DAY_CUTOFF_HOUR = 3;
export const SERVICE_DAY_HOUR_ORDER = [
  ...Array.from({ length: 24 - SERVICE_DAY_CUTOFF_HOUR }, (_, idx) => {
    return idx + SERVICE_DAY_CUTOFF_HOUR;
  }),
  ...Array.from({ length: SERVICE_DAY_CUTOFF_HOUR }, (_, idx) => idx),
];

function parseScheduleDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getScheduleDisplayDateKey(value: Date | string): string {
  return format(parseScheduleDate(value), "yyyy-MM-dd");
}

export function getScheduleDisplaySortMinutes(value: Date | string): number {
  const date = parseScheduleDate(value);
  const hour = date.getHours();
  const minute = date.getMinutes();

  // Push early-morning times after evening slots for the same service day.
  const adjustedHour = hour < SERVICE_DAY_CUTOFF_HOUR ? hour + 24 : hour;

  return adjustedHour * 60 + minute;
}

export function compareScheduleDisplayOrder(
  a: Date | string,
  b: Date | string,
): number {
  const scoreA = getScheduleDisplaySortMinutes(a);
  const scoreB = getScheduleDisplaySortMinutes(b);
  if (scoreA !== scoreB) return scoreA - scoreB;

  // Stable tie-breaker to avoid jitter if two jobs share the same minute.
  return parseScheduleDate(a).getTime() - parseScheduleDate(b).getTime();
}

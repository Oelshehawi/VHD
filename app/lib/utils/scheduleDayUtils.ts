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
export const BUSINESS_TIME_ZONE = "America/Vancouver";
export const SERVICE_DAY_HOUR_ORDER = [
  ...Array.from({ length: 24 - SERVICE_DAY_CUTOFF_HOUR }, (_, idx) => {
    return idx + SERVICE_DAY_CUTOFF_HOUR;
  }),
  ...Array.from({ length: SERVICE_DAY_CUTOFF_HOUR }, (_, idx) => idx),
];

const BUSINESS_DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getBusinessDateKey(
  value: Date | string | number = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = BUSINESS_DATE_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function parseScheduleDate(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const raw = String(value || "").trim();
  if (!raw) {
    return new Date(NaN);
  }

  const localeParts = parseUsLocaleDateTime(raw);
  if (localeParts) {
    return new Date(
      Date.UTC(
        localeParts.year,
        localeParts.month - 1,
        localeParts.day,
        localeParts.hour,
        localeParts.minute,
        localeParts.second,
        0,
      ),
    );
  }

  const isoWithoutOffset = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (isoWithoutOffset) {
    const year = Number.parseInt(isoWithoutOffset[1] || "0", 10);
    const month = Number.parseInt(isoWithoutOffset[2] || "0", 10);
    const day = Number.parseInt(isoWithoutOffset[3] || "0", 10);
    const hour = Number.parseInt(isoWithoutOffset[4] || "0", 10);
    const minute = Number.parseInt(isoWithoutOffset[5] || "0", 10);
    const second = Number.parseInt(isoWithoutOffset[6] || "0", 10);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  }

  return new Date(raw);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseUsLocaleDateTime(raw: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} | null {
  const match = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM))?$/i,
  );
  if (!match) return null;

  const month = Number.parseInt(match[1] || "0", 10);
  const day = Number.parseInt(match[2] || "0", 10);
  const year = Number.parseInt(match[3] || "0", 10);
  const rawHour = Number.parseInt(match[4] || "0", 10);
  const minute = Number.parseInt(match[5] || "0", 10);
  const second = Number.parseInt(match[6] || "0", 10);
  const period = (match[7] || "").toUpperCase();

  let hour = rawHour;
  if (period) {
    hour = rawHour % 12;
    if (period === "PM") hour += 12;
  }

  return { year, month, day, hour, minute, second };
}

function getUtcDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function getIsoDatePrefix(raw: string): string | null {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function getScheduleDisplayDateKey(value: Date | string): string {
  if (typeof value === "string") {
    const raw = value.trim();
    const localeParts = parseUsLocaleDateTime(raw);
    if (localeParts) {
      return `${localeParts.year}-${pad2(localeParts.month)}-${pad2(localeParts.day)}`;
    }
    const isoPrefix = getIsoDatePrefix(raw);
    if (isoPrefix) {
      return isoPrefix;
    }
  }

  const parsed = parseScheduleDate(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return getUtcDateKey(parsed);
}

export function getScheduleDisplaySortMinutes(value: Date | string): number {
  if (typeof value === "string") {
    const raw = value.trim();
    const localeParts = parseUsLocaleDateTime(raw);
    if (localeParts) {
      const adjustedHour =
        localeParts.hour < SERVICE_DAY_CUTOFF_HOUR
          ? localeParts.hour + 24
          : localeParts.hour;
      return adjustedHour * 60 + localeParts.minute;
    }

    const isoTimeMatch = raw.match(
      /^\d{4}-\d{2}-\d{2}[T\s](\d{2}):(\d{2})(?::\d{2})?/,
    );
    if (isoTimeMatch) {
      const hour = Number.parseInt(isoTimeMatch[1] || "0", 10);
      const minute = Number.parseInt(isoTimeMatch[2] || "0", 10);
      const adjustedHour = hour < SERVICE_DAY_CUTOFF_HOUR ? hour + 24 : hour;
      return adjustedHour * 60 + minute;
    }
  }

  const date = parseScheduleDate(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;

  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();

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
  if (Number.isFinite(scoreA) && Number.isFinite(scoreB) && scoreA !== scoreB) {
    return scoreA - scoreB;
  }
  if (Number.isFinite(scoreA) && !Number.isFinite(scoreB)) return -1;
  if (!Number.isFinite(scoreA) && Number.isFinite(scoreB)) return 1;

  // Stable tie-breaker to avoid jitter if two jobs share the same minute.
  const timeA = parseScheduleDate(a).getTime();
  const timeB = parseScheduleDate(b).getTime();
  if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
  if (Number.isNaN(timeA)) return 1;
  if (Number.isNaN(timeB)) return -1;
  return timeA - timeB;
}

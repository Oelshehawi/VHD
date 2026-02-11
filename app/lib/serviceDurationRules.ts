import { fromZonedTime } from "date-fns-tz";
import { calculateJobDurationFromPrice } from "./utils";

export const BUSINESS_TIME_ZONE = "America/Vancouver";
export const DURATION_OVER_SCHEDULE_BUFFER_HOURS = 1.5;
export const ACTUAL_SERVICE_DURATION_MAX_MINUTES = 24 * 60;

export type ActualServiceDurationSource =
  | "after_photo"
  | "mark_completed"
  | "admin_edit";

export type PriceCheckStatus =
  | "price-aligned"
  | "price unknown"
  | "review: long vs <=$500"
  | "review: long vs price"
  | "review: short vs price"
  | "-";

export interface PriceCheckResult {
  expectedMinutesFromPrice: number | null;
  expectedRangeLabel: string | null;
  priceCheckStatus: PriceCheckStatus;
}

export type DerivedDurationStatus =
  | "accepted"
  | "no_after_photo"
  | "invalid_start"
  | "invalid_after_timestamp"
  | "negative_duration"
  | "discarded_over_hours_plus_1_5";

export interface DerivedAfterPhotoDurationResult {
  derivedDurationMinutes: number | null;
  cutoffMinutes: number;
  status: DerivedDurationStatus;
}

export type DurationReviewReasonCode =
  | "missing_duration"
  | "negative_or_invalid"
  | "over_schedule_plus_buffer"
  | "over_max_cap"
  | "price_mismatch_long_low_price"
  | "price_mismatch_long";

export interface DurationReviewReason {
  code: DurationReviewReasonCode;
  message: string;
}

export interface DurationReviewResult extends PriceCheckResult {
  confidence: "good" | "needs_review";
  reasons: DurationReviewReason[];
  cutoffMinutes: number;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

/**
 * Reinterpret a "fake UTC" schedule timestamp as a real UTC instant.
 *
 * Schedule dates are stored as Vancouver wall-clock values baked into UTC.
 * Example:
 * - Stored: 2026-02-10T08:00:00.000Z (means 8:00 AM Vancouver local time)
 * - Real UTC instant: 2026-02-10T16:00:00.000Z (PST)
 *
 * This keeps historical storage unchanged while enabling correct math against
 * truly UTC timestamps (e.g. photo timestamps).
 */
export function fakeUtcStoredToRealUtcMs(value: Date | string): number | null {
  const stored = new Date(value);
  if (Number.isNaN(stored.getTime())) return null;

  const wallClock = new Date(
    stored.getUTCFullYear(),
    stored.getUTCMonth(),
    stored.getUTCDate(),
    stored.getUTCHours(),
    stored.getUTCMinutes(),
    stored.getUTCSeconds(),
    stored.getUTCMilliseconds(),
  );

  const realUtcDate = fromZonedTime(wallClock, BUSINESS_TIME_ZONE);
  const realMs = realUtcDate.getTime();
  if (Number.isNaN(realMs)) return null;
  return realMs;
}

export function fakeUtcStoredToRealUtcIso(value: Date | string): string | null {
  const realMs = fakeUtcStoredToRealUtcMs(value);
  if (realMs == null) return null;
  return new Date(realMs).toISOString();
}

export function derivePriceCheck(args: {
  invoiceTotal: number | null | undefined;
  derivedMinutes: number | null | undefined;
}): PriceCheckResult {
  if (
    args.derivedMinutes == null ||
    !Number.isFinite(args.derivedMinutes) ||
    args.derivedMinutes < 0
  ) {
    return {
      expectedMinutesFromPrice: null,
      expectedRangeLabel: null,
      priceCheckStatus: "-",
    };
  }

  if (args.invoiceTotal == null || !Number.isFinite(args.invoiceTotal)) {
    return {
      expectedMinutesFromPrice: null,
      expectedRangeLabel: null,
      priceCheckStatus: "price unknown",
    };
  }

  const expected = calculateJobDurationFromPrice(args.invoiceTotal);
  const lower = Math.max(15, expected - 60);
  const upper = expected + 90;

  if (args.invoiceTotal <= 500 && args.derivedMinutes >= 240) {
    return {
      expectedMinutesFromPrice: expected,
      expectedRangeLabel: `${Math.round(lower)}-${Math.round(upper)}m`,
      priceCheckStatus: "review: long vs <=$500",
    };
  }

  if (args.derivedMinutes > upper) {
    return {
      expectedMinutesFromPrice: expected,
      expectedRangeLabel: `${Math.round(lower)}-${Math.round(upper)}m`,
      priceCheckStatus: "review: long vs price",
    };
  }

  if (args.derivedMinutes < lower) {
    return {
      expectedMinutesFromPrice: expected,
      expectedRangeLabel: `${Math.round(lower)}-${Math.round(upper)}m`,
      priceCheckStatus: "review: short vs price",
    };
  }

  return {
    expectedMinutesFromPrice: expected,
    expectedRangeLabel: `${Math.round(lower)}-${Math.round(upper)}m`,
    priceCheckStatus: "price-aligned",
  };
}

export function evaluateDerivedAfterPhotoDuration(args: {
  scheduleStartDateTime: Date | string;
  scheduleHours: number;
  earliestAfterTimestamp: Date | string | null | undefined;
}): DerivedAfterPhotoDurationResult {
  const scheduleHours = toFiniteNumber(args.scheduleHours, 4);
  const cutoffMinutes =
    (Math.max(0, scheduleHours) + DURATION_OVER_SCHEDULE_BUFFER_HOURS) * 60;

  const startRealMs = fakeUtcStoredToRealUtcMs(args.scheduleStartDateTime);
  if (startRealMs == null) {
    return {
      derivedDurationMinutes: null,
      cutoffMinutes,
      status: "invalid_start",
    };
  }

  if (!args.earliestAfterTimestamp) {
    return {
      derivedDurationMinutes: null,
      cutoffMinutes,
      status: "no_after_photo",
    };
  }

  const afterMs = new Date(args.earliestAfterTimestamp).getTime();
  if (Number.isNaN(afterMs)) {
    return {
      derivedDurationMinutes: null,
      cutoffMinutes,
      status: "invalid_after_timestamp",
    };
  }

  const derivedMinutes = (afterMs - startRealMs) / (1000 * 60);
  const rounded = Math.round(derivedMinutes * 10) / 10;

  if (derivedMinutes < 0) {
    return {
      derivedDurationMinutes: rounded,
      cutoffMinutes,
      status: "negative_duration",
    };
  }

  if (derivedMinutes > cutoffMinutes) {
    return {
      derivedDurationMinutes: rounded,
      cutoffMinutes,
      status: "discarded_over_hours_plus_1_5",
    };
  }

  return {
    derivedDurationMinutes: rounded,
    cutoffMinutes,
    status: "accepted",
  };
}

export function evaluateDurationConfidence(args: {
  actualServiceDurationMinutes: number | null | undefined;
  scheduleHours: number;
  invoiceTotal: number | null | undefined;
  maxMinutes?: number;
}): DurationReviewResult {
  const reasons: DurationReviewReason[] = [];
  const maxMinutes =
    Number.isFinite(args.maxMinutes) && (args.maxMinutes as number) > 0
      ? (args.maxMinutes as number)
      : ACTUAL_SERVICE_DURATION_MAX_MINUTES;
  const scheduleHours = toFiniteNumber(args.scheduleHours, 4);
  const cutoffMinutes =
    (Math.max(0, scheduleHours) + DURATION_OVER_SCHEDULE_BUFFER_HOURS) * 60;
  const parsedMinutes = Number(args.actualServiceDurationMinutes);
  const hasValue =
    args.actualServiceDurationMinutes != null && Number.isFinite(parsedMinutes);

  if (!hasValue) {
    reasons.push({
      code: "missing_duration",
      message: "Actual duration is missing.",
    });
    return {
      confidence: "needs_review",
      reasons,
      cutoffMinutes,
      expectedMinutesFromPrice: null,
      expectedRangeLabel: null,
      priceCheckStatus: "-",
    };
  }

  if (parsedMinutes < 0) {
    reasons.push({
      code: "negative_or_invalid",
      message: "Actual duration is negative or invalid.",
    });
  }

  if (parsedMinutes > cutoffMinutes) {
    reasons.push({
      code: "over_schedule_plus_buffer",
      message: `Actual duration exceeds schedule.hours + ${DURATION_OVER_SCHEDULE_BUFFER_HOURS}h.`,
    });
  }

  if (parsedMinutes > maxMinutes) {
    reasons.push({
      code: "over_max_cap",
      message: `Actual duration exceeds max cap (${maxMinutes} minutes).`,
    });
  }

  const priceCheck = derivePriceCheck({
    invoiceTotal: args.invoiceTotal,
    derivedMinutes: parsedMinutes,
  });

  if (priceCheck.priceCheckStatus === "review: long vs <=$500") {
    reasons.push({
      code: "price_mismatch_long_low_price",
      message: "Duration is unusually long for a <=$500 invoice.",
    });
  } else if (priceCheck.priceCheckStatus === "review: long vs price") {
    reasons.push({
      code: "price_mismatch_long",
      message: "Duration is longer than invoice-price baseline.",
    });
  }

  return {
    confidence: reasons.length === 0 ? "good" : "needs_review",
    reasons,
    cutoffMinutes,
    expectedMinutesFromPrice: priceCheck.expectedMinutesFromPrice,
    expectedRangeLabel: priceCheck.expectedRangeLabel,
    priceCheckStatus: priceCheck.priceCheckStatus,
  };
}

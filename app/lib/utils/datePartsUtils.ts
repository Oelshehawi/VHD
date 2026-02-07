/**
 * Timezone-safe date parsing and calculation utilities.
 *
 * These utilities work with date parts (year, month, day) to avoid
 * timezone drift issues when persisting dates to the database.
 *
 * Use these instead of `new Date(string)` for persistence-sensitive operations.
 */

export type DateParts = {
  year: number;
  month: number; // 1-12 (not 0-11)
  day: number;
};

export type ReminderFrequency = "none" | "3days" | "5days" | "7days" | "14days";

/**
 * Validates that date parts represent a real calendar date.
 */
const isValidDateParts = (parts: DateParts): boolean => {
  const { year, month, day } = parts;
  const isValidNumber =
    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day);
  const isValidRange = month >= 1 && month <= 12 && day >= 1 && day <= 31;
  if (!isValidNumber || !isValidRange) return false;

  // Verify the date is valid (e.g., Feb 30 would fail)
  const test = new Date(Date.UTC(year, month - 1, day));
  return (
    test.getUTCFullYear() === year &&
    test.getUTCMonth() === month - 1 &&
    test.getUTCDate() === day
  );
};

/**
 * Safely extracts year/month/day from a Date object or ISO string.
 * Returns null for invalid input.
 *
 * @param dateInput - Date object or string in YYYY-MM-DD or ISO format
 * @returns DateParts with 1-indexed month, or null if invalid
 */
export const parseDateParts = (dateInput: string | Date): DateParts | null => {
  if (dateInput instanceof Date) {
    const parts = {
      year: dateInput.getUTCFullYear(),
      month: dateInput.getUTCMonth() + 1,
      day: dateInput.getUTCDate(),
    };
    return isValidDateParts(parts) ? parts : null;
  }

  if (typeof dateInput === "string") {
    const datePart = dateInput.includes("T")
      ? dateInput.split("T")[0]
      : dateInput;
    if (!datePart) return null;
    const parts = datePart.split("-");
    if (parts.length !== 3) return null;

    const year = Number.parseInt(parts[0] || "", 10);
    const month = Number.parseInt(parts[1] || "", 10);
    const day = Number.parseInt(parts[2] || "", 10);
    const parsed = { year, month, day };

    return isValidDateParts(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Creates a UTC Date object from date parts (no timezone drift).
 *
 * @param parts - DateParts with 1-indexed month
 * @returns Date object at midnight UTC
 */
export const toUtcDateFromParts = (parts: DateParts): Date =>
  new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

/**
 * Calculates invoice due date based on billing frequency.
 *
 * @param parts - DateParts representing the issued date
 * @param frequency - Billing frequency (times per year, e.g., 12=monthly, 4=quarterly)
 * @returns Due date as Date object, or undefined if invalid frequency
 */
export const calculateDateDueFromParts = (
  parts: DateParts,
  frequency?: number,
): Date | undefined => {
  if (!frequency || !Number.isFinite(frequency)) return undefined;
  const monthsToAdd = Math.floor(12 / Number(frequency));
  if (!Number.isFinite(monthsToAdd) || monthsToAdd <= 0) return undefined;
  return new Date(
    Date.UTC(parts.year, parts.month - 1 + monthsToAdd, parts.day),
  );
};

/**
 * Calculates the next reminder date based on the issued date and frequency.
 * If the calculated date is in the past, advances by frequency until future.
 * Sets reminder time to 9:00 AM local time.
 *
 * @param parts - DateParts representing the issued date
 * @param frequency - Reminder frequency ("3days", "5days", "7days", "14days", or "none")
 * @returns Next reminder date, or undefined if frequency is "none"
 */
export const calculateNextReminderDateFromParts = (
  parts: DateParts,
  frequency: ReminderFrequency,
): Date | undefined => {
  if (frequency === "none") return undefined;

  const days =
    frequency === "3days"
      ? 3
      : frequency === "5days"
        ? 5
        : frequency === "7days"
          ? 7
          : 14;

  const baseLocal = new Date(parts.year, parts.month - 1, parts.day);
  const targetLocal = new Date(
    baseLocal.getTime() + days * 24 * 60 * 60 * 1000,
  );

  const now = new Date();
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Advance until the target is in the future
  while (targetLocal < nowLocal) {
    targetLocal.setTime(targetLocal.getTime() + days * 24 * 60 * 60 * 1000);
  }

  // Set reminder time to 9:00 AM local
  return new Date(
    targetLocal.getFullYear(),
    targetLocal.getMonth(),
    targetLocal.getDate(),
    9,
    0,
    0,
    0,
  );
};

/**
 * Format communication timestamps using the viewer's local timezone.
 *
 * Communication events represent exact instants (calls/emails), so local-time
 * rendering is preferred for operator context. This is display-only and does
 * not change persistence behavior.
 */
export const formatCommunicationDateTimeLocal = (
  dateInput: string | Date,
): string => {
  let dateObj: Date;

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    const raw = String(dateInput || "").trim();
    if (!raw) return "Invalid Date";

    // If only a calendar date is present, show midnight local.
    if (!raw.includes("T")) {
      const dateParts = parseDateParts(raw);
      if (!dateParts) return "Invalid Date";
      dateObj = new Date(dateParts.year, dateParts.month - 1, dateParts.day);
    } else {
      dateObj = new Date(raw);
    }
  }

  if (Number.isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(dateObj);

  return `${datePart} at ${timePart}`;
};

import { CALL_OUTCOME_LABELS } from "../callLogConstants";
import type { CommunicationItem, CommunicationRecordRefs } from "./types";

type CallLike = {
  _id?: unknown;
  callerName?: unknown;
  timestamp?: unknown;
  outcome?: unknown;
  notes?: unknown;
  followUpDate?: unknown;
  duration?: unknown;
};

type PaymentReminderHistoryLike = {
  sentAt?: unknown;
  emailTemplate?: unknown;
  success?: unknown;
  sequence?: unknown;
  errorMessage?: unknown;
};

type InvoiceEmailDeliveryLike = {
  _id?: unknown;
  sentAt?: unknown;
  recipients?: unknown;
  includeReport?: unknown;
  templateAlias?: unknown;
  messageStream?: unknown;
  performedBy?: unknown;
};

type CleaningReminderHistoryLike = {
  _id?: unknown;
  sentAt?: unknown;
  recipient?: unknown;
  includeSchedulingLink?: unknown;
  templateAlias?: unknown;
  messageStream?: unknown;
  performedBy?: unknown;
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

const toPadded = (value: number): string => String(value).padStart(2, "0");

export const normalizeStoredTimestamp = (value: unknown): string | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const raw = toStringValue(value).trim();
  if (!raw) return null;

  if (raw.includes("T")) {
    return raw;
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dateOnlyMatch) {
    const year = dateOnlyMatch[1];
    const month = Number.parseInt(dateOnlyMatch[2] || "", 10);
    const day = Number.parseInt(dateOnlyMatch[3] || "", 10);
    if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
    return `${year}-${toPadded(month)}-${toPadded(day)}T00:00:00.000Z`;
  }

  const localeDateTimeMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM))?$/i,
  );
  if (localeDateTimeMatch) {
    const month = Number.parseInt(localeDateTimeMatch[1] || "", 10);
    const day = Number.parseInt(localeDateTimeMatch[2] || "", 10);
    const year = Number.parseInt(localeDateTimeMatch[3] || "", 10);
    const hourRaw = Number.parseInt(localeDateTimeMatch[4] || "0", 10);
    const minute = Number.parseInt(localeDateTimeMatch[5] || "0", 10);
    const second = Number.parseInt(localeDateTimeMatch[6] || "0", 10);
    const ampm = (localeDateTimeMatch[7] || "").toUpperCase();

    if (
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(year) ||
      !Number.isFinite(hourRaw) ||
      !Number.isFinite(minute) ||
      !Number.isFinite(second)
    ) {
      return null;
    }

    let hours = hourRaw % 12;
    if (ampm === "PM") hours += 12;

    return `${year}-${toPadded(month)}-${toPadded(day)}T${toPadded(hours)}:${toPadded(minute)}:${toPadded(second)}.000Z`;
  }

  return null;
};

const buildId = (
  prefix: string,
  explicitId: unknown,
  index: number,
): string => {
  const id = toStringValue(explicitId);
  return `${prefix}:${id || index}`;
};

export const mapInvoiceCallHistory = (
  callHistory: CallLike[] | undefined,
  refs: CommunicationRecordRefs,
): CommunicationItem[] => {
  if (!Array.isArray(callHistory)) return [];
  const result: CommunicationItem[] = [];

  callHistory.forEach((call, index) => {
    const timestamp = normalizeStoredTimestamp(call?.timestamp);
    if (!timestamp) return;

    const rawOutcome = toStringValue(call?.outcome);
    const outcomeLabel =
      CALL_OUTCOME_LABELS[rawOutcome as keyof typeof CALL_OUTCOME_LABELS] ||
      rawOutcome ||
      "Unknown";
    const followUpDate = normalizeStoredTimestamp(call?.followUpDate);

    result.push({
      id: buildId("invoice-call", call?._id, index),
      type: "call_payment",
      source: "invoice",
      timestamp,
      actor: toStringValue(call?.callerName) || undefined,
      summary: `Payment call: ${outcomeLabel}`,
      details: {
        outcome: rawOutcome || undefined,
        outcomeLabel,
        notes: toStringValue(call?.notes) || undefined,
        duration:
          typeof call?.duration === "number" ? call.duration : undefined,
      },
      followUpDate,
      refs,
    });
  });

  return result;
};

export const mapJobsDueSoonCallHistory = (
  callHistory: CallLike[] | undefined,
  refs: CommunicationRecordRefs,
): CommunicationItem[] => {
  if (!Array.isArray(callHistory)) return [];
  const result: CommunicationItem[] = [];

  callHistory.forEach((call, index) => {
    const timestamp = normalizeStoredTimestamp(call?.timestamp);
    if (!timestamp) return;

    const rawOutcome = toStringValue(call?.outcome);
    const outcomeLabel =
      CALL_OUTCOME_LABELS[rawOutcome as keyof typeof CALL_OUTCOME_LABELS] ||
      rawOutcome ||
      "Unknown";
    const followUpDate = normalizeStoredTimestamp(call?.followUpDate);

    result.push({
      id: buildId("jobs-call", call?._id, index),
      type: "call_scheduling",
      source: "jobsDueSoon",
      timestamp,
      actor: toStringValue(call?.callerName) || undefined,
      summary: `Scheduling call: ${outcomeLabel}`,
      details: {
        outcome: rawOutcome || undefined,
        outcomeLabel,
        notes: toStringValue(call?.notes) || undefined,
        duration:
          typeof call?.duration === "number" ? call.duration : undefined,
      },
      followUpDate,
      refs,
    });
  });

  return result;
};

export const mapPaymentReminderHistory = (
  reminderHistory: PaymentReminderHistoryLike[] | undefined,
  refs: CommunicationRecordRefs,
): CommunicationItem[] => {
  if (!Array.isArray(reminderHistory)) return [];
  const result: CommunicationItem[] = [];

  reminderHistory.forEach((entry, index) => {
    const timestamp = normalizeStoredTimestamp(entry?.sentAt);
    if (!timestamp) return;

    const isSuccess = entry?.success !== false;
    const sequence = Number(entry?.sequence);
    const sequenceText = Number.isFinite(sequence) ? ` #${sequence}` : "";

    result.push({
      id: buildId("invoice-reminder", undefined, index),
      type: "email_payment_reminder",
      source: "invoice",
      timestamp,
      summary: isSuccess
        ? `Payment reminder sent${sequenceText}`
        : `Payment reminder failed${sequenceText}`,
      details: {
        success: isSuccess,
        emailTemplate: toStringValue(entry?.emailTemplate) || undefined,
        sequence: Number.isFinite(sequence) ? sequence : undefined,
        errorMessage: toStringValue(entry?.errorMessage) || undefined,
      },
      refs,
    });
  });

  return result;
};

export const mapInvoiceEmailDeliveryHistory = (
  history: InvoiceEmailDeliveryLike[] | undefined,
  refs: CommunicationRecordRefs,
): CommunicationItem[] => {
  if (!Array.isArray(history)) return [];
  const result: CommunicationItem[] = [];

  history.forEach((entry, index) => {
    const timestamp = normalizeStoredTimestamp(entry?.sentAt);
    if (!timestamp) return;

    const recipients = Array.isArray(entry?.recipients)
      ? entry.recipients
          .map((recipient) => toStringValue(recipient))
          .filter(Boolean)
      : [];

    result.push({
      id: buildId("invoice-email", entry?._id, index),
      type: "email_invoice_delivery",
      source: "invoice",
      timestamp,
      actor: toStringValue(entry?.performedBy) || undefined,
      summary: `Invoice sent to ${recipients.length || 0} recipient(s)`,
      details: {
        recipients,
        includeReport: Boolean(entry?.includeReport),
        templateAlias: toStringValue(entry?.templateAlias) || undefined,
        messageStream: toStringValue(entry?.messageStream) || undefined,
      },
      refs,
    });
  });

  return result;
};

export const mapJobsDueSoonEmailHistory = (
  history: CleaningReminderHistoryLike[] | undefined,
  refs: CommunicationRecordRefs,
): CommunicationItem[] => {
  if (!Array.isArray(history)) return [];
  const result: CommunicationItem[] = [];

  history.forEach((entry, index) => {
    const timestamp = normalizeStoredTimestamp(entry?.sentAt);
    if (!timestamp) return;

    const recipient = toStringValue(entry?.recipient);

    result.push({
      id: buildId("jobs-email", entry?._id, index),
      type: "email_cleaning_reminder",
      source: "jobsDueSoon",
      timestamp,
      actor: toStringValue(entry?.performedBy) || undefined,
      summary: recipient
        ? `Cleaning reminder sent to ${recipient}`
        : "Cleaning reminder sent",
      details: {
        recipient: recipient || undefined,
        includeSchedulingLink: Boolean(entry?.includeSchedulingLink),
        templateAlias: toStringValue(entry?.templateAlias) || undefined,
        messageStream: toStringValue(entry?.messageStream) || undefined,
      },
      refs,
    });
  });

  return result;
};

export const sortCommunicationsDescending = (
  items: CommunicationItem[],
): CommunicationItem[] => {
  return [...items].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

export const isFollowUpDue = (
  followUpDate: string | null | undefined,
  todayDatePart: string,
): boolean => {
  if (!followUpDate) return false;
  const datePart = followUpDate.split("T")[0] || "";
  return !!datePart && datePart <= todayDatePart;
};

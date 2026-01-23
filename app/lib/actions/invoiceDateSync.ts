"use server";

import connectMongo from "../connect";
import { Invoice, JobsDueSoon } from "../../../models/reactDataSchema";
import { InvoiceType } from "../typeDefinitions";
import {
  parseDateParts,
  toUtcDateFromParts,
  calculateDateDueFromParts,
  calculateNextReminderDateFromParts,
} from "../utils/datePartsUtils";


export type { DateParts, ReminderFrequency } from "../utils/datePartsUtils";

/**
 * Syncs invoice dateIssued, dateDue, and optionally nextReminderDate when a job is rescheduled.
 * Also updates the corresponding JobsDueSoon record.
 *
 * @param invoiceId - MongoDB _id of the invoice
 * @param dateIssued - New issued date (string or Date)
 * @param jobTitle - Optional job title to update on JobsDueSoon
 * @param frequency - Billing frequency override (uses invoice.frequency if not provided)
 * @param recalcRemindersIfNoneSent - If true, recalculates nextReminderDate only if no reminders sent yet
 */
export async function syncInvoiceDateIssuedAndJobsDueSoon({
  invoiceId,
  dateIssued,
  jobTitle,
  frequency,
  recalcRemindersIfNoneSent = true,
}: {
  invoiceId: string;
  dateIssued: string | Date;
  jobTitle?: string;
  frequency?: number;
  recalcRemindersIfNoneSent?: boolean;
}): Promise<{
  success: boolean;
  dateIssued?: Date;
  dateDue?: Date;
  error?: string;
}> {
  await connectMongo();

  const invoice = (await Invoice.findById(
    invoiceId,
  ).lean()) as InvoiceType | null;
  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  const parts = parseDateParts(dateIssued);
  if (!parts) {
    return { success: false, error: "Invalid dateIssued value" };
  }

  const dateIssuedValue = toUtcDateFromParts(parts);
  const effectiveFrequency =
    typeof frequency === "number" ? frequency : invoice.frequency;
  const dateDueValue = calculateDateDueFromParts(parts, effectiveFrequency);

  const invoiceUpdate: Record<string, unknown> = {
    dateIssued: dateIssuedValue,
  };

  if (dateDueValue) {
    invoiceUpdate.dateDue = dateDueValue;
  }

  const reminderSettings = invoice.paymentReminders;
  const canRecalculateReminders =
    recalcRemindersIfNoneSent &&
    reminderSettings?.enabled &&
    reminderSettings.frequency &&
    reminderSettings.frequency !== "none" &&
    (!reminderSettings.reminderHistory ||
      reminderSettings.reminderHistory.length === 0);

  if (canRecalculateReminders) {
    const nextReminderDate = calculateNextReminderDateFromParts(
      parts,
      reminderSettings.frequency,
    );
    invoiceUpdate["paymentReminders.nextReminderDate"] = nextReminderDate;
  }

  await Invoice.findByIdAndUpdate(invoiceId, invoiceUpdate);

  const jobsDueSoonUpdate: Record<string, unknown> = {};
  if (dateDueValue) {
    jobsDueSoonUpdate.dateDue = dateDueValue;
  }
  if (jobTitle) {
    jobsDueSoonUpdate.jobTitle = jobTitle;
  }

  if (Object.keys(jobsDueSoonUpdate).length > 0) {
    await JobsDueSoon.findOneAndUpdate(
      { invoiceId: invoiceId.toString() },
      jobsDueSoonUpdate,
    );
  }

  return {
    success: true,
    dateIssued: dateIssuedValue,
    dateDue: dateDueValue,
  };
}

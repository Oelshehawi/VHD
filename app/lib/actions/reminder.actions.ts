"use server";

import connectMongo from "../connect";
import { Invoice, Client, AuditLog } from "../../../models/reactDataSchema";
import { InvoiceType } from "../typeDefinitions";
import { getEmailForPurpose } from "../utils";
import {
  formatAmount,
  formatDateStringUTC,
  calculatePaymentDueDate,
  getBaseUrl,
} from "../utils";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument, {
  type InvoiceData,
} from "../../../_components/pdf/InvoicePdfDocument";
import { revalidatePath } from "next/cache";

const postmark = require("postmark");

const postmarkClient = new postmark.ServerClient(
  process.env.POSTMARK_CLIENT || "",
);

export interface ProcessResult {
  processedCount: number;
  sentCount: number;
  errors: string[];
}

export interface ReminderPreview {
  invoiceId: string;
  invoiceMongoId: string;
  jobTitle: string;
  clientName: string;
  clientEmail: string;
  reminderSequence: number;
  nextReminderDate: string | null;
  frequency: string;
}

export interface PreviewResult {
  wouldProcess: number;
  previews: ReminderPreview[];
  errors: string[];
}

// Configure reminder settings for an invoice
export async function configurePaymentReminders(
  invoiceId: string,
  settings: {
    enabled: boolean;
    frequency: "none" | "3days" | "5days" | "7days" | "14days";
    startFrom?: "today" | "dateIssued";
  },
  performedBy?: string,
) {
  await connectMongo();

  try {
    // Get the invoice to access dateIssued if needed
    const currentInvoice = await Invoice.findById(invoiceId);
    if (!currentInvoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Calculate next reminder date based on frequency
    let nextReminderDate: Date | undefined;
    if (settings.enabled && settings.frequency !== "none") {
      const days =
        settings.frequency === "3days"
          ? 3
          : settings.frequency === "5days"
            ? 5
            : settings.frequency === "7days"
              ? 7
              : 14;

      // Default to dateIssued if not specified
      const startFrom = settings.startFrom ?? "dateIssued";

      // Determine base date: dateIssued (default) or today
      let baseYear: number, baseMonth: number, baseDay: number;

      if (startFrom === "dateIssued" && currentInvoice.dateIssued) {
        // Parse date string directly to avoid timezone issues
        // dateIssued could be a Date object or ISO string like "2026-01-10T00:00:00.000Z"
        const dateStr =
          currentInvoice.dateIssued instanceof Date
            ? currentInvoice.dateIssued.toISOString()
            : String(currentInvoice.dateIssued);
        const datePart = dateStr.split("T")[0] || dateStr;
        const parts = datePart.split("-");
        baseYear = parseInt(parts[0] || "2026", 10);
        baseMonth = parseInt(parts[1] || "1", 10) - 1; // JS months are 0-indexed
        baseDay = parseInt(parts[2] || "1", 10);
      } else {
        const now = new Date();
        baseYear = now.getFullYear();
        baseMonth = now.getMonth();
        baseDay = now.getDate();
      }

      // Calculate target date by adding days
      const localBase = new Date(baseYear, baseMonth, baseDay);
      const targetLocal = new Date(
        localBase.getTime() + days * 24 * 60 * 60 * 1000,
      );

      // If starting from dateIssued, we may need to advance to next interval if it's in the past
      const now = new Date();
      const nowLocal = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      // Keep advancing by the frequency until we get a future date
      while (targetLocal < nowLocal) {
        targetLocal.setTime(targetLocal.getTime() + days * 24 * 60 * 60 * 1000);
      }

      // Set to 9 AM local time for the reminder
      nextReminderDate = new Date(
        targetLocal.getFullYear(),
        targetLocal.getMonth(),
        targetLocal.getDate(),
        9,
        0,
        0,
        0,
      );
    }

    // Get current reminder settings for audit log
    const oldSettings = currentInvoice?.paymentReminders;

    // Update the invoice
    const updateData = {
      "paymentReminders.enabled": settings.enabled,
      "paymentReminders.frequency": settings.frequency,
      "paymentReminders.nextReminderDate": nextReminderDate,
    };

    await Invoice.findByIdAndUpdate(invoiceId, updateData);

    // Get invoice details for better audit context
    const invoice = await Invoice.findById(invoiceId).lean<InvoiceType>();

    // Create audit log entry
    await AuditLog.create({
      invoiceId,
      action: "reminder_configured",
      timestamp: new Date(),
      performedBy: performedBy || "user",
      details: {
        oldValue: oldSettings,
        newValue: {
          ...settings,
          nextReminderDate,
          invoiceId: invoice?.invoiceId,
          invoiceMongoId: invoice?._id?.toString() || invoiceId,
          jobTitle: invoice?.jobTitle, // Add job title for context
          clientId: invoice?.clientId?.toString?.() || invoice?.clientId,
        },
        reason: "User configured reminder settings",
      },
      success: true,
    });

    revalidatePath("/database");
    return { success: true };
  } catch (error) {
    console.error("Error configuring reminders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Preview automatic reminders (dry-run mode - no emails sent)
export async function previewAutoReminders(): Promise<PreviewResult> {
  await connectMongo();

  const result: PreviewResult = {
    wouldProcess: 0,
    previews: [],
    errors: [],
  };

  try {
    const now = new Date();

    // Find all invoices with active reminders that are due
    const dueInvoices = await Invoice.find({
      "paymentReminders.enabled": true,
      "paymentReminders.nextReminderDate": { $lte: now },
      status: { $in: ["pending", "overdue"] },
    }).populate("clientId");

    result.wouldProcess = dueInvoices.length;

    for (const invoice of dueInvoices) {
      try {
        const clientDetails = invoice.clientId as any;
        const clientEmail = clientDetails
          ? getEmailForPurpose(clientDetails, "accounting")
          : null;
        const reminderHistory = invoice.paymentReminders?.reminderHistory || [];
        const reminderSequence = reminderHistory.length + 1;

        result.previews.push({
          invoiceId: invoice.invoiceId,
          invoiceMongoId: invoice._id.toString(),
          jobTitle: invoice.jobTitle,
          clientName: clientDetails?.clientName || "Unknown",
          clientEmail: clientEmail || "No email found",
          reminderSequence,
          nextReminderDate: invoice.paymentReminders?.nextReminderDate
            ? new Date(invoice.paymentReminders.nextReminderDate).toISOString()
            : null,
          frequency: invoice.paymentReminders?.frequency || "none",
        });
      } catch (error) {
        result.errors.push(
          `Error previewing invoice ${invoice.invoiceId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return result;
  } catch (error) {
    const errorMsg = `Error in previewAutoReminders: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    return result;
  }
}

// Process automatic reminders (called by cron job)
export async function processAutoReminders(): Promise<ProcessResult> {
  await connectMongo();

  const result: ProcessResult = {
    processedCount: 0,
    sentCount: 0,
    errors: [],
  };

  try {
    const now = new Date();

    // Find all invoices with active reminders that are due
    const dueInvoices = await Invoice.find({
      "paymentReminders.enabled": true,
      "paymentReminders.nextReminderDate": { $lte: now },
      status: { $in: ["pending", "overdue"] },
    });

    result.processedCount = dueInvoices.length;

    for (const invoice of dueInvoices) {
      try {
        const sendResult = await sendPaymentReminderEmail(
          invoice._id.toString(),
          "system",
        );

        if (sendResult.success) {
          result.sentCount++;

          // Calculate next reminder date
          const frequency = invoice.paymentReminders?.frequency;
          let nextReminderDate: Date | undefined;
          if (frequency && frequency !== "none") {
            const days =
              frequency === "3days"
                ? 3
                : frequency === "5days"
                  ? 5
                  : frequency === "7days"
                    ? 7
                    : 14;

            // Set reminder date to 9 AM PST (16:00 UTC) to match cron job schedule
            const targetDate = new Date(
              now.getTime() + days * 24 * 60 * 60 * 1000,
            );
            nextReminderDate = new Date(
              targetDate.getFullYear(),
              targetDate.getMonth(),
              targetDate.getDate(),
              16,
              0,
              0,
              0,
            ); // 16:00 UTC = 9 AM PST
          }

          // Update next reminder date
          await Invoice.findByIdAndUpdate(invoice._id, {
            "paymentReminders.nextReminderDate": nextReminderDate,
          });

          // Note: Audit log is already created by sendPaymentReminderEmail
        } else {
          result.errors.push(
            `Failed to send reminder for invoice ${invoice.invoiceId}: ${sendResult.error}`,
          );
        }
      } catch (error) {
        const errorMsg = `Error processing invoice ${invoice.invoiceId}: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(
      `Processed ${result.processedCount} invoices, sent ${result.sentCount} reminders`,
    );
    return result;
  } catch (error) {
    const errorMsg = `Error in processAutoReminders: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    return result;
  }
}

// Send payment reminder email with history tracking and audit logging
export async function sendPaymentReminderEmail(
  invoiceId: string,
  performedBy: string = "user",
  recipientEmail?: string,
) {
  await connectMongo();

  let invoice: InvoiceType | null = null;

  try {
    // Find the invoice
    invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Find client details
    const clientDetails = await Client.findOne({ _id: invoice.clientId });
    if (!clientDetails) {
      return { success: false, error: "Client not found" };
    }

    const allowedEmails = [
      clientDetails.emails?.primary,
      clientDetails.emails?.accounting,
      clientDetails.emails?.scheduling,
      clientDetails.email,
    ]
      .filter(Boolean)
      .map((email) => String(email).trim().toLowerCase());

    if (recipientEmail) {
      const normalizedRecipient = recipientEmail.trim().toLowerCase();
      if (!allowedEmails.includes(normalizedRecipient)) {
        return {
          success: false,
          error: "Recipient email is not associated with this client",
        };
      }
    }

    // Use provided recipient email or fall back to accounting email
    const clientEmail =
      recipientEmail || getEmailForPurpose(clientDetails, "accounting");
    if (!clientEmail) {
      return { success: false, error: "Client email not found" };
    }

    // Calculate total amount with tax
    const total =
      invoice.items?.reduce(
        (sum: number, item: { price: number }) => sum + (item?.price || 0),
        0,
      ) || 0;
    const totalWithTax = total * 1.05; // Adding 5% tax

    // Determine reminder sequence
    const reminderHistory = invoice.paymentReminders?.reminderHistory || [];
    const reminderSequence = reminderHistory.length + 1;
    const sequenceText = getSequenceText(reminderSequence);

    // Format dates and amounts
    const issuedDate =
      invoice.dateIssued instanceof Date
        ? invoice.dateIssued
        : new Date(invoice.dateIssued);
    const issueDateFormatted = formatDateStringUTC(issuedDate);
    const formattedAmount = formatAmount(totalWithTax).replace("$", "");

    // Calculate due date using UTC-safe utility
    const dueDate = calculatePaymentDueDate(issuedDate);
    const formattedDueDate = formatDateStringUTC(dueDate);

    // Check if invoice is overdue
    const now = new Date();
    const isOverdue = now > dueDate;

    // Prepare invoice data for PDF generation
    const invoiceData: InvoiceData = {
      invoiceId: invoice.invoiceId,
      dateIssued: issueDateFormatted,
      dateDue: formattedDueDate,
      jobTitle: invoice.jobTitle,
      location: invoice.location,
      clientName: clientDetails.clientName,
      email: clientEmail,
      phoneNumber: clientDetails.phoneNumber,
      items: invoice.items.map((item: { description: any; price: any }) => ({
        description: item.description,
        price: item.price,
        total: item.price,
      })),
      subtotal: total,
      gst: total * 0.05, // 5% GST
      totalAmount: totalWithTax,
      cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
      eTransfer: "adam@vancouverventcleaning.ca",
      terms:
        "Please report any and all cleaning inquiries within 5 business days.",
    };

    // Generate PDF using the PDF document component
    const MyDocument = () => createElement(InvoicePdfDocument, { invoiceData });
    const pdfBuffer = await renderToBuffer(createElement(MyDocument));
    const pdfBase64 = pdfBuffer.toString("base64");

    // Check for Stripe payment link
    let hasOnlinePayment: any = false;
    if (
      invoice.stripePaymentSettings?.enabled &&
      invoice.stripePaymentSettings?.paymentLinkToken
    ) {
      const expiresAt = invoice.stripePaymentSettings.paymentLinkExpiresAt;
      const isLinkExpired = expiresAt ? now > new Date(expiresAt) : false;
      if (!isLinkExpired) {
        const paymentLinkUrl = `${getBaseUrl()}/pay?token=${invoice.stripePaymentSettings.paymentLinkToken}`;

        hasOnlinePayment = {
          payment_link_url: paymentLinkUrl,
        };
      }
    }

    // Send email using Postmark with sequence-aware template
    // IMPORTANT: Variables used inside conditional sections must be nested within those sections
    const templateModel: Record<string, any> = {
      client_name: clientDetails.clientName,
      invoice_number: invoice.invoiceId || "",
      jobTitle: invoice.jobTitle || "",
      issue_date: issueDateFormatted,
      due_date: formattedDueDate,
      amount_due: formattedAmount,
      phone_number: "604-273-8717",
      contact_email: "adam@vancouverventcleaning.ca",
      header_title: `${sequenceText} Payment Reminder - Vent Cleaning & Certification`,
      email_title: `${sequenceText} Payment Reminder - Vent Cleaning & Certification`,
      reminder_sequence: sequenceText,
      total_reminders_sent: reminderSequence.toString(),
      has_online_payment: hasOnlinePayment,
      first_reminder:
        reminderSequence === 1
          ? {
              invoice_number: invoice.invoiceId || "",
              jobTitle: invoice.jobTitle || "",
              due_date: formattedDueDate,
            }
          : false,
      subsequent_reminder:
        reminderSequence > 1
          ? {
              reminder_sequence: sequenceText,
            }
          : false,
      is_overdue: isOverdue
        ? {
            invoice_number: invoice.invoiceId || "",
            jobTitle: invoice.jobTitle || "",
            due_date: formattedDueDate,
          }
        : false,
      is_before_due: !isOverdue
        ? {
            invoice_number: invoice.invoiceId || "",
            jobTitle: invoice.jobTitle || "",
            due_date: formattedDueDate,
          }
        : false,
    };

    const emailResult = await postmarkClient.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "payment-reminder-1",
      TemplateModel: templateModel,
      Attachments: [
        {
          Name: `${invoice.jobTitle.trim()} - Invoice.pdf`,
          Content: pdfBase64,
          ContentType: "application/pdf",
          ContentID: `invoice-${invoice.invoiceId}`,
        },
      ], // Always attach PDF - template shows appropriate message
      TrackOpens: true,
      MessageStream: "payment-reminder",
    });

    // Update reminder history and audit log
    const now2 = new Date();
    const reminderEntry = {
      sentAt: now2.toISOString(), // Convert to string for client serialization
      emailTemplate: "payment-reminder-1",
      success: true,
      sequence: reminderSequence,
      // Explicitly create a plain object without any MongoDB properties
    };

    await Invoice.findByIdAndUpdate(invoiceId, {
      $push: {
        "paymentReminders.reminderHistory": reminderEntry,
      },
    });

    // Create audit log entry
    await AuditLog.create({
      invoiceId,
      action:
        performedBy === "system"
          ? "reminder_sent_auto"
          : "reminder_sent_manual",
      timestamp: now2,
      performedBy,
      details: {
        newValue: {
          reminderSequence,
          emailTemplate: "payment-reminder-1",
          invoiceId: invoice.invoiceId,
          jobTitle: invoice.jobTitle,
          invoiceMongoId: invoice._id?.toString?.() || invoiceId,
          clientId: invoice.clientId?.toString?.() || invoice.clientId,
        },
        reason:
          performedBy === "system"
            ? "Automatic reminder sent"
            : "Manual reminder sent",
      },
      success: true,
    });

    return {
      success: true,
      message: `${sequenceText} payment reminder sent successfully`,
    };
  } catch (error) {
    console.error("Failed to send payment reminder:", error);

    // Log the failure in audit logs
    try {
      await AuditLog.create({
        invoiceId,
        action: "reminder_failed",
        timestamp: new Date(),
        performedBy,
        details: {
          newValue: {
            invoiceId: invoice?.invoiceId,
            jobTitle: invoice?.jobTitle,
            invoiceMongoId: invoice?._id?.toString?.() || invoiceId,
            clientId: invoice?.clientId?.toString?.() || invoice?.clientId,
          },
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    return {
      success: false,
      error: "Failed to send payment reminder",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get reminder settings and history for an invoice
export async function getReminderSettings(invoiceId: string) {
  await connectMongo();

  try {
    const invoiceDoc = (await Invoice.findById(invoiceId)
      .select("paymentReminders invoiceId")
      .lean()) as InvoiceType | null;

    if (!invoiceDoc) {
      return { success: false, error: "Invoice not found" };
    }

    // Use JSON.parse(JSON.stringify()) to completely strip MongoDB types
    const invoice = JSON.parse(JSON.stringify(invoiceDoc));

    // Get audit logs from separate collection
    const rawAuditLogsDoc = await AuditLog.find({
      $or: [
        { invoiceId },
        { invoiceId: invoiceDoc.invoiceId },
        { "details.newValue.invoiceMongoId": invoiceId },
      ],
      action: {
        $in: [
          "reminder_configured",
          "reminder_sent_auto",
          "reminder_sent_manual",
          "reminder_failed",
        ],
      },
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Use JSON.parse(JSON.stringify()) to completely strip MongoDB types
    const rawAuditLogs = JSON.parse(JSON.stringify(rawAuditLogsDoc));

    // Convert MongoDB objects to plain objects for client components
    const auditLogs = rawAuditLogs.map((log: any) => ({
      _id: log._id?.toString() || "",
      invoiceId: log.invoiceId || "",
      action: log.action || "",
      timestamp:
        log.timestamp instanceof Date
          ? log.timestamp.toISOString()
          : String(log.timestamp || ""),
      performedBy: log.performedBy || "",
      details: log.details || {},
      ipAddress: log.ipAddress || "",
      userAgent: log.userAgent || "",
      success: log.success ?? false,
      errorMessage: log.errorMessage || "",
      // Explicitly create plain object without MongoDB methods
    }));

    // Convert reminderHistory dates to ISO strings for client serialization
    const paymentReminders = invoice.paymentReminders
      ? {
          enabled: invoice.paymentReminders.enabled,
          frequency: invoice.paymentReminders.frequency,
          nextReminderDate:
            invoice.paymentReminders.nextReminderDate instanceof Date
              ? invoice.paymentReminders.nextReminderDate.toISOString()
              : invoice.paymentReminders.nextReminderDate,
          lastReminderSent:
            invoice.paymentReminders.lastReminderSent instanceof Date
              ? invoice.paymentReminders.lastReminderSent.toISOString()
              : invoice.paymentReminders.lastReminderSent,
          reminderHistory:
            invoice.paymentReminders.reminderHistory?.map((entry: any) => {
              // Create a new plain object without MongoDB properties like _id
              const plainEntry: any = {};
              if (entry.sentAt !== undefined) {
                plainEntry.sentAt =
                  entry.sentAt instanceof Date
                    ? entry.sentAt.toISOString()
                    : String(entry.sentAt);
              }
              if (entry.emailTemplate !== undefined) {
                plainEntry.emailTemplate = entry.emailTemplate;
              }
              if (entry.success !== undefined) {
                plainEntry.success = entry.success;
              }
              if (entry.sequence !== undefined) {
                plainEntry.sequence = entry.sequence;
              }
              if (entry.errorMessage !== undefined) {
                plainEntry.errorMessage = entry.errorMessage;
              }
              return plainEntry;
            }) || [],
        }
      : undefined;

    return {
      success: true,
      data: {
        paymentReminders,
        auditLogs: auditLogs || [],
      },
    };
  } catch (error) {
    console.error("Error getting reminder settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to get sequence text
function getSequenceText(sequence: number): string {
  switch (sequence) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    default:
      return `${sequence}th`;
  }
}

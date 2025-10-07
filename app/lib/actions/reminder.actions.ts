"use server";

import connectMongo from "../connect";
import { Invoice, Client, AuditLog } from "../../../models/reactDataSchema";
import { getEmailForPurpose } from "../utils";
import { formatAmount, formatDateStringUTC } from "../utils";
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

// Configure reminder settings for an invoice
export async function configurePaymentReminders(
  invoiceId: string,
  settings: {
    enabled: boolean;
    frequency: "none" | "3days" | "7days" | "14days";
  },
  performedBy?: string,
) {
  await connectMongo();

  try {
    // Calculate next reminder date based on frequency
    let nextReminderDate: Date | undefined;
    if (settings.enabled && settings.frequency !== "none") {
      const now = new Date();
      const days =
        settings.frequency === "3days"
          ? 3
          : settings.frequency === "7days"
            ? 7
            : 14;

      // Set reminder date to 9 AM PST (16:00 UTC) to match cron job schedule
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      nextReminderDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 16, 0, 0, 0); // 16:00 UTC = 9 AM PST
    }

    // Get current reminder settings for audit log
    const currentInvoice = await Invoice.findById(invoiceId);
    const oldSettings = currentInvoice?.paymentReminders;

    // Update the invoice
    const updateData = {
      "paymentReminders.enabled": settings.enabled,
      "paymentReminders.frequency": settings.frequency,
      "paymentReminders.nextReminderDate": nextReminderDate,
    };

    await Invoice.findByIdAndUpdate(invoiceId, updateData);

    // Create audit log entry
    await AuditLog.create({
      invoiceId,
      action: "reminder_configured",
      timestamp: new Date(),
      performedBy: performedBy || "user",
      details: {
        oldValue: oldSettings,
        newValue: { ...settings, nextReminderDate },
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
              frequency === "3days" ? 3 : frequency === "7days" ? 7 : 14;

            // Set reminder date to 9 AM PST (16:00 UTC) to match cron job schedule
            const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            nextReminderDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 16, 0, 0, 0); // 16:00 UTC = 9 AM PST
          }

          // Update next reminder date
          await Invoice.findByIdAndUpdate(invoice._id, {
            "paymentReminders.nextReminderDate": nextReminderDate,
          });

          // Create audit log entry
          await AuditLog.create({
            invoiceId: invoice._id.toString(),
            action: "reminder_sent_auto",
            timestamp: new Date(),
            performedBy: "system",
            details: {
              reason: "Automatic reminder sent via cron job",
              nextReminderDate,
            },
            success: true,
          });
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
) {
  await connectMongo();

  try {
    // Find the invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Find client details
    const clientDetails = await Client.findOne({ _id: invoice.clientId });
    if (!clientDetails) {
      return { success: false, error: "Client not found" };
    }

    // Get appropriate email for accounting purposes
    const clientEmail = getEmailForPurpose(clientDetails, "accounting");
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
    const issueDateFormatted = formatDateStringUTC(invoice.dateIssued);
    const formattedAmount = formatAmount(totalWithTax).replace("$", "");

    // Calculate due date (14 days from issue date)
    const issueDate = new Date(invoice.dateIssued);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

    // Send email using Postmark with sequence-aware template
    // IMPORTANT: Variables used inside conditional sections must be nested within those sections
    const templateModel = {
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
      first_reminder: reminderSequence === 1
        ? {
            invoice_number: invoice.invoiceId || "",
            jobTitle: invoice.jobTitle || "",
            due_date: formattedDueDate,
          }
        : false,
      subsequent_reminder: reminderSequence > 1
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

    // Debug log to verify template data
    console.log("Payment Reminder Template Model:", templateModel);

    const emailResult = await postmarkClient.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "payment-reminder",
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
      emailTemplate: "payment-reminder",
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
        reminderSequence,
        emailTemplate: "payment-reminder",
        success: true,
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
          error: error instanceof Error ? error.message : String(error),
          success: false,
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
    const invoiceDoc = await Invoice.findById(invoiceId)
      .select("paymentReminders")
      .lean();

    if (!invoiceDoc) {
      return { success: false, error: "Invoice not found" };
    }

    // Use JSON.parse(JSON.stringify()) to completely strip MongoDB types
    const invoice = JSON.parse(JSON.stringify(invoiceDoc));

    // Get audit logs from separate collection
    const rawAuditLogsDoc = await AuditLog.find({
      invoiceId,
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
                plainEntry.sentAt = entry.sentAt instanceof Date
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

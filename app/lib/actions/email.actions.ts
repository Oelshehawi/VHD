"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import {
  Invoice,
  Client,
  JobsDueSoon,
  AuditLog,
  Schedule,
  Report,
} from "../../../models/reactDataSchema";
import { DueInvoiceType } from "../typeDefinitions";
import { getEmailForPurpose, getBaseUrl, formatDateStringUTC } from "../utils";
import { generateSchedulingToken } from "./autoScheduling.actions";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument, {
  type InvoiceData,
} from "../../../_components/pdf/InvoicePdfDocument";
import ReportPdfDocument from "../../../_components/pdf/ReportPdfDocument";

const postmark = require("postmark");
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Send a cleaning reminder email using Postmark
 * @param dueInvoiceData Information about the due invoice
 * @param includeSchedulingLink Whether to include the scheduling link (default: true)
 * @returns Object with status and message
 */
export async function sendCleaningReminderEmail(
  dueInvoiceData: DueInvoiceType,
  includeSchedulingLink: boolean = true,
) {
  await connectMongo();

  try {
    const { clientId, invoiceId } = dueInvoiceData;

    // Find the invoice
    const invoice = await Invoice.findOne({ _id: invoiceId });
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Find client details
    const clientDetails = await Client.findOne({ _id: clientId });
    if (!clientDetails) {
      return { success: false, error: "Client not found" };
    }

    // Get appropriate email for scheduling purposes
    const clientEmail = getEmailForPurpose(clientDetails, "scheduling");
    if (!clientEmail) {
      return { success: false, error: "Client email not found" };
    }

    // Format the due date using UTC-safe utility
    const formattedDate = formatDateStringUTC(invoice.dateDue);

    // Find JobsDueSoon to generate scheduling link (only if requested)
    let hasSchedulingLink: any = false;

    if (includeSchedulingLink) {
      const jobsDueSoon = await JobsDueSoon.findOne({ invoiceId: invoiceId });
      if (jobsDueSoon) {
        // Generate scheduling token and link
        const schedulingToken = await generateSchedulingToken(
          jobsDueSoon._id.toString(),
        );
        const schedulingLink = `${getBaseUrl()}/client-portal/schedule?token=${schedulingToken}`;
        hasSchedulingLink = {
          scheduling_link: schedulingLink,
        };
      }
    }

    // Send email using Postmark
    const client = new postmark.ServerClient(process.env.POSTMARK_CLIENT);
    await client.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "cleaning-due-reminder-1",
      TemplateModel: {
        due_date: formattedDate,
        jobTitle: invoice.jobTitle,
        phone_number: "604-273-8717",
        contact_email: "adam@vancouverventcleaning.ca",
        header_title: "Hood & Vent Cleaning Reminder",
        email_title: "Hood & Vent Cleaning Reminder",
        // Client self-scheduling link
        scheduling_link: hasSchedulingLink,
      },
      TrackOpens: true,
      MessageStream: "outbound",
    });

    // Update emailSent field in JobsDueSoon
    await JobsDueSoon.findOneAndUpdate(
      { invoiceId: invoiceId },
      { $set: { emailSent: true } },
      { new: true },
    );

    revalidatePath("/dashboard");
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: "Failed to send email",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

// Note: sendPaymentReminderEmail has been moved to app/lib/actions/reminder.actions.ts
// to integrate with the new automated reminder system

/**
 * Send invoice delivery email using Postmark
 * @param invoiceId The invoice ID to send
 * @param performedBy The user who performed this action
 * @param recipients Optional array of email addresses (if not provided, uses accounting email)
 * @param includeReport Whether to include the report PDF as attachment
 * @returns Object with status and message
 */
export async function sendInvoiceDeliveryEmail(
  invoiceId: string,
  performedBy: string = "system",
  recipients?: string[],
  includeReport: boolean = false,
) {
  await connectMongo();

  try {
    // Find the invoice
    const invoiceDoc = await Invoice.findById(invoiceId);
    if (!invoiceDoc) {
      return { success: false, error: "Invoice not found" };
    }

    // Convert to plain object
    const invoice = invoiceDoc.toObject();

    // Find client details
    const clientDetailsDoc = await Client.findById(invoice.clientId);
    if (!clientDetailsDoc) {
      return { success: false, error: "Client not found" };
    }

    // Convert to plain object
    const clientDetails = clientDetailsDoc.toObject();

    // Get appropriate email for accounting purposes (as default)
    const defaultEmail = getEmailForPurpose(clientDetails, "accounting");

    // Use provided recipients or fall back to default accounting email
    const emailRecipients =
      recipients && recipients.length > 0
        ? recipients
        : defaultEmail
          ? [defaultEmail]
          : [];

    if (emailRecipients.length === 0) {
      return { success: false, error: "No recipient email addresses provided" };
    }

    // Calculate total with tax
    const items = invoice.items || [];
    const total = items.reduce(
      (sum: number, item: { price: number }) => sum + (item?.price || 0),
      0,
    );
    const gst = total * 0.05; // 5% GST
    const totalWithTax = total + gst;

    // Calculate due date (14 days from issue date) - using timezone-safe approach
    const dateStr =
      invoice.dateIssued instanceof Date
        ? invoice.dateIssued.toISOString()
        : String(invoice.dateIssued);
    const datePart = dateStr.split("T")[0] || dateStr;
    const parts = datePart.split("-");
    const baseYear = parseInt(parts[0], 10);
    const baseMonth = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const baseDay = parseInt(parts[2], 10);

    // Create date in local timezone
    const issueDate = new Date(baseYear, baseMonth, baseDay);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);

    // Use formatDateStringUTC to avoid timezone shift
    const { formatDateStringUTC } = await import("../utils");
    const formattedDueDate = formatDateStringUTC(dueDate);
    const formattedIssueDate = formatDateStringUTC(issueDate);

    // Prepare invoice data for PDF generation
    const pdfInvoiceData: InvoiceData = {
      invoiceId: invoice.invoiceId,
      dateIssued: formattedIssueDate,
      dateDue: formattedDueDate,
      jobTitle: invoice.jobTitle,
      location: invoice.location,
      clientName: clientDetails.clientName,
      email: defaultEmail || emailRecipients[0] || "",
      phoneNumber: clientDetails.phoneNumber,
      items: items.map(
        (item: { description: any; price: any; details?: any }) => ({
          description: item.description,
          details: item.details || "",
          price: item.price,
          total: item.price,
        }),
      ),
      subtotal: total,
      gst: gst,
      totalAmount: totalWithTax,
      cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
      eTransfer: "adam@vancouverventcleaning.ca",
      terms:
        "Please report any and all cleaning inquiries within 5 business days.",
    };

    // Generate PDF using the PDF document component
    const MyDocument = () =>
      createElement(InvoicePdfDocument, { invoiceData: pdfInvoiceData });
    const pdfBuffer = await renderToBuffer(createElement(MyDocument));
    const pdfBase64 = pdfBuffer.toString("base64");

    // Check for Stripe payment link
    let hasOnlinePaymentBlock: any = false;

    console.log(
      "Online payment enabled:",
      Boolean(invoice.stripePaymentSettings?.enabled),
    );
    console.log(
      "Payment link token present:",
      Boolean(invoice.stripePaymentSettings?.paymentLinkToken),
    );

    if (
      invoice.stripePaymentSettings?.enabled &&
      invoice.stripePaymentSettings?.paymentLinkToken
    ) {
      const expiresAt = invoice.stripePaymentSettings.paymentLinkExpiresAt;
      const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
      console.log("Payment link active:", !isExpired);

      if (!isExpired) {
        const paymentLinkUrl = `${getBaseUrl()}/pay?token=${invoice.stripePaymentSettings.paymentLinkToken}`;

        hasOnlinePaymentBlock = {
          payment_link_url: paymentLinkUrl,
        };
      }
    }

    console.log(
      "Online payment block included:",
      Boolean(hasOnlinePaymentBlock),
    );

    // Prepare template model
    const templateModel: Record<string, any> = {
      client_name: clientDetails.clientName,
      invoice_number: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      amount_due: totalWithTax.toFixed(2),
      due_date: formattedDueDate,
      issue_date: formattedIssueDate,
      phone_number: "604-273-8717",
      contact_email: "adam@vancouverventcleaning.ca",
      header_title: "Invoice - Vent Cleaning & Certification",
      email_title: "Invoice - Vent Cleaning & Certification",
      has_online_payment: hasOnlinePaymentBlock,
    };

    // Build attachments array
    const attachments = [
      {
        Name: `${invoice.jobTitle.trim()} - Invoice.pdf`,
        Content: pdfBase64,
        ContentType: "application/pdf",
        ContentID: `invoice-${invoice.invoiceId}`,
      },
    ];

    // Add report PDF if requested
    if (includeReport) {
      try {
        // Find schedules linked to this invoice
        const schedules = await Schedule.find({ invoiceRef: invoiceId }).lean();
        if (schedules && schedules.length > 0) {
          const scheduleIds = schedules.map((s: any) => s._id.toString());
          const report = await Report.findOne({
            scheduleId: { $in: scheduleIds },
          }).lean();

          if (report) {
            const reportData = report as any;
            // Fetch technician data for report PDF
            let technicianData = {
              id: reportData.technicianId || "",
              firstName: "Unknown",
              lastName: "Technician",
              fullName: "Unknown Technician",
              email: "",
            };

            if (reportData.technicianId) {
              try {
                const clerk = await clerkClient();
                const user = await clerk.users.getUser(reportData.technicianId);
                if (user) {
                  technicianData = {
                    id: user.id,
                    firstName: user.firstName || "Unknown",
                    lastName: user.lastName || "Technician",
                    fullName:
                      user.fullName ||
                      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      "Unknown Technician",
                    email: user.emailAddresses?.[0]?.emailAddress || "",
                  };
                }
              } catch (techError) {
                console.error("Failed to fetch technician data:", techError);
              }
            }

            // Generate report PDF
            const ReportDocument = () =>
              createElement(ReportPdfDocument, {
                report: report as any,
                technician: technicianData,
              });
            const reportBuffer = await renderToBuffer(
              createElement(ReportDocument),
            );
            const reportBase64 = reportBuffer.toString("base64");

            attachments.push({
              Name: `${invoice.jobTitle.trim()} - Report.pdf`,
              Content: reportBase64,
              ContentType: "application/pdf",
              ContentID: `report-${invoice.invoiceId}`,
            });
          }
        }
      } catch (reportError) {
        console.error("Failed to generate report PDF:", reportError);
        // Continue without report attachment
      }
    }

    // Send email using Postmark with PDF attachment to all recipients
    const postmarkClient = new postmark.ServerClient(
      process.env.POSTMARK_CLIENT,
    );

    // Send to all recipients
    for (const recipient of emailRecipients) {
      await postmarkClient.sendEmailWithTemplate({
        From: "adam@vancouverventcleaning.ca",
        To: recipient,
        TemplateAlias: "invoice-delivery-1",
        TemplateModel: templateModel,
        Attachments: attachments,
        TrackOpens: true,
        MessageStream: "invoice-delivery",
      });
    }

    // Create audit log entry for invoice email sent
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "invoice_emailed",
      timestamp: new Date(),
      performedBy: performedBy,
      details: {
        newValue: {
          invoiceId: invoice.invoiceId,
          invoiceMongoId: invoice._id.toString(),
          jobTitle: invoice.jobTitle,
          clientEmail: emailRecipients.join(", "),
          recipients: emailRecipients,
          includeReport: includeReport,
          clientName: clientDetails.clientName,
        },
        reason: `Invoice sent to ${emailRecipients.length} recipient(s) via email${includeReport ? " with report" : ""}`,
        metadata: {
          clientId: invoice.clientId,
        },
      },
      success: true,
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, message: "Invoice email sent successfully" };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return {
      success: false,
      error: "Failed to send invoice email",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

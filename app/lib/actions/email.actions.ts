"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Invoice, Client, JobsDueSoon, AuditLog } from "../../../models/reactDataSchema";
import { DueInvoiceType } from "../typeDefinitions";
import {
  getEmailForPurpose,
} from "../utils";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument, {
  type InvoiceData,
} from "../../../_components/pdf/InvoicePdfDocument";


const postmark = require("postmark");

/**
 * Send a cleaning reminder email using Postmark
 * @param dueInvoiceData Information about the due invoice
 * @returns Object with status and message
 */
export async function sendCleaningReminderEmail(
  dueInvoiceData: DueInvoiceType,
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

    // Format the due date
    let utcDate: Date;
    if (invoice.dateDue instanceof Date) {
      utcDate = new Date(
        invoice.dateDue.getTime() + invoice.dateDue.getTimezoneOffset() * 60000,
      );
    } else {
      utcDate = new Date(invoice.dateDue);
    }

    const formattedDate = utcDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send email using Postmark
    const client = new postmark.ServerClient(process.env.POSTMARK_CLIENT);

    await client.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "cleaning-due-reminder",
      TemplateModel: {
        due_date: formattedDate,
        jobTitle: invoice.jobTitle,
        phone_number: "604-273-8717",
        contact_email: "adam@vancouverventcleaning.ca",
        header_title: "Hood & Vent Cleaning Reminder",
        email_title: "Hood & Vent Cleaning Reminder",
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
 * @returns Object with status and message
 */
export async function sendInvoiceDeliveryEmail(invoiceId: string, performedBy: string = "system") {
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

    // Get appropriate email for accounting purposes
    const clientEmail = getEmailForPurpose(clientDetails, "accounting");
    if (!clientEmail) {
      return { success: false, error: "Client email not found" };
    }

    // Calculate total with tax
    const items = invoice.items || [];
    const total =
      items.reduce(
        (sum: number, item: { price: number }) => sum + (item?.price || 0),
        0,
      );
    const gst = total * 0.05; // 5% GST
    const totalWithTax = total + gst;

    // Calculate due date (14 days from issue date)
    const issueDate = new Date(invoice.dateIssued);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format issue date
    const formattedIssueDate = issueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Prepare invoice data for PDF generation
    const pdfInvoiceData: InvoiceData = {
      invoiceId: invoice.invoiceId,
      dateIssued: formattedIssueDate,
      dateDue: formattedDueDate,
      jobTitle: invoice.jobTitle,
      location: invoice.location,
      clientName: clientDetails.clientName,
      email: clientEmail,
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

    // Prepare template model
    const templateModel = {
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
    };

    // Send email using Postmark with PDF attachment
    const postmarkClient = new postmark.ServerClient(
      process.env.POSTMARK_CLIENT,
    );

    await postmarkClient.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "invoice-delivery",
      TemplateModel: templateModel,
      Attachments: [
        {
          Name: `${invoice.jobTitle.trim()} - Invoice.pdf`,
          Content: pdfBase64,
          ContentType: "application/pdf",
          ContentID: `invoice-${invoice.invoiceId}`,
        },
      ],
      TrackOpens: true,
      MessageStream: "invoice-delivery",
    });

    // Create audit log entry for invoice email sent
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "invoice_emailed",
      timestamp: new Date(),
      performedBy: performedBy,
      details: {
        newValue: {
          invoiceId: invoice.invoiceId,
          jobTitle: invoice.jobTitle,
          clientEmail: clientEmail,
          clientName: clientDetails.clientName,
        },
        reason: "Invoice sent to client via email",
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

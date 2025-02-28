"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Invoice, Client, JobsDueSoon } from "../../../models/reactDataSchema";
import { DueInvoiceType } from "../typeDefinitions";
import { formatAmount } from "../utils";

const postmark = require("postmark");

const getAbsoluteUrl = (path: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${baseUrl}${path}`;
};

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
    if (!clientDetails || !clientDetails.email) {
      return { success: false, error: "Client email not found" };
    }

    const clientEmail = clientDetails.email;

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

/**
 * Send a payment reminder email using Postmark
 * @param invoice The invoice to send a payment reminder for
 * @returns Object with status and message
 */
export async function sendPaymentReminderEmail(invoiceId: string) {
  await connectMongo();

  try {
    // Find the invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Find client details
    const clientDetails = await Client.findOne({ _id: invoice.clientId });
    if (!clientDetails || !clientDetails.email) {
      return { success: false, error: "Client email not found" };
    }

    // Format dates and amounts
    const issueDateFormatted = new Date(invoice.dateIssued).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    // Calculate total amount with tax
    const total = invoice.items.reduce((sum, item) => sum + item.price, 0);
    const totalWithTax = total * 1.05; // Adding 5% tax
    const formattedAmount = formatAmount(totalWithTax).replace("$", "");

    // Generate PDF invoice URL using the helper
    const pdfUrl = getAbsoluteUrl(`/invoices/${invoice._id}/pdf`);

    // Send email using Postmark
    const client = new postmark.ServerClient(process.env.POSTMARK_CLIENT);

    await client.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientDetails.email,
      TemplateAlias: "payment-reminder",
      TemplateModel: {
        client_name: clientDetails.clientName,
        invoice_number: invoice.invoiceId,
        jobTitle: invoice.jobTitle,
        issue_date: issueDateFormatted,
        amount_due: formattedAmount,
        invoice_pdf_url: pdfUrl,
        phone_number: "604-273-8717",
        contact_email: "adam@vancouverventcleaning.ca",
        header_title: "Payment for Vent Cleaning & Certification",
        email_title: "Payment for Vent Cleaning & Certification",
      },
      TrackOpens: true,
    });

    // Update emailSent field in Invoice
    await Invoice.findByIdAndUpdate(
      invoiceId,
      { $set: { paymentEmailSent: true } },
      { new: true },
    );

    revalidatePath("/dashboard");
    return { success: true, message: "Payment reminder sent successfully" };
  } catch (error) {
    console.error("Failed to send payment reminder:", error);
    return {
      success: false,
      error: "Failed to send payment reminder",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

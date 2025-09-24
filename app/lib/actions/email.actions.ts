"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Invoice, Client, JobsDueSoon } from "../../../models/reactDataSchema";
import { DueInvoiceType } from "../typeDefinitions";
import {
  getEmailForPurpose,
} from "../utils";


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

import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import {
  Invoice,
  Client,
  Schedule,
  AuditLog,
} from "../../../models/reactDataSchema";
import { getEmailForPurpose } from "../../../app/lib/utils";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument, {
  type InvoiceData,
} from "../../../_components/pdf/InvoicePdfDocument";

const postmark = require("postmark");

const postmarkClient = new postmark.ServerClient(
  process.env.POSTMARK_CLIENT || "",
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Extract data from request body
    const { scheduleId, invoiceRef, invoiceData, technicianId, isComplete } =
      req.body;

    // Validate inputs
    if (!scheduleId || !invoiceRef) {
      return res.status(400).json({
        message: "Schedule ID and invoice reference are required",
      });
    }

    if (!isComplete) {
      return res.status(400).json({
        message: "Work documentation must be complete before sending invoice",
      });
    }

    // Connect to the database
    await connectMongo();

    // Find the invoice and client details
    const invoice = await Invoice.findById(invoiceRef);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const clientDetails = await Client.findById(invoice.clientId);
    if (!clientDetails) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get appropriate email for accounting purposes
    const clientEmail = getEmailForPurpose(clientDetails, "accounting");
    if (!clientEmail) {
      return res.status(400).json({ message: "Client email not found" });
    }

    // Calculate total with tax
    const items = invoiceData.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { price: number }) => sum + (item?.price || 0),
      0,
    );
    const gst = subtotal * 0.05; // 5% GST
    const totalWithTax = subtotal + gst;

    // Calculate due date (14 days from issue date) - using timezone-safe approach
    const dateStr =
      invoiceData.dateIssued instanceof Date
        ? invoiceData.dateIssued.toISOString()
        : String(invoiceData.dateIssued);
    const datePart = dateStr.split("T")[0] || dateStr;
    const parts = datePart.split("-");
    const baseYear = parseInt(parts[0], 10);
    const baseMonth = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const baseDay = parseInt(parts[2], 10);

    // Create date in local timezone
    const issueDate = new Date(baseYear, baseMonth, baseDay);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);

    // Import and use formatDateStringUTC to avoid timezone shift
    const { formatDateStringUTC } = require("../../../app/lib/utils");
    const formattedDueDate = formatDateStringUTC(dueDate);

    // Prepare invoice data for PDF generation
    const pdfInvoiceData: InvoiceData = {
      invoiceId: invoiceData.invoiceId,
      dateIssued: invoiceData.dateIssued, // Keep original format for PDF
      dateDue: formattedDueDate,
      jobTitle: invoiceData.jobTitle,
      location: invoiceData.location,
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
      subtotal: subtotal,
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

    if (
      invoice.stripePaymentSettings?.enabled &&
      invoice.stripePaymentSettings?.paymentLinkToken
    ) {
      const expiresAt = invoice.stripePaymentSettings.paymentLinkExpiresAt;
      const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;

      if (!isExpired) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://vhd-psi.vercel.app";
        const paymentLinkUrl = `${baseUrl}/pay?token=${invoice.stripePaymentSettings.paymentLinkToken}`;

        hasOnlinePaymentBlock = {
          payment_link_url: paymentLinkUrl,
        };
      }
    }

    // Prepare email template model
    const templateModel = {
      client_name: clientDetails.clientName,
      invoice_number: invoiceData.invoiceId,
      jobTitle: invoiceData.jobTitle,
      amount_due: totalWithTax.toFixed(2),
      due_date: formattedDueDate,
      phone_number: "604-273-8717",
      contact_email: "adam@vancouverventcleaning.ca",
      header_title: "Invoice - Vent Cleaning & Certification",
      email_title: "Invoice - Vent Cleaning & Certification",
      has_online_payment: hasOnlinePaymentBlock,
    };

    // Send email using Postmark with invoice delivery template
    const emailResult = await postmarkClient.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "invoice-delivery", // New template to be created in Postmark
      TemplateModel: templateModel,
      Attachments: [
        {
          Name: `${invoiceData.jobTitle.trim()} - Invoice.pdf`,
          Content: pdfBase64,
          ContentType: "application/pdf",
          ContentID: `invoice-${invoiceData.invoiceId}`,
        },
      ],
      TrackOpens: true,
      MessageStream: "invoice-delivery",
    });

    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "invoice_emailed",
      timestamp: new Date(),
      performedBy: technicianId,
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

    // Return success response
    return res.status(200).json({
      message: "Invoice sent successfully",
      emailMessageId: emailResult.MessageID,
      sentTo: clientEmail,
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return res.status(500).json({
      message: "Failed to send invoice",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

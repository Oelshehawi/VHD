import { NextResponse } from "next/server";
import connectMongo from "../../lib/connect";
import { Invoice, Client, AuditLog } from "../../../models/reactDataSchema";
import {
  getEmailForPurpose,
  getBaseUrl,
  formatDateStringUTC,
} from "../../lib/utils";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument, {
  type InvoiceData,
} from "../../../_components/pdf/InvoicePdfDocument";

const postmark = require("postmark");

const postmarkClient = new postmark.ServerClient(
  process.env.POSTMARK_CLIENT || "",
);

export async function POST(request: Request) {
  try {
    const { scheduleId, invoiceRef, invoiceData, technicianId, isComplete } =
      await request.json();

    if (!scheduleId || !invoiceRef) {
      return NextResponse.json(
        { message: "Schedule ID and invoice reference are required" },
        { status: 400 },
      );
    }

    if (!isComplete) {
      return NextResponse.json(
        { message: "Work documentation must be complete before sending invoice" },
        { status: 400 },
      );
    }

    await connectMongo();

    const invoice = await Invoice.findById(invoiceRef);
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    const clientDetails = await Client.findById(invoice.clientId);
    if (!clientDetails) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }

    const clientEmail = getEmailForPurpose(clientDetails, "accounting");
    if (!clientEmail) {
      return NextResponse.json(
        { message: "Client email not found" },
        { status: 400 },
      );
    }

    const items = invoiceData.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { price: number }) => sum + (item?.price || 0),
      0,
    );
    const gst = subtotal * 0.05;
    const totalWithTax = subtotal + gst;

    const dateStr =
      invoiceData.dateIssued instanceof Date
        ? invoiceData.dateIssued.toISOString()
        : String(invoiceData.dateIssued);
    const datePart = dateStr.split("T")[0] || dateStr;
    const parts = datePart.split("-");
    if (parts.length < 3) {
      return NextResponse.json(
        { message: "Invalid dateIssued format (expected YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    const baseYear = parseInt(parts[0] || "", 10);
    const baseMonth = parseInt(parts[1] || "", 10) - 1;
    const baseDay = parseInt(parts[2] || "", 10);

    const hasValidParts =
      Number.isFinite(baseYear) &&
      Number.isFinite(baseMonth) &&
      Number.isFinite(baseDay) &&
      baseMonth >= 0 &&
      baseMonth <= 11 &&
      baseDay >= 1 &&
      baseDay <= 31;

    if (!hasValidParts) {
      return NextResponse.json(
        { message: "Invalid dateIssued value" },
        { status: 400 },
      );
    }

    const issueDate = new Date(baseYear, baseMonth, baseDay);
    if (
      Number.isNaN(issueDate.getTime()) ||
      issueDate.getFullYear() !== baseYear ||
      issueDate.getMonth() !== baseMonth ||
      issueDate.getDate() !== baseDay
    ) {
      return NextResponse.json(
        { message: "Invalid dateIssued value" },
        { status: 400 },
      );
    }
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);

    const formattedDueDate = formatDateStringUTC(dueDate);

    const pdfInvoiceData: InvoiceData = {
      invoiceId: invoiceData.invoiceId,
      dateIssued: invoiceData.dateIssued,
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

    const MyDocument = () =>
      createElement(InvoicePdfDocument, { invoiceData: pdfInvoiceData });
    const pdfBuffer = await renderToBuffer(createElement(MyDocument));
    const pdfBase64 = pdfBuffer.toString("base64");

    let hasOnlinePaymentBlock: any = false;

    if (
      invoice.stripePaymentSettings?.enabled &&
      invoice.stripePaymentSettings?.paymentLinkToken
    ) {
      const expiresAt = invoice.stripePaymentSettings.paymentLinkExpiresAt;
      const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;

      if (!isExpired) {
        const paymentLinkUrl = `${getBaseUrl()}/pay?token=${invoice.stripePaymentSettings.paymentLinkToken}`;

        hasOnlinePaymentBlock = {
          payment_link_url: paymentLinkUrl,
        };
      }
    }

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

    const emailResult = await postmarkClient.sendEmailWithTemplate({
      From: "adam@vancouverventcleaning.ca",
      To: clientEmail,
      TemplateAlias: "invoice-delivery-1",
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

    return NextResponse.json({
      message: "Invoice sent successfully",
      emailMessageId: emailResult.MessageID,
      sentTo: clientEmail,
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      {
        message: "Failed to send invoice",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

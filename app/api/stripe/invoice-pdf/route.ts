import { NextRequest, NextResponse } from "next/server";
import connectMongo from "../../../lib/connect";
import { Invoice } from "../../../../models/reactDataSchema";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument from "../../../../_components/pdf/InvoicePdfDocument";
import type { InvoiceData } from "../../../../_components/pdf/InvoicePdfDocument";
import { createElement } from "react";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Payment token is required" },
      { status: 400 },
    );
  }

  try {
    await connectMongo();

    // Find invoice by payment link token and validate it
    const invoice = await Invoice.findOne({
      "stripePaymentSettings.paymentLinkToken": token,
    }).populate("clientId");

    if (!invoice) {
      return NextResponse.json(
        { error: "Invalid payment link" },
        { status: 404 },
      );
    }

    // Check if link has expired
    const expiresAt = invoice.stripePaymentSettings?.paymentLinkExpiresAt;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      return NextResponse.json(
        { error: "Payment link has expired" },
        { status: 410 },
      );
    }

    // Check if Stripe payments are enabled
    if (!invoice.stripePaymentSettings?.enabled) {
      return NextResponse.json(
        { error: "Online payments are not enabled for this invoice" },
        { status: 400 },
      );
    }

    // Get client info
    const client = invoice.clientId as any;

    // Format date for display - extract UTC date parts to avoid timezone shifts
    const formatDateUTC = (date: Date | string): string => {
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const day = d.getUTCDate();

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return `${monthNames[month]} ${day}, ${year}`;
    };

    // Calculate totals
    const subtotal = invoice.items.reduce(
      (acc: number, item: { price: number }) => acc + item.price,
      0,
    );
    const gst = subtotal * 0.05;
    const totalAmount = subtotal + gst;

    // Prepare invoice data for PDF
    const invoiceData: InvoiceData = {
      invoiceId: invoice.invoiceId,
      dateIssued: formatDateUTC(invoice.dateIssued),
      dateDue: formatDateUTC(invoice.dateDue),
      jobTitle: invoice.jobTitle,
      location: invoice.location,
      clientName: client?.clientName || "Customer",
      email:
        client?.emails?.accounting ||
        client?.emails?.primary ||
        client?.email ||
        "",
      phoneNumber: client?.phoneNumber || "",
      items: invoice.items.map(
        (item: { description: string; details?: string; price: number }) => ({
          description: item.description,
          details: item.details,
          price: item.price,
          total: item.price,
        }),
      ),
      subtotal,
      gst,
      totalAmount,
      cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
      eTransfer: "payables@vancouverventcleaning.ca",
      terms: "Must be raised in writing within 7 days.",
    };

    // Generate PDF using renderToBuffer (same approach as send-invoice)
    const MyDocument = () => createElement(InvoicePdfDocument, { invoiceData });
    const pdfBuffer = await renderToBuffer(createElement(MyDocument));

    // Return PDF response - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice-${invoice.invoiceId}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 },
    );
  }
}

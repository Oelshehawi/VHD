import { NextRequest, NextResponse } from "next/server";
import connectMongo from "../../../lib/connect";
import { Invoice, Client } from "../../../../models/reactDataSchema";
import {
  calculateCardTotalWithFee,
  calculateACHTotalWithFee,
  formatCentsToDollars,
} from "../../../lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Payment token is required" },
        { status: 400 },
      );
    }

    await connectMongo();

    // Find invoice by payment link token
    const invoice = await Invoice.findOne({
      "stripePaymentSettings.paymentLinkToken": token,
    });

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

    // Check if invoice is already paid - return special status instead of error
    if (invoice.status === "paid") {
      return NextResponse.json({
        alreadyPaid: true,
        invoiceId: invoice.invoiceId,
        jobTitle: invoice.jobTitle,
        receiptUrl: invoice.paymentInfo?.stripeReceiptUrl || null,
        datePaid: invoice.paymentInfo?.datePaid || null,
      });
    }

    // Check if payment is processing
    if (
      invoice.stripePaymentStatus?.status &&
      ["initiated", "processing", "pending"].includes(
        invoice.stripePaymentStatus.status,
      )
    ) {
      return NextResponse.json({
        processing: true,
        invoiceId: invoice.invoiceId,
        jobTitle: invoice.jobTitle,
        paymentMethod: invoice.stripePaymentStatus.paymentMethod,
        status: invoice.stripePaymentStatus.status,
      });
    }

    // Check if Stripe payments are enabled
    if (!invoice.stripePaymentSettings?.enabled) {
      return NextResponse.json(
        { error: "Online payments are not enabled for this invoice" },
        { status: 400 },
      );
    }

    // Get client info
    const client = await Client.findById(invoice.clientId);

    // Calculate subtotal and GST (5%)
    const subtotal = invoice.items.reduce(
      (acc: number, item: { price: number }) => acc + item.price,
      0,
    );
    const gst = subtotal * 0.05;
    const invoiceTotalDollars = subtotal + gst;
    const invoiceTotalCents = Math.round(invoiceTotalDollars * 100);

    // Calculate fees for each payment method
    const cardCalculation = calculateCardTotalWithFee(invoiceTotalCents);
    const achCalculation = calculateACHTotalWithFee(invoiceTotalCents);

    return NextResponse.json({
      invoice: {
        _id: invoice._id.toString(),
        invoiceId: invoice.invoiceId,
        jobTitle: invoice.jobTitle,
        dateIssued:
          invoice.dateIssued instanceof Date
            ? invoice.dateIssued.toISOString()
            : String(invoice.dateIssued),
        dateDue:
          invoice.dateDue instanceof Date
            ? invoice.dateDue.toISOString()
            : String(invoice.dateDue),
        items: invoice.items,
        status: invoice.status,
        location: invoice.location,
        subtotal,
        gst,
        invoiceTotal: invoiceTotalDollars,
      },
      client: client ? { clientName: client.clientName } : null,
      paymentSettings: {
        allowCreditCard: invoice.stripePaymentSettings.allowCreditCard,
        allowBankPayment: invoice.stripePaymentSettings.allowBankPayment,
      },
      pricing: {
        card: {
          invoiceAmount: formatCentsToDollars(invoiceTotalCents),
          processingFee: formatCentsToDollars(cardCalculation.processingFee),
          totalAmount: formatCentsToDollars(cardCalculation.totalAmount),
          totalAmountCents: cardCalculation.totalAmount,
        },
        ach: {
          invoiceAmount: formatCentsToDollars(invoiceTotalCents),
          processingFee: formatCentsToDollars(achCalculation.processingFee),
          totalAmount: formatCentsToDollars(achCalculation.totalAmount),
          totalAmountCents: achCalculation.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment page data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch payment page data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

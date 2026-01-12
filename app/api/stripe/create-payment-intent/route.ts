import { NextRequest, NextResponse } from "next/server";
import connectMongo from "../../../lib/connect";
import { Invoice, Client } from "../../../../models/reactDataSchema";
import {
  stripe,
  calculateCardTotalWithFee,
  calculateACHTotalWithFee,
} from "../../../lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, paymentMethod } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Payment token is required" },
        { status: 400 },
      );
    }

    if (!paymentMethod || !["card", "bank"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
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

    // Validate payment can proceed
    const expiresAt = invoice.stripePaymentSettings?.paymentLinkExpiresAt;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      return NextResponse.json(
        { error: "Payment link has expired" },
        { status: 410 },
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 },
      );
    }

    if (!invoice.stripePaymentSettings?.enabled) {
      return NextResponse.json(
        { error: "Online payments not enabled" },
        { status: 400 },
      );
    }

    // Check if the selected payment method is allowed
    if (
      paymentMethod === "card" &&
      !invoice.stripePaymentSettings.allowCreditCard
    ) {
      return NextResponse.json(
        { error: "Credit card payments not allowed" },
        { status: 400 },
      );
    }

    if (
      paymentMethod === "bank" &&
      !invoice.stripePaymentSettings.allowBankPayment
    ) {
      return NextResponse.json(
        { error: "Bank payments not allowed" },
        { status: 400 },
      );
    }

    // Calculate total amount
    const subtotal = invoice.items.reduce(
      (acc: number, item: { price: number }) => acc + item.price,
      0,
    );
    const gst = subtotal * 0.05;
    const invoiceTotalCents = Math.round((subtotal + gst) * 100);

    // Calculate amount with fee based on payment method
    const calculation =
      paymentMethod === "card"
        ? calculateCardTotalWithFee(invoiceTotalCents)
        : calculateACHTotalWithFee(invoiceTotalCents);

    // Create PaymentIntent with appropriate payment method types
    // For bank payments, use acss_debit (Canadian PAD) instead of us_bank_account (US ACH)
    const paymentMethodTypes =
      paymentMethod === "card" ? ["card"] : ["acss_debit"];

    // Get client email for receipt
    const client = await Client.findById(invoice.clientId);
    const clientEmail = client?.emails?.accounting || client?.email;

    const paymentIntentParams: any = {
      amount: calculation.totalAmount,
      currency: "cad",
      payment_method_types: paymentMethodTypes,
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceId,
        paymentMethod,
        originalAmount: invoiceTotalCents.toString(),
        processingFee: calculation.processingFee.toString(),
      },
      description: `Invoice ${invoice.invoiceId} - ${invoice.jobTitle}`,
      // Send receipt email to client
      receipt_email: clientEmail || undefined,
    };

    // Add PAD-specific options for bank payments
    if (paymentMethod === "bank") {
      paymentIntentParams.payment_method_options = {
        acss_debit: {
          mandate_options: {
            payment_schedule: "sporadic",
            transaction_type: "business",
          },
          // Require instant verification - disables micro-deposits
          // Customers whose banks don't support instant verification won't be able to pay via PAD
          verification_method: "instant",
        },
      };
    }

    const paymentIntent =
      await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: calculation.totalAmount,
      processingFee: calculation.processingFee,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

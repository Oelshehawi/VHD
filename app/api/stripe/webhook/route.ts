import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "../../../lib/stripe";
import {
  processStripePaymentSuccess,
  logStripePaymentFailure,
  updateStripePaymentStatus,
  logStripeChargeEvent,
} from "../../../lib/actions/stripe.actions";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      {
        error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      { status: 400 },
    );
  }

  const updatePaymentStatusSafely = async (
    invoiceId: string,
    status: "initiated" | "processing" | "pending" | "succeeded" | "failed",
    paymentMethod: "card" | "bank",
    eventType: string,
    eventDetails?: string,
  ) => {
    try {
      await updateStripePaymentStatus(
        invoiceId,
        status,
        paymentMethod,
        eventType,
        eventDetails,
      );
    } catch (error) {
      console.error(
        `Failed to update payment status for invoice ${invoiceId}:`,
        error,
      );
      throw error;
    }
  };

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;

        if (!invoiceId) {
          console.error("No invoiceId in payment intent metadata");
          return NextResponse.json(
            { error: "Missing invoiceId in metadata" },
            { status: 400 },
          );
        }

        // Get charge details for receipt URL
        let receiptUrl = "";
        let chargeId = "";

        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(
            paymentIntent.latest_charge as string,
          );
          receiptUrl = charge.receipt_url || "";
          chargeId = charge.id;
        }

        // Determine payment method type
        // acss_debit = Canadian PAD (Pre-authorized Debit)
        const paymentMethodType =
          paymentIntent.metadata.paymentMethod === "bank"
            ? "acss_debit"
            : "card";

        // Process the successful payment
        const result = await processStripePaymentSuccess(
          paymentIntent.id,
          chargeId,
          paymentMethodType as "card" | "acss_debit",
          receiptUrl,
          invoiceId,
        );

        if (!result.success) {
          console.error("Failed to process payment success:", result.error);
          throw new Error(
            result.error || "Failed to process payment intent success",
          );
        }

        console.log(`Payment succeeded for invoice ${invoiceId}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;
        const errorMessage =
          paymentIntent.last_payment_error?.message || "Payment failed";

        if (invoiceId) {
          await logStripePaymentFailure(
            invoiceId,
            paymentIntent.id,
            errorMessage,
          );
          console.log(
            `Payment failed for invoice ${invoiceId}: ${errorMessage}`,
          );
        }
        break;
      }

      case "charge.succeeded": {
        // Log successful charge (for ACH/PAD payments which may succeed later)
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string | null;

        if (paymentIntentId) {
          const paymentIntent =
            await stripe.paymentIntents.retrieve(paymentIntentId);
          const invoiceId = paymentIntent.metadata.invoiceId;

          if (invoiceId) {
            await logStripeChargeEvent(invoiceId, "charge.succeeded", {
              chargeId: charge.id,
              paymentIntentId,
              amount: charge.amount,
              currency: charge.currency,
            });
          }
        }
        console.log(`Charge succeeded: ${charge.id}`);
        break;
      }

      case "charge.refunded": {
        // Handle refunds if needed in the future
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string | null;

        if (paymentIntentId) {
          const paymentIntent =
            await stripe.paymentIntents.retrieve(paymentIntentId);
          const invoiceId = paymentIntent.metadata.invoiceId;

          if (invoiceId) {
            await logStripeChargeEvent(invoiceId, "charge.refunded", {
              chargeId: charge.id,
              paymentIntentId,
              amount: charge.amount,
              currency: charge.currency,
            });
          }
        }
        console.log(`Charge refunded: ${charge.id}`);
        break;
      }

      // PAD-related events - track payment status progression
      case "payment_intent.created": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;
        const paymentMethod =
          paymentIntent.metadata.paymentMethod === "bank" ? "bank" : "card";

        if (invoiceId) {
          await updatePaymentStatusSafely(
            invoiceId,
            "initiated",
            paymentMethod,
            "payment_intent.created",
            "Payment process started",
          );
        }
        break;
      }

      case "payment_intent.processing": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;
        const paymentMethod =
          paymentIntent.metadata.paymentMethod === "bank" ? "bank" : "card";

        if (invoiceId) {
          await updatePaymentStatusSafely(
            invoiceId,
            "processing",
            paymentMethod,
            "payment_intent.processing",
            "Payment is being processed",
          );
        }
        break;
      }

      case "charge.pending": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Get the payment intent to find the invoice ID
          const paymentIntent =
            await stripe.paymentIntents.retrieve(paymentIntentId);
          const invoiceId = paymentIntent.metadata.invoiceId;
          const paymentMethod =
            paymentIntent.metadata.paymentMethod === "bank" ? "bank" : "card";

          if (invoiceId) {
            await updatePaymentStatusSafely(
              invoiceId,
              "pending",
              paymentMethod,
              "charge.pending",
              "Bank debit pending confirmation",
            );
          }
        }
        break;
      }

      case "charge.updated":
      case "mandate.updated":
        // These are informational events - no status update needed
        break;

      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

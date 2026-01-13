"use server";

import crypto from "crypto";
import connectMongo from "../connect";
import { Invoice, Client, AuditLog } from "../../../models/reactDataSchema";
import { revalidatePath } from "next/cache";
import { StripePaymentSettings, StripePaymentStatus } from "../typeDefinitions";
import { getBaseUrl } from "../utils";

const PAYMENT_LINK_EXPIRY_DAYS = 30;

/**
 * Configure Stripe payment settings for an invoice
 */
export async function configureStripePaymentSettings(
  invoiceId: string,
  settings: {
    enabled: boolean;
    allowCreditCard: boolean;
    allowBankPayment: boolean;
  },
  performedBy: string,
) {
  await connectMongo();

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Get old settings for audit log
    const oldSettings = invoice.stripePaymentSettings || {
      enabled: false,
      allowCreditCard: true,
      allowBankPayment: false,
    };

    // Update settings
    invoice.stripePaymentSettings = {
      ...invoice.stripePaymentSettings,
      enabled: settings.enabled,
      allowCreditCard: settings.allowCreditCard,
      allowBankPayment: settings.allowBankPayment,
    };

    await invoice.save();

    // Create audit log
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "stripe_payment_settings_configured",
      timestamp: new Date(),
      performedBy,
      details: {
        oldValue: oldSettings,
        newValue: settings,
      },
      success: true,
    });

    revalidatePath(`/invoices/${invoiceId}`);

    // Return plain object to avoid serialization issues
    return {
      success: true,
      settings: {
        enabled: settings.enabled,
        allowCreditCard: settings.allowCreditCard,
        allowBankPayment: settings.allowBankPayment,
      },
    };
  } catch (error) {
    console.error("Error configuring Stripe payment settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate a unique payment link token for an invoice
 */
export async function generatePaymentLink(
  invoiceId: string,
  performedBy: string,
): Promise<{
  success: boolean;
  paymentLink?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}> {
  await connectMongo();

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (invoice.status === "paid") {
      return { success: false, error: "Invoice is already paid" };
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiration date (30 days from now)
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + PAYMENT_LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    // Update invoice with payment link token
    invoice.stripePaymentSettings = {
      ...invoice.stripePaymentSettings,
      enabled: invoice.stripePaymentSettings?.enabled ?? true,
      allowCreditCard: invoice.stripePaymentSettings?.allowCreditCard ?? true,
      allowBankPayment:
        invoice.stripePaymentSettings?.allowBankPayment ?? false,
      paymentLinkToken: token,
      paymentLinkCreatedAt: now,
      paymentLinkExpiresAt: expiresAt,
    };

    await invoice.save();

    // Create audit log
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "stripe_payment_link_generated",
      timestamp: new Date(),
      performedBy,
      details: {
        newValue: {
          tokenGenerated: true,
          expiresAt: expiresAt.toISOString(),
        },
      },
      success: true,
    });

    // Generate the payment link URL
    const paymentLink = `${getBaseUrl()}/pay?token=${token}`;

    revalidatePath(`/invoices/${invoiceId}`);

    return {
      success: true,
      paymentLink,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("Error generating payment link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate a payment link token and return invoice data
 */
export async function validatePaymentLink(token: string): Promise<{
  success: boolean;
  invoice?: {
    _id: string;
    invoiceId: string;
    jobTitle: string;
    dateIssued: string;
    dateDue: string;
    items: { description: string; details?: string; price: number }[];
    status: string;
    location: string;
    stripePaymentSettings: StripePaymentSettings;
  };
  client?: {
    clientName: string;
  };
  error?: string;
}> {
  await connectMongo();

  try {
    // Find invoice by payment link token
    const invoice = await Invoice.findOne({
      "stripePaymentSettings.paymentLinkToken": token,
    });

    if (!invoice) {
      return { success: false, error: "Invalid payment link" };
    }

    // Check if link has expired
    const expiresAt = invoice.stripePaymentSettings?.paymentLinkExpiresAt;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      return { success: false, error: "Payment link has expired" };
    }

    // Check if invoice is already paid
    if (invoice.status === "paid") {
      return { success: false, error: "This invoice has already been paid" };
    }

    // Check if Stripe payments are enabled
    if (!invoice.stripePaymentSettings?.enabled) {
      return {
        success: false,
        error: "Online payments are not enabled for this invoice",
      };
    }

    // Get client info
    const client = await Client.findById(invoice.clientId);

    return {
      success: true,
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
        stripePaymentSettings: {
          enabled: invoice.stripePaymentSettings.enabled,
          allowCreditCard: invoice.stripePaymentSettings.allowCreditCard,
          allowBankPayment: invoice.stripePaymentSettings.allowBankPayment,
        },
      },
      client: client ? { clientName: client.clientName } : undefined,
    };
  } catch (error) {
    console.error("Error validating payment link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get payment link status for an invoice
 */
export async function getPaymentLinkStatus(invoiceId: string): Promise<{
  success: boolean;
  hasPaymentLink: boolean;
  paymentLink?: string;
  expiresAt?: string;
  isExpired?: boolean;
  settings?: StripePaymentSettings;
  error?: string;
}> {
  await connectMongo();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = (await Invoice.findById(invoiceId).lean()) as any;
    if (!invoice) {
      return {
        success: false,
        hasPaymentLink: false,
        error: "Invoice not found",
      };
    }

    const mongoSettings = invoice.stripePaymentSettings;
    const token = mongoSettings?.paymentLinkToken;
    const expiresAt = mongoSettings?.paymentLinkExpiresAt;

    // Convert to plain object for client component serialization
    // Note: Dates are converted to undefined since they can't be serialized
    const settings: StripePaymentSettings | undefined = mongoSettings
      ? {
          enabled: mongoSettings.enabled ?? false,
          allowCreditCard: mongoSettings.allowCreditCard ?? true,
          allowBankPayment: mongoSettings.allowBankPayment ?? false,
          paymentLinkToken: mongoSettings.paymentLinkToken,
        }
      : undefined;

    if (!token) {
      return {
        success: true,
        hasPaymentLink: false,
        settings,
      };
    }

    const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
    const paymentLink = `${getBaseUrl()}/pay?token=${token}`;

    return {
      success: true,
      hasPaymentLink: true,
      paymentLink,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isExpired,
      settings,
    };
  } catch (error) {
    console.error("Error getting payment link status:", error);
    return {
      success: false,
      hasPaymentLink: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Revoke an existing payment link
 */
export async function revokePaymentLink(
  invoiceId: string,
  performedBy: string,
): Promise<{ success: boolean; error?: string }> {
  await connectMongo();

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Clear payment link token
    if (invoice.stripePaymentSettings) {
      invoice.stripePaymentSettings.paymentLinkToken = undefined;
      invoice.stripePaymentSettings.paymentLinkCreatedAt = undefined;
      invoice.stripePaymentSettings.paymentLinkExpiresAt = undefined;
    }

    await invoice.save();

    // Create audit log
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "stripe_payment_link_generated",
      timestamp: new Date(),
      performedBy,
      details: {
        reason: "Payment link revoked",
      },
      success: true,
    });

    revalidatePath(`/invoices/${invoiceId}`);

    return { success: true };
  } catch (error) {
    console.error("Error revoking payment link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process a successful Stripe payment (called by webhook)
 */
export async function processStripePaymentSuccess(
  paymentIntentId: string,
  chargeId: string,
  paymentMethodType: "card" | "acss_debit",
  receiptUrl: string,
  invoiceId: string,
): Promise<{ success: boolean; error?: string }> {
  await connectMongo();

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Update invoice status and payment info
    // stripe-pad = Canadian Pre-authorized Debit
    invoice.status = "paid";
    invoice.paymentInfo = {
      method: paymentMethodType === "card" ? "stripe-card" : "stripe-pad",
      datePaid: new Date(),
      notes: `Stripe Payment - Intent: ${paymentIntentId}`,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      stripeReceiptUrl: receiptUrl,
    };

    // Update payment status to succeeded
    invoice.stripePaymentStatus = {
      ...invoice.stripePaymentStatus,
      status: "succeeded",
      lastUpdated: new Date(),
      paymentMethod: paymentMethodType === "card" ? "card" : "bank",
      events: [
        ...(invoice.stripePaymentStatus?.events || []),
        {
          eventType: "payment_intent.succeeded",
          timestamp: new Date(),
          details: "Payment completed successfully",
        },
      ],
    };

    await invoice.save();

    // Create audit log
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "stripe_payment_succeeded",
      timestamp: new Date(),
      performedBy: "stripe_webhook",
      details: {
        newValue: {
          paymentIntentId,
          chargeId,
          paymentMethodType,
          receiptUrl,
        },
      },
      success: true,
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error processing Stripe payment success:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log a failed Stripe payment attempt
 */
export async function logStripePaymentFailure(
  invoiceId: string,
  paymentIntentId: string,
  errorMessage: string,
): Promise<{ success: boolean }> {
  await connectMongo();

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false };
    }

    // Update payment status to failed
    invoice.stripePaymentStatus = {
      ...invoice.stripePaymentStatus,
      status: "failed",
      lastUpdated: new Date(),
      events: [
        ...(invoice.stripePaymentStatus?.events || []),
        {
          eventType: "payment_failed",
          timestamp: new Date(),
          details: errorMessage,
        },
      ],
    };

    await invoice.save();

    // Create audit log for failed payment
    await AuditLog.create({
      invoiceId: invoice.invoiceId,
      action: "stripe_payment_failed",
      timestamp: new Date(),
      performedBy: "stripe_webhook",
      details: {
        metadata: {
          paymentIntentId,
          errorMessage,
        },
      },
      success: false,
      errorMessage,
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging Stripe payment failure:", error);
    return { success: false };
  }
}

/**
 * Update Stripe payment status for an invoice (called by webhook)
 * Tracks the payment lifecycle: initiated -> processing -> pending -> succeeded/failed
 */
export async function updateStripePaymentStatus(
  invoiceId: string,
  status: "initiated" | "processing" | "pending" | "succeeded" | "failed",
  paymentMethod: "card" | "bank",
  eventType: string,
  eventDetails?: string,
): Promise<{ success: boolean; error?: string }> {
  await connectMongo();

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Build the new event
    const newEvent = {
      eventType,
      timestamp: new Date(),
      details: eventDetails,
    };

    // Update payment status
    invoice.stripePaymentStatus = {
      status,
      lastUpdated: new Date(),
      paymentMethod,
      events: [...(invoice.stripePaymentStatus?.events || []), newEvent],
    };

    await invoice.save();

    // Revalidate the invoice page to show updated status
    revalidatePath(`/invoices/${invoiceId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating Stripe payment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Stripe payment status for an invoice
 */
export async function getStripePaymentStatus(invoiceId: string): Promise<{
  success: boolean;
  status?: StripePaymentStatus;
  error?: string;
}> {
  await connectMongo();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = (await Invoice.findById(invoiceId).lean()) as any;
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (!invoice.stripePaymentStatus) {
      return { success: true, status: undefined };
    }

    // Convert to serializable format
    const status: StripePaymentStatus = {
      status: invoice.stripePaymentStatus.status,
      lastUpdated: invoice.stripePaymentStatus.lastUpdated
        ? new Date(invoice.stripePaymentStatus.lastUpdated)
        : undefined,
      paymentMethod: invoice.stripePaymentStatus.paymentMethod,
      events: invoice.stripePaymentStatus.events?.map(
        (e: { eventType: string; timestamp: Date; details?: string }) => ({
          eventType: e.eventType,
          timestamp: new Date(e.timestamp),
          details: e.details,
        }),
      ),
    };

    return { success: true, status };
  } catch (error) {
    console.error("Error getting Stripe payment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Fee calculation utilities
const STRIPE_CARD_PERCENTAGE = 0.029; // 2.9%
const STRIPE_CARD_FIXED = 30; // $0.30 in cents
const STRIPE_ACH_PERCENTAGE = 0.008; // 0.8%
const STRIPE_ACH_MAX_FEE = 500; // $5.00 in cents

/**
 * Calculate the total amount including processing fee for card payments
 * Formula: (amount + fixed_fee) / (1 - percentage)
 * This ensures the business receives the exact invoice amount after Stripe takes fees
 */
export function calculateCardTotalWithFee(amountInCents: number): {
  totalAmount: number;
  processingFee: number;
} {
  const totalAmount = Math.ceil(
    (amountInCents + STRIPE_CARD_FIXED) / (1 - STRIPE_CARD_PERCENTAGE)
  );
  const processingFee = totalAmount - amountInCents;
  return { totalAmount, processingFee };
}

/**
 * Calculate the total amount including processing fee for ACH payments
 * Fee is 0.8% capped at $5.00
 */
export function calculateACHTotalWithFee(amountInCents: number): {
  totalAmount: number;
  processingFee: number;
} {
  const calculatedFee = Math.ceil(amountInCents * STRIPE_ACH_PERCENTAGE);
  const processingFee = Math.min(calculatedFee, STRIPE_ACH_MAX_FEE);
  const totalAmount = amountInCents + processingFee;
  return { totalAmount, processingFee };
}

/**
 * Format cents to dollars string
 */
export function formatCentsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

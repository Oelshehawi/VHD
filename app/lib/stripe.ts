import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Fee calculation utilities
const STRIPE_CARD_PERCENTAGE = 0.029; // 2.9%
const STRIPE_CARD_FIXED = 30; // $0.30 in cents
const STRIPE_PAD_PERCENTAGE = 0.01; // 1.0%
const STRIPE_PAD_FIXED = 40; // $0.40 in cents
const STRIPE_PAD_MAX_FEE = 500; // $5.00 in cents

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
    (amountInCents + STRIPE_CARD_FIXED) / (1 - STRIPE_CARD_PERCENTAGE),
  );
  const processingFee = totalAmount - amountInCents;
  return { totalAmount, processingFee };
}

/**
 * Calculate the total amount including processing fee for PAD (ACSS debit) payments
 * Fee is 1.0% + $0.40 capped at $5.00
 */
export function calculateACHTotalWithFee(amountInCents: number): {
  totalAmount: number;
  processingFee: number;
} {
  const percentageFee = Math.ceil(amountInCents * STRIPE_PAD_PERCENTAGE);
  const calculatedFee = percentageFee + STRIPE_PAD_FIXED;
  const processingFee = Math.min(calculatedFee, STRIPE_PAD_MAX_FEE);
  const totalAmount = amountInCents + processingFee;
  return { totalAmount, processingFee };
}

/**
 * Format cents to dollars string
 */
export function formatCentsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

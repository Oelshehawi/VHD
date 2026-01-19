"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { FaLock } from "react-icons/fa";
import { Loader2 } from "lucide-react";

interface StripePaymentFormProps {
  invoiceTotal: string;
  processingFee: string;
  totalAmount: string;
  paymentMethod: "card" | "bank";
  onSuccess: (receiptUrl?: string) => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({
  invoiceTotal,
  processingFee,
  totalAmount,
  paymentMethod,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pay/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred");
        onError(error.message || "Payment failed");
      } else if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          onSuccess();
        } else if (paymentIntent.status === "processing") {
          // ACH payments may be in processing state
          onSuccess();
        } else if (paymentIntent.status === "requires_action") {
          if (!paymentIntent.client_secret) {
            const message = "Payment authentication failed";
            setErrorMessage(message);
            onError(message);
            return;
          }

          const { error: actionError, paymentIntent: nextIntent } =
            await stripe.handleNextAction({
              clientSecret: paymentIntent.client_secret,
            });

          if (actionError) {
            const message = actionError.message || "Authentication failed";
            setErrorMessage(message);
            onError(message);
            return;
          }

          const finalIntent = nextIntent || paymentIntent;

          if (
            finalIntent.status === "succeeded" ||
            finalIntent.status === "processing"
          ) {
            onSuccess();
          } else {
            const message = `Payment status: ${finalIntent.status}`;
            setErrorMessage(message);
            onError(message);
          }
        } else {
          const message = `Payment status: ${paymentIntent.status}`;
          setErrorMessage(message);
          onError(message);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Price Breakdown */}
      <div className="bg-muted/50 space-y-2 rounded-lg p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Invoice Amount</span>
          <span className="font-medium">${invoiceTotal} CAD</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Processing Fee ({paymentMethod === "card" ? "2.9% + $0.30" : "0.8%"}
            )
          </span>
          <span className="font-medium">${processingFee} CAD</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-darkGreen text-lg font-bold">
            ${totalAmount} CAD
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-lg">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="bg-darkGreen hover:bg-darkGreen/90 w-full py-6 text-base"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <FaLock className="mr-2 h-4 w-4" />
            Pay ${totalAmount} CAD
          </>
        )}
      </Button>

      {/* Security Note */}
      <p className="text-muted-foreground text-center text-xs">
        Payments are securely processed by Stripe.
        {paymentMethod === "bank" && (
          <span className="mt-1 block">
            Bank payments may take 5-7 business days to process.
          </span>
        )}
      </p>
    </form>
  );
}

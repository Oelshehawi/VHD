"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
} from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Separator } from "../ui/separator";
import { getStripe } from "../../app/lib/stripeClient";
import StripePaymentForm from "./StripePaymentForm";
import {
  formatDateStringUTC,
  calculatePaymentDueDate,
} from "../../app/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Image from "next/image";
import {
  FaCreditCard,
  FaUniversity,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaFileDownload,
  FaLock,
  FaReceipt,
} from "react-icons/fa";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface PaymentPageData {
  invoice: {
    _id: string;
    invoiceId: string;
    jobTitle: string;
    dateIssued: string;
    dateDue: string;
    items: { description: string; details?: string; price: number }[];
    status: string;
    location: string;
    subtotal: number;
    gst: number;
    invoiceTotal: number;
  };
  client: { clientName: string } | null;
  paymentSettings: {
    allowCreditCard: boolean;
    allowBankPayment: boolean;
  };
  pricing: {
    card: {
      invoiceAmount: string;
      processingFee: string;
      totalAmount: string;
      totalAmountCents: number;
    };
    ach: {
      invoiceAmount: string;
      processingFee: string;
      totalAmount: string;
      totalAmountCents: number;
    };
  };
}

interface PaymentPageClientProps {
  token: string;
}

// Response when invoice is already paid
interface AlreadyPaidData {
  alreadyPaid: true;
  invoiceId: string;
  jobTitle: string;
  receiptUrl: string | null;
  datePaid: string | null;
}

// Response when payment is processing
interface ProcessingData {
  processing: true;
  invoiceId: string;
  jobTitle: string;
  paymentMethod?: "card" | "bank";
  status?: "initiated" | "processing" | "pending";
}

function isAlreadyPaidResponse(data: any): data is AlreadyPaidData {
  return data && data.alreadyPaid === true;
}

function isProcessingResponse(data: any): data is ProcessingData {
  return data && data.processing === true;
}

async function fetchPaymentPageData(
  token: string,
): Promise<PaymentPageData | AlreadyPaidData | ProcessingData> {
  const response = await fetch(`/api/stripe/payment-page?token=${token}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to load payment page");
  }

  return result;
}

async function createPaymentIntent(
  token: string,
  paymentMethod: "card" | "bank",
) {
  const response = await fetch("/api/stripe/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, paymentMethod }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create payment");
  }

  return result;
}

export default function PaymentPageClient({ token }: PaymentPageClientProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | null>(
    null,
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  // Fetch invoice data with TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["paymentPage", token],
    queryFn: () => fetchPaymentPageData(token),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Create payment intent mutation
  const { mutate: createIntent, isPending: isCreatingIntent } =
    useMutation({
      mutationFn: (method: "card" | "bank") => createPaymentIntent(token, method),
      onSuccess: (result) => {
        setClientSecret(result.clientSecret);
        setPaymentError(null);
      },
      onError: (err: Error) => {
        setPaymentError(err.message || "Failed to initialize payment");
      },
    });

  // Auto-trigger payment intent when only one payment method is available
  useEffect(() => {
    if (
      data &&
      !isAlreadyPaidResponse(data) &&
      !isProcessingResponse(data) &&
      !paymentMethod &&
      !clientSecret &&
      !isCreatingIntent &&
      !paymentSuccess
    ) {
      const hasMultiple =
        data.paymentSettings.allowCreditCard &&
        data.paymentSettings.allowBankPayment;

      if (!hasMultiple) {
        // Auto-select the single available method (with validation)
        const singleMethod = data.paymentSettings.allowCreditCard
          ? "card"
          : data.paymentSettings.allowBankPayment
            ? "bank"
            : null;

        if (singleMethod) {
          createIntent(singleMethod);
        }
      }
    }
  }, [
    data,
    paymentMethod,
    clientSecret,
    isCreatingIntent,
    paymentSuccess,
    createIntent,
  ]);

  const handleSelectPaymentMethod = (method: "card" | "bank") => {
    setPaymentMethod(method);
    setClientSecret(null);
    setPaymentError(null);
    createIntent(method);
  };

  const handleGoBack = () => {
    setPaymentMethod(null);
    setClientSecret(null);
    setPaymentError(null);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="text-darkGreen mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">Loading payment page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <FaTimesCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Payment Link Error</h1>
            <p className="text-muted-foreground">{error.message}</p>
            <p className="text-muted-foreground mt-4 text-sm">
              Please contact us if you need assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (paymentSuccess) {
    const successPaymentMethod =
      paymentMethod ??
      (data &&
      !isAlreadyPaidResponse(data) &&
      !isProcessingResponse(data)
        ? data.paymentSettings.allowCreditCard
          ? "card"
          : data.paymentSettings.allowBankPayment
            ? "bank"
            : null
        : null);

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">
              Payment {successPaymentMethod === "bank" ? "Initiated" : "Successful"}!
            </h1>
            <p className="text-muted-foreground">
              {successPaymentMethod === "bank"
                ? "Your bank payment is being processed. This may take 5-7 business days."
                : "Thank you for your payment. A receipt has been sent to your email."}
            </p>
            {data &&
              !isAlreadyPaidResponse(data) &&
              !isProcessingResponse(data) && (
                <Badge variant="outline" className="mt-4">
                  Invoice #{data.invoice.invoiceId}
                </Badge>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Already paid state - show friendly success message instead of error
  if (isAlreadyPaidResponse(data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Invoice Already Paid</h1>
            <p className="text-muted-foreground">
              This invoice has already been paid. Thank you!
            </p>
            <Badge variant="outline" className="mt-4">
              Invoice #{data.invoiceId}
            </Badge>
            {data.datePaid && (
              <p className="text-muted-foreground mt-2 text-sm">
                Paid on {formatDateStringUTC(data.datePaid)}
              </p>
            )}
            {data.receiptUrl && (
              <a
                href={data.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <FaReceipt className="h-4 w-4" />
                View Receipt
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing state - show message when payment is being processed
  if (isProcessingResponse(data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Payment Processing</h1>
            <p className="text-muted-foreground">
              {data.paymentMethod === "bank"
                ? "Your bank payment is being processed. This may take 5-7 business days. You will receive a confirmation email once the payment is complete."
                : "Your payment is being processed. You will receive a confirmation email shortly."}
            </p>
            <Badge variant="outline" className="mt-4">
              Invoice #{data.invoiceId}
            </Badge>
            <p className="text-muted-foreground mt-4 text-sm">
              Please check your email for payment confirmation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasMultiplePaymentMethods =
    data.paymentSettings.allowCreditCard &&
    data.paymentSettings.allowBankPayment;

  // Auto-select if only one payment method available
  const effectivePaymentMethod =
    paymentMethod ??
    (data.paymentSettings.allowCreditCard
      ? "card"
      : data.paymentSettings.allowBankPayment
        ? "bank"
        : null);
  const currentPricing =
    effectivePaymentMethod === "bank" ? data.pricing.ach : data.pricing.card;

  // Calculate payment due date using global config (dateIssued + PAYMENT_DUE_DAYS)
  const paymentDueDate = calculatePaymentDueDate(data.invoice.dateIssued);

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Faded logo watermark background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <Image
          src="/images/logo.png"
          alt=""
          width={400}
          height={400}
          className="h-auto w-[400px] opacity-[0.5]"
          priority={false}
        />
      </div>
      {/* Header Bar */}
      <div className="bg-darkGreen relative z-10 py-3">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-center text-lg font-semibold text-white">
            Vancouver Hood Doctors
          </h1>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 lg:py-10">
        {/* Main Grid - Payment on left, Invoice on right for desktop */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Left Column - Payment Section */}
          <div className="space-y-6">
            {/* Payment Summary Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    Invoice #{data.invoice.invoiceId}
                  </Badge>
                  <Badge
                    variant={
                      paymentDueDate < new Date() ? "destructive" : "secondary"
                    }
                  >
                    Due {formatDateStringUTC(paymentDueDate)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data.client && (
                  <p className="text-muted-foreground mb-1 text-sm">
                    {data.client.clientName}
                  </p>
                )}
                <p className="mb-4 font-medium">{data.invoice.jobTitle}</p>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${data.invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span>${data.invoice.gst.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Due</span>
                    <span className="text-darkGreen">
                      ${data.invoice.invoiceTotal.toFixed(2)} CAD
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection / Payment Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FaLock className="h-4 w-4 text-green-600" />
                  Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Show payment method selection if multiple methods and none selected */}
                {hasMultiplePaymentMethods && !paymentMethod ? (
                  <div className="space-y-3">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Choose your preferred payment method:
                    </p>

                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start p-4"
                      onClick={() => handleSelectPaymentMethod("card")}
                    >
                      <FaCreditCard className="mr-3 h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium">Credit or Debit Card</p>
                        <p className="text-muted-foreground text-xs">
                          Processing fee: ${data.pricing.card.processingFee}{" "}
                          (2.9% + $0.30)
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start p-4"
                      onClick={() => handleSelectPaymentMethod("bank")}
                    >
                      <FaUniversity className="mr-3 h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium">Bank Payment (EFT)</p>
                        <p className="text-muted-foreground text-xs">
                          Processing fee: ${data.pricing.ach.processingFee}{" "}
                          (0.8%, max $5) • 5-7 days
                        </p>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Back button if multiple methods available */}
                    {hasMultiplePaymentMethods && paymentMethod && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4"
                        onClick={handleGoBack}
                      >
                        <FaArrowLeft className="mr-2 h-3 w-3" />
                        Change payment method
                      </Button>
                    )}

                    {/* Payment Error */}
                    {paymentError && (
                      <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
                        {paymentError}
                      </div>
                    )}

                    {/* Loading state for creating payment intent */}
                    {isCreatingIntent &&
                      (hasMultiplePaymentMethods || !!clientSecret) && (
                      <div className="py-8 text-center">
                        <Loader2 className="text-darkGreen mx-auto mb-3 h-8 w-8 animate-spin" />
                        <p className="text-muted-foreground text-sm">
                          Preparing secure payment...
                        </p>
                      </div>
                    )}

                    {/* Stripe Payment Form */}
                    {clientSecret && effectivePaymentMethod && (
                      <Elements
                        stripe={getStripe()}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: "stripe",
                            variables: {
                              colorPrimary: "#1a472a",
                              borderRadius: "8px",
                            },
                          },
                        }}
                      >
                        <StripePaymentForm
                          invoiceTotal={currentPricing.invoiceAmount}
                          processingFee={currentPricing.processingFee}
                          totalAmount={currentPricing.totalAmount}
                          paymentMethod={effectivePaymentMethod}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    )}

                    {/* Loading indicator when auto-creating payment intent */}
                    {!hasMultiplePaymentMethods &&
                      !clientSecret &&
                      isCreatingIntent && (
                        <div className="py-4 text-center">
                          <Loader2 className="text-darkGreen mx-auto mb-3 h-8 w-8 animate-spin" />
                          <p className="text-muted-foreground text-sm">
                            Preparing secure payment...
                          </p>
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Invoice Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Invoice Details</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/stripe/invoice-pdf?token=${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaFileDownload className="mr-2 h-3 w-3" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      Service
                    </p>
                    <p className="font-medium">{data.invoice.jobTitle}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      Location
                    </p>
                    <p className="font-medium">{data.invoice.location}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">
                        Date Issued
                      </p>
                      <p className="font-medium">
                        {formatDateStringUTC(data.invoice.dateIssued)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">
                        Due Date
                      </p>
                      <p className="font-medium">
                        {formatDateStringUTC(paymentDueDate)}
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Line Items on Mobile */}
                  <div className="lg:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => setShowInvoiceDetails(!showInvoiceDetails)}
                    >
                      <span>View Line Items</span>
                      {showInvoiceDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Line Items - Always visible on desktop, collapsible on mobile */}
                  <div
                    className={`space-y-2 ${showInvoiceDetails ? "block" : "hidden lg:block"}`}
                  >
                    <Separator />
                    <p className="text-muted-foreground text-xs uppercase">
                      Line Items
                    </p>
                    {data.invoice.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-1 text-sm"
                      >
                        <span>{item.description}</span>
                        <span className="font-medium">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${data.invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (5%)</span>
                      <span>${data.invoice.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Total</span>
                      <span>${data.invoice.invoiceTotal.toFixed(2)} CAD</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center text-sm">
                  Questions about this invoice?
                </p>
                <p className="text-center text-sm font-medium">
                  support@vancouverventcleaning.ca
                </p>
                <p className="text-muted-foreground text-center text-sm">
                  604-273-8717
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

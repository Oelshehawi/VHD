"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Separator } from "../ui/separator";
import { getStripe } from "../../app/lib/stripeClient";
import StripePaymentForm from "./StripePaymentForm";
import {
  formatDateStringUTC,
  calculatePaymentDueDate,
  cn,
} from "../../app/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
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

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number, withCode = false) => {
  const formatted = currencyFormatter.format(value);
  return withCode ? `$${formatted} CAD` : `$${formatted}`;
};

function ShimmerBlock({
  className,
  reduceMotion,
}: {
  className?: string;
  reduceMotion: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-muted/60 relative overflow-hidden rounded-md",
        className,
      )}
      aria-hidden="true"
    >
      {!reduceMotion && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            transform: "translateX(-100%)",
            animation: "shimmer 1.6s infinite",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
          }}
        />
      )}
    </div>
  );
}

function PaymentPageHeader({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.header
      className="bg-darkGreen relative z-10 border-b border-white/10"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        ease: "easeOut",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Image
              src="/images/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-6 w-6"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-balance text-white">
              Vancouver Hood Doctors
            </p>
            <p className="text-xs text-emerald-100/80">Secure Payment Portal</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-emerald-100/90 md:flex">
          <FaLock className="h-3 w-3 text-emerald-200" aria-hidden="true" />
          PCI-compliant checkout
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
        aria-hidden="true"
      />
    </motion.header>
  );
}

function PaymentPageShell({
  children,
  reduceMotion,
  showWatermark = true,
  mainClassName,
}: {
  children: ReactNode;
  reduceMotion: boolean;
  showWatermark?: boolean;
  mainClassName?: string;
}) {
  return (
    <div className="relative min-h-screen bg-gray-50">
      <a
        href="#payment-main"
        className="focus-visible:text-darkGreen sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-white focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:shadow"
      >
        Skip to main content
      </a>
      {showWatermark && (
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
      )}
      <PaymentPageHeader reduceMotion={reduceMotion} />
      <main
        id="payment-main"
        className={cn(
          "relative z-10 mx-auto max-w-6xl px-4 py-6 lg:py-10",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

function PaymentPageSkeleton({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <PaymentPageShell reduceMotion={reduceMotion}>
      <p className="sr-only" role="status" aria-live="polite">
        Loading payment details…
      </p>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10" aria-hidden="true">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <ShimmerBlock
                  className="h-5 w-28 rounded-full"
                  reduceMotion={reduceMotion}
                />
                <ShimmerBlock
                  className="h-5 w-32 rounded-full"
                  reduceMotion={reduceMotion}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ShimmerBlock
                className="mb-2 h-3 w-32"
                reduceMotion={reduceMotion}
              />
              <ShimmerBlock
                className="mb-4 h-5 w-48"
                reduceMotion={reduceMotion}
              />
              <Separator className="my-4" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <ShimmerBlock
                      className="h-3 w-20"
                      reduceMotion={reduceMotion}
                    />
                    <ShimmerBlock
                      className="h-3 w-16"
                      reduceMotion={reduceMotion}
                    />
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <ShimmerBlock
                    className="h-5 w-24"
                    reduceMotion={reduceMotion}
                  />
                  <ShimmerBlock
                    className="h-5 w-24"
                    reduceMotion={reduceMotion}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShimmerBlock
                  className="h-4 w-4 rounded-full"
                  reduceMotion={reduceMotion}
                />
                <ShimmerBlock
                  className="h-4 w-28"
                  reduceMotion={reduceMotion}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ShimmerBlock
                  className="h-12 w-full rounded-lg"
                  reduceMotion={reduceMotion}
                />
                <ShimmerBlock
                  className="h-12 w-full rounded-lg"
                  reduceMotion={reduceMotion}
                />
                <ShimmerBlock
                  className="h-10 w-full rounded-lg"
                  reduceMotion={reduceMotion}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <ShimmerBlock
                  className="h-4 w-32"
                  reduceMotion={reduceMotion}
                />
                <ShimmerBlock
                  className="h-8 w-28 rounded-full"
                  reduceMotion={reduceMotion}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ShimmerBlock className="h-4 w-32" reduceMotion={reduceMotion} />
              <ShimmerBlock className="h-5 w-48" reduceMotion={reduceMotion} />
              <ShimmerBlock className="h-4 w-24" reduceMotion={reduceMotion} />
              <ShimmerBlock className="h-5 w-52" reduceMotion={reduceMotion} />
              <div className="grid grid-cols-2 gap-4">
                <ShimmerBlock
                  className="h-10 w-full"
                  reduceMotion={reduceMotion}
                />
                <ShimmerBlock
                  className="h-10 w-full"
                  reduceMotion={reduceMotion}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <ShimmerBlock
                      className="h-3 w-24"
                      reduceMotion={reduceMotion}
                    />
                    <ShimmerBlock
                      className="h-3 w-16"
                      reduceMotion={reduceMotion}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6">
              <ShimmerBlock
                className="mx-auto h-3 w-48"
                reduceMotion={reduceMotion}
              />
              <ShimmerBlock
                className="mx-auto h-4 w-40"
                reduceMotion={reduceMotion}
              />
              <ShimmerBlock
                className="mx-auto h-3 w-24"
                reduceMotion={reduceMotion}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PaymentPageShell>
  );
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
  const shouldReduceMotion = useReducedMotion() ?? false;

  const motionConfig = useMemo(() => {
    const duration = shouldReduceMotion ? 0 : 0.35;
    const panelDuration = shouldReduceMotion ? 0 : 0.2;
    const exitDuration = shouldReduceMotion ? 0 : 0.15;
    return {
      stagger: shouldReduceMotion ? 0 : 0.08,
      card: {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration, ease: "easeOut" },
        },
      },
      panel: {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: panelDuration, ease: "easeOut" },
        },
        exit: {
          opacity: 0,
          y: shouldReduceMotion ? 0 : -6,
          transition: { duration: exitDuration, ease: "easeIn" },
        },
      },
      success: {
        initial: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" },
      },
      column: (delay: number) => ({
        hidden: { opacity: 1 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : 0.08,
            delayChildren: shouldReduceMotion ? 0 : delay,
          },
        },
      }),
    };
  }, [shouldReduceMotion]);

  // Fetch invoice data with TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["paymentPage", token],
    queryFn: () => fetchPaymentPageData(token),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Create payment intent mutation
  const { mutate: createIntent, isPending: isCreatingIntent } = useMutation({
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
    return <PaymentPageSkeleton reduceMotion={shouldReduceMotion} />;
  }

  // Error state
  if (error) {
    return (
      <PaymentPageShell reduceMotion={shouldReduceMotion}>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <motion.div {...motionConfig.success}>
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <FaTimesCircle
                    className="h-8 w-8 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-balance">
                  Payment Link Error
                </h1>
                <p className="text-muted-foreground" role="alert">
                  {error.message}
                </p>
                <p className="text-muted-foreground mt-4 text-sm">
                  Please contact us if you need assistance.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PaymentPageShell>
    );
  }

  // Success state
  if (paymentSuccess) {
    const successPaymentMethod =
      paymentMethod ??
      (data && !isAlreadyPaidResponse(data) && !isProcessingResponse(data)
        ? data.paymentSettings.allowCreditCard
          ? "card"
          : data.paymentSettings.allowBankPayment
            ? "bank"
            : null
        : null);

    return (
      <PaymentPageShell reduceMotion={shouldReduceMotion}>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <motion.div {...motionConfig.success}>
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <FaCheckCircle
                    className="h-8 w-8 text-green-600"
                    aria-hidden="true"
                  />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-balance">
                  Payment{" "}
                  {successPaymentMethod === "bank" ? "Initiated" : "Successful"}
                  !
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
          </motion.div>
        </div>
      </PaymentPageShell>
    );
  }

  if (!data) return null;

  // Already paid state - show friendly success message instead of error
  if (isAlreadyPaidResponse(data)) {
    return (
      <PaymentPageShell reduceMotion={shouldReduceMotion}>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <motion.div {...motionConfig.success}>
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <FaCheckCircle
                    className="h-8 w-8 text-green-600"
                    aria-hidden="true"
                  />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-balance">
                  Invoice Already Paid
                </h1>
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
                    aria-label="View Receipt (opens in a new tab)"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <FaReceipt className="h-4 w-4" aria-hidden="true" />
                    View Receipt
                  </a>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PaymentPageShell>
    );
  }

  // Processing state - show message when payment is being processed
  if (isProcessingResponse(data)) {
    return (
      <PaymentPageShell reduceMotion={shouldReduceMotion}>
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <motion.div {...motionConfig.success}>
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Loader2
                    className="h-8 w-8 animate-spin text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <h1 className="mb-2 text-xl font-semibold text-balance">
                  Payment Processing
                </h1>
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
          </motion.div>
        </div>
      </PaymentPageShell>
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
  const cardProcessingFeeValue = Number(data.pricing.card.processingFee);
  const achProcessingFeeValue = Number(data.pricing.ach.processingFee);
  const cardProcessingFeeLabel = Number.isFinite(cardProcessingFeeValue)
    ? formatCurrency(cardProcessingFeeValue)
    : `$${data.pricing.card.processingFee}`;
  const achProcessingFeeLabel = Number.isFinite(achProcessingFeeValue)
    ? formatCurrency(achProcessingFeeValue)
    : `$${data.pricing.ach.processingFee}`;

  // Calculate payment due date using global config (dateIssued + PAYMENT_DUE_DAYS)
  const paymentDueDate = calculatePaymentDueDate(data.invoice.dateIssued);

  const showMethodSelection = hasMultiplePaymentMethods && !paymentMethod;
  const showIntentLoader =
    !showMethodSelection && !clientSecret && !paymentError;
  const intentLabel =
    effectivePaymentMethod === "bank"
      ? "Setting up bank payment…"
      : effectivePaymentMethod === "card"
        ? "Setting up card payment…"
        : "Setting up secure payment…";

  return (
    <PaymentPageShell reduceMotion={shouldReduceMotion}>
      <h1 className="sr-only">Invoice Payment</h1>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <motion.div
          className="space-y-6"
          variants={motionConfig.column(0)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={motionConfig.card} layout>
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
                  <p className="text-muted-foreground mb-1 text-sm break-words">
                    {data.client.clientName}
                  </p>
                )}
                <p className="mb-4 font-medium break-words">
                  {data.invoice.jobTitle}
                </p>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(data.invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span>{formatCurrency(data.invoice.gst)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Due</span>
                    <span className="text-darkGreen">
                      {formatCurrency(data.invoice.invoiceTotal, true)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={motionConfig.card} layout>
            <Card>
              <CardHeader className="pb-3">
                <h2 className="flex items-center gap-2 text-base leading-none font-semibold text-balance">
                  <FaLock
                    className="h-4 w-4 text-green-600"
                    aria-hidden="true"
                  />
                  Secure Payment
                </h2>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait" initial={false}>
                  {showMethodSelection ? (
                    <motion.div
                      key="method-selection"
                      variants={motionConfig.panel}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="space-y-3"
                    >
                      <p className="text-muted-foreground mb-4 text-sm">
                        Choose your preferred payment method:
                      </p>

                      <Button
                        variant="outline"
                        className="h-auto w-full justify-start p-4"
                        onClick={() => handleSelectPaymentMethod("card")}
                      >
                        <FaCreditCard
                          className="mr-3 h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 text-left">
                          <p className="font-medium break-words">
                            Credit or Debit Card
                          </p>
                          <p className="text-muted-foreground text-xs break-words">
                            Processing fee: {cardProcessingFeeLabel} (2.9% +
                            $0.30)
                          </p>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto w-full justify-start p-4"
                        onClick={() => handleSelectPaymentMethod("bank")}
                      >
                        <FaUniversity
                          className="mr-3 h-5 w-5 text-green-600"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 text-left">
                          <p className="font-medium break-words">
                            Bank Payment (EFT)
                          </p>
                          <p className="text-muted-foreground text-xs break-words">
                            Processing fee: {achProcessingFeeLabel} (1.0% +
                            $0.40, max $5) • 5-7 days
                          </p>
                        </div>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="payment-flow"
                      variants={motionConfig.panel}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="space-y-4"
                      layout
                    >
                      {hasMultiplePaymentMethods && paymentMethod && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mb-2"
                          onClick={handleGoBack}
                        >
                          <FaArrowLeft
                            className="mr-2 h-3 w-3"
                            aria-hidden="true"
                          />
                          Change Payment Method
                        </Button>
                      )}

                      {paymentError && (
                        <div
                          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
                          role="alert"
                        >
                          {paymentError}
                        </div>
                      )}

                      <AnimatePresence mode="wait" initial={false}>
                        {showIntentLoader ? (
                          <motion.div
                            key="intent-loading"
                            variants={motionConfig.panel}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="border-muted-foreground/30 bg-muted/30 rounded-lg border border-dashed p-4 text-center"
                          >
                            <div
                              className="text-muted-foreground flex items-center justify-center gap-2 text-sm"
                              role="status"
                              aria-live="polite"
                            >
                              <Loader2
                                className="text-darkGreen h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                              <span>{intentLabel}</span>
                            </div>
                            <p className="text-muted-foreground mt-2 text-xs">
                              This takes just a moment.
                            </p>
                          </motion.div>
                        ) : clientSecret && effectivePaymentMethod ? (
                          <motion.div
                            key={`payment-form-${effectivePaymentMethod}`}
                            variants={motionConfig.panel}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                          >
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
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          className="space-y-6"
          variants={motionConfig.column(0.12)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={motionConfig.card} layout>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 text-base leading-none font-semibold text-balance">
                    Invoice Details
                  </h2>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/stripe/invoice-pdf?token=${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Download PDF (opens in a new tab)"
                    >
                      <FaFileDownload
                        className="mr-2 h-3 w-3"
                        aria-hidden="true"
                      />
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
                    <p className="font-medium break-words">
                      {data.invoice.jobTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase">
                      Location
                    </p>
                    <p className="font-medium break-words">
                      {data.invoice.location}
                    </p>
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

                  <div className="lg:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => setShowInvoiceDetails(!showInvoiceDetails)}
                    >
                      <span>View Line Items</span>
                      {showInvoiceDetails ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>

                  <div
                    className={cn(
                      "space-y-2 tabular-nums",
                      showInvoiceDetails ? "block" : "hidden lg:block",
                    )}
                  >
                    <Separator />
                    <p className="text-muted-foreground text-xs uppercase">
                      Line Items
                    </p>
                    {data.invoice.items.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No line items available.
                      </p>
                    ) : (
                      data.invoice.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between gap-4 py-1 text-sm"
                        >
                          <span className="min-w-0 flex-1 break-words">
                            {item.description}
                          </span>
                          <span className="shrink-0 font-medium">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      ))
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(data.invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (5%)</span>
                      <span>{formatCurrency(data.invoice.gst)}</span>
                    </div>
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Total</span>
                      <span>
                        {formatCurrency(data.invoice.invoiceTotal, true)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={motionConfig.card} layout>
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
          </motion.div>
        </motion.div>
      </div>
    </PaymentPageShell>
  );
}

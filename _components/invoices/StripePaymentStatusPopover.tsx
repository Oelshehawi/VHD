"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { RefreshCw, CreditCard, Building } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { getStripePaymentStatus } from "../../app/lib/actions/stripe.actions";
import {
  StripePaymentStatus,
  StripePaymentStatusEvent,
} from "../../app/lib/typeDefinitions";

interface StripePaymentStatusPopoverProps {
  invoiceId: string;
  hasStripePayment?: boolean;
}

// Map status to display info
const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  initiated: {
    label: "Initiated",
    color: "bg-blue-500",
    icon: <FaClock className="h-3 w-3" />,
  },
  processing: {
    label: "Processing",
    color: "bg-yellow-500",
    icon: <FaSpinner className="h-3 w-3 animate-spin" />,
  },
  pending: {
    label: "Pending",
    color: "bg-orange-500",
    icon: <FaClock className="h-3 w-3" />,
  },
  succeeded: {
    label: "Succeeded",
    color: "bg-green-500",
    icon: <FaCheckCircle className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500",
    icon: <FaTimesCircle className="h-3 w-3" />,
  },
};

// Map event types to friendly names
const eventLabels: Record<string, string> = {
  "payment_intent.created": "Payment initiated",
  "payment_intent.processing": "Processing started",
  "charge.pending": "Bank debit pending",
  "payment_intent.succeeded": "Payment completed",
  payment_failed: "Payment failed",
};

export default function StripePaymentStatusPopover({
  invoiceId,
  hasStripePayment = false,
}: StripePaymentStatusPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StripePaymentStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getStripePaymentStatus(invoiceId);
      if (result.success && result.status) {
        setStatus(result.status);
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  // Fetch status when popover opens
  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchStatus();
    }
  }, [isOpen, invoiceId, fetchStatus]);

  // Don't show if no Stripe payment has been attempted
  if (!hasStripePayment && !status) {
    return null;
  }

  const currentStatus = status?.status || "initiated";
  // We know statusConfig.initiated always exists
  const config = statusConfig[currentStatus] ?? statusConfig.initiated!;
  const events = status?.events || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
          {config.icon}
          <span className="ml-2">Payment Status</span>
          {status?.status && (
            <Badge
              variant="secondary"
              className={`ml-2 ${config.color} text-xs text-white`}
            >
              {config.label}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-semibold">Payment Status</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {isLoading && !status ? (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : status ? (
            <>
              {/* Current Status */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full p-1.5 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {config.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {status.paymentMethod === "bank" ? (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" /> Bank Payment (PAD)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Card Payment
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {events.length > 0 && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    Timeline
                  </p>
                  <div className="space-y-1">
                    {events.map(
                      (event: StripePaymentStatusEvent, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="bg-primary mt-1.5 h-2 w-2 rounded-full" />
                          <div className="flex-1">
                            <p className="text-foreground">
                              {eventLabels[event.eventType] || event.eventType}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                            {event.details && (
                              <p className="text-muted-foreground text-xs italic">
                                {event.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {status.lastUpdated && (
                <p className="text-muted-foreground text-xs">
                  Last updated: {new Date(status.lastUpdated).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No payment status available yet.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

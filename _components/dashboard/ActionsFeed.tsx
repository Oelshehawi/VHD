"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { DisplayAction } from "../../app/lib/dashboard.data";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  formatAmount,
  formatDateStringUTC,
  formatTimeUTC,
} from "../../app/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";
import ActionFilterPills from "./ActionFilterPills";

interface ActionsFeedProps {
  searchParams: DashboardSearchParams;
  recentActions: DisplayAction[];
}

function getActionLabel(action: string): string {
  const labels: { [key: string]: string } = {
    invoice_created: "Invoice Created",
    invoice_emailed: "Invoice Sent",
    schedule_created: "Schedule Created",
    schedule_confirmed: "Schedule Confirmed",
    schedule_unconfirmed: "Schedule Unconfirmed",
    call_logged_job: "Job Call Logged",
    call_logged_payment: "Payment Call Logged",
    reminder_configured: "Reminder Configured",
    reminder_sent_auto: "Reminder Sent (Auto)",
    reminder_sent_manual: "Reminder Sent",
    reminder_failed: "Reminder Failed",
    payment_status_changed: "Payment Status Changed",
    payment_info_updated: "Payment Info Updated",
    stripe_payment_settings_configured: "Payment Settings Updated",
    stripe_payment_link_generated: "Payment Link Generated",
    stripe_payment_initiated: "Payment Started",
    stripe_payment_succeeded: "Payment Completed",
    stripe_payment_failed: "Payment Failed",
    availability_created: "Availability Created",
    availability_updated: "Availability Updated",
    availability_deleted: "Availability Deleted",
    timeoff_requested: "Time-off Requested",
    timeoff_approved: "Time-off Approved",
    timeoff_rejected: "Time-off Rejected",
    timeoff_deleted: "Time-off Deleted",
    timeoff_updated: "Time-off Updated",
  };
  return labels[action] || action;
}

function getBadgeVariant(
  severity: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "success":
      return "default"; // green-ish in default theme usually, or we can use custom classes
    case "info":
      return "secondary";
    case "warning":
      return "secondary"; // Warning usually needs custom color
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

function getBadgeClassName(severity: string): string {
  switch (severity) {
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "info":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "warning":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "error":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "";
  }
}

function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case "3days":
      return "Every 3 days";
    case "5days":
      return "Every 5 days";
    case "7days":
      return "Every 7 days";
    case "14days":
      return "Every 14 days";
    default:
      return "None";
  }
}

function getPaymentStatus(action: string): string {
  switch (action) {
    case "stripe_payment_succeeded":
      return "completed";
    case "stripe_payment_failed":
      return "failed";
    case "stripe_payment_initiated":
      return "started";
    case "stripe_payment_link_generated":
      return "link created";
    case "stripe_payment_settings_configured":
      return "settings updated";
    default:
      return "updated";
  }
}

const ACTION_CATEGORIES = {
  all: "All Categories",
  invoices: "Invoices",
  schedules: "Schedules",
  payments: "Payments",
  confirmations: "Confirmations",
  calls: "Calls",
  reminders: "Reminders",
  availability: "Availability",
  timeoff: "Time-off",
};

function ActionCard({ action }: { action: DisplayAction }) {
  const [showFullNotes, setShowFullNotes] = useState(false);
  const isInvoiceAction =
    action.action.includes("invoice") ||
    action.action.includes("reminder") ||
    action.action.includes("stripe_payment_settings");

  // Get the correct invoice ID for navigation
  // Priority: MongoDB _id from details > audit log invoiceId
  const invoiceId =
    action.details?.newValue?.invoiceMongoId || action.invoiceId;
  const canNavigate = isInvoiceAction && Boolean(invoiceId);
  const invoiceLabel =
    action.details?.newValue?.jobTitle ||
    action.details?.newValue?.invoiceId ||
    action.invoiceId ||
    "invoice";

  const wrapperClassName = `group bg-card relative rounded-lg border border-transparent p-4 transition-shadow transition-colors duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
    canNavigate
      ? "hover:border-primary/20 hover:bg-primary/5 cursor-pointer"
      : "hover:bg-muted/50"
  }`;

  const content = (
    <div className="relative space-y-3">
      {/* Header: Who + When + Action Type */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                {action.performedByName?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">
              {action.performedByName}
            </span>
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {action.formattedTime}
          </div>
        </div>

        {/* Action badge in top-right */}
        <Badge
          variant="secondary"
          className={`shrink-0 text-[10px] ${getBadgeClassName(action.severity)}`}
        >
          {getActionLabel(action.action)}
        </Badge>
      </div>

      {/* Main content - direct and concise */}
      <DirectActionContent
        action={action}
        showFullNotes={showFullNotes}
        onToggleNotes={() => setShowFullNotes(!showFullNotes)}
      />

      {/* Status indicators */}
      <div className="flex items-center justify-between">
        {!action.success && (
          <Badge variant="destructive" className="text-[10px]">
            Failed
          </Badge>
        )}
        {canNavigate && (
          <span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
            Click to view →
          </span>
        )}
      </div>
    </div>
  );

  if (canNavigate && invoiceId) {
    return (
      <Link
        href={`/invoices/${invoiceId}`}
        className={wrapperClassName}
        aria-label={`View invoice ${invoiceLabel}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={wrapperClassName}>{content}</div>;
}

function DirectActionContent({
  action,
  showFullNotes,
  onToggleNotes,
}: {
  action: DisplayAction;
  showFullNotes: boolean;
  onToggleNotes: () => void;
}) {
  // Payment settings actions
  if (action.action === "stripe_payment_settings_configured") {
    const enabled = action.details?.newValue?.enabled;
    const allowCreditCard = action.details?.newValue?.allowCreditCard;
    const allowBankPayment = action.details?.newValue?.allowBankPayment;
    const jobTitle = action.details?.newValue?.jobTitle;

    return (
      <div className="space-y-2">
        {/* Settings status */}
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${enabled ? "text-green-700" : "text-red-700"}`}
          >
            {enabled
              ? "✅ Payment Settings Enabled"
              : "❌ Payment Settings Disabled"}
          </span>
        </div>

        {/* Payment methods */}
        <div className="text-muted-foreground text-xs">
          Methods:{" "}
          {[
            allowCreditCard && "💳 Card",
            allowBankPayment && "🏦 Bank Transfer",
          ]
            .filter(Boolean)
            .join(", ") || "None"}
        </div>

        {/* Job title if available */}
        {jobTitle && (
          <div className="text-muted-foreground text-xs">📄 {jobTitle}</div>
        )}
      </div>
    );
  }

  // Payment actions - comprehensive transaction details
  if (
    action.action.includes("stripe_payment") ||
    action.action.includes("payment_status_changed")
  ) {
    const amountValue = action.details?.newValue?.amount;
    const parsedAmount =
      typeof amountValue === "number" ? amountValue : Number(amountValue);
    const formattedAmount = Number.isFinite(parsedAmount)
      ? formatAmount(parsedAmount)
      : null;
    const status = getPaymentStatus(action.action);
    const method = action.details?.newValue?.paymentMethod || "card";
    const reference =
      action.details?.newValue?.transactionId ||
      action.details?.newValue?.reference;
    const jobTitle =
      action.metadata?.jobTitle || action.details?.newValue?.jobTitle;
    const clientName = action.metadata?.clientName;

    return (
      <div className="space-y-2">
        {/* Primary payment info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            💳 {formattedAmount ? `${formattedAmount} ` : ""}payment {status}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {method}
          </Badge>
        </div>

        {/* Transaction reference */}
        {reference && (
          <div className="text-muted-foreground text-xs">Ref: {reference}</div>
        )}

        {/* Context grid */}
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          {jobTitle && <div>📄 {jobTitle}</div>}
          {clientName && <div>👤 {clientName}</div>}
        </div>
      </div>
    );
  }

  // Schedule actions - structured display
  if (action.action.includes("schedule")) {
    const jobTitle = action.details?.newValue?.jobTitle;
    const location = action.details?.newValue?.location;
    const dateTime = action.details?.newValue?.startDateTime;
    const hours = action.details?.newValue?.hours;
    const confirmed = action.action === "schedule_confirmed";
    const unconfirmed = action.action === "schedule_unconfirmed";

    return (
      <div className="space-y-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              confirmed
                ? "text-green-700"
                : unconfirmed
                  ? "text-orange-700"
                  : "text-blue-700"
            }`}
          >
            {confirmed
              ? "✅ Confirmed"
              : unconfirmed
                ? "⏸️ Unconfirmed"
                : "📅 Scheduled"}
          </span>
        </div>

        {/* Job title */}
        {jobTitle && (
          <div className="text-muted-foreground text-xs">📄 {jobTitle}</div>
        )}

        {/* Time & location grid */}
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          {dateTime && <div>🕐 {formatTimeUTC(new Date(dateTime))}</div>}
          {location && <div>📍 {location}</div>}
          {hours && <div>⏱️ {hours}h</div>}
        </div>
      </div>
    );
  }

  // Call actions - with expandable notes
  if (action.action.includes("call_logged")) {
    const outcome = action.details?.newValue?.outcome;
    const notes = action.details?.newValue?.notes;
    const isPaymentCall = action.action === "call_logged_payment";
    const jobTitle =
      action.metadata?.jobTitle || action.details?.newValue?.jobTitle;
    const clientName = action.metadata?.clientName;

    const outcomeConfig = {
      connected: { icon: "📞", color: "text-green-700", label: "Connected" },
      no_answer: { icon: "📵", color: "text-orange-700", label: "No Answer" },
      voicemail_left: {
        icon: "📬",
        color: "text-blue-700",
        label: "Voicemail Left",
      },
      wrong_number: {
        icon: "❌",
        color: "text-red-700",
        label: "Wrong Number",
      },
      will_call_back: {
        icon: "🔄",
        color: "text-blue-700",
        label: "Will Call Back",
      },
      payment_promised: {
        icon: "💰",
        color: "text-green-700",
        label: "Payment Promised",
      },
      requested_callback: {
        icon: "📞",
        color: "text-purple-700",
        label: "Requested Callback",
      },
      scheduled: { icon: "📅", color: "text-green-700", label: "Scheduled" },
      not_interested: {
        icon: "🚫",
        color: "text-red-700",
        label: "Not Interested",
      },
      needs_more_time: {
        icon: "⏳",
        color: "text-orange-700",
        label: "Needs More Time",
      },
      will_pay_today: {
        icon: "💸",
        color: "text-green-700",
        label: "Will Pay Today",
      },
      dispute_raised: {
        icon: "⚠️",
        color: "text-red-700",
        label: "Dispute Raised",
      },
      rescheduled: { icon: "🔄", color: "text-blue-700", label: "Rescheduled" },
      cancelled: { icon: "❌", color: "text-red-700", label: "Cancelled" },
    };

    const config = outcomeConfig[outcome as keyof typeof outcomeConfig] || {
      icon: "📞",
      color: "text-gray-700",
      label: outcome || "Called",
    };

    return (
      <div className="space-y-2">
        {/* Call outcome with icon */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${config.color}`}>
            {config.icon} {config.label}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {isPaymentCall ? "Payment" : "Job"}
          </Badge>
        </div>

        {/* Context */}
        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          {jobTitle && <div>📄 {jobTitle}</div>}
          {clientName && <div>👤 {clientName}</div>}
        </div>

        {/* Expandable notes */}
        {notes && (
          <div className="text-muted-foreground text-xs italic">
            &ldquo;
            {showFullNotes
              ? notes
              : notes.length > 50
                ? notes.substring(0, 50) + "…"
                : notes}
            &rdquo;
            {notes.length > 50 && (
              <button
                className="ml-1 text-blue-600 hover:underline"
                type="button"
                aria-expanded={showFullNotes}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleNotes();
                }}
              >
                {showFullNotes ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Invoice actions - direct info only
  if (action.action.includes("invoice")) {
    const jobTitle = action.details?.newValue?.jobTitle;
    const clientEmail = action.details?.newValue?.clientEmail;

    return (
      <div className="space-y-1.5">
        <div className="text-sm font-medium">{action.description}</div>
        {jobTitle && (
          <div className="text-muted-foreground text-xs">📄 {jobTitle}</div>
        )}
        {clientEmail && (
          <div className="text-muted-foreground text-xs">✉️ {clientEmail}</div>
        )}
      </div>
    );
  }

  // Reminder actions
  if (action.action === "reminder_configured") {
    const enabled = action.details?.newValue?.enabled;
    const frequency = action.details?.newValue?.frequency;
    const jobTitle =
      action.metadata?.jobTitle || action.details?.newValue?.jobTitle;

    return (
      <div className="space-y-1.5">
        <div className="text-sm font-medium">
          {enabled
            ? `🔄 ${getFrequencyLabel(frequency)} reminders`
            : "🔄 Reminders disabled"}
        </div>
        {jobTitle && (
          <div className="text-muted-foreground text-xs">📄 {jobTitle}</div>
        )}
        {enabled && action.details?.newValue?.nextReminderDate && (
          <div className="text-muted-foreground text-xs">
            Next:{" "}
            {formatDateStringUTC(action.details.newValue.nextReminderDate)}
          </div>
        )}
      </div>
    );
  }

  if (
    action.action === "reminder_sent_auto" ||
    action.action === "reminder_sent_manual"
  ) {
    const jobTitle =
      action.metadata?.jobTitle || action.details?.newValue?.jobTitle;
    const reminderSequence = action.details?.newValue?.reminderSequence;
    const nextReminderDate = action.details?.newValue?.nextReminderDate;

    return (
      <div className="space-y-1.5">
        <div className="text-sm font-medium">
          ✉️ Reminder sent{" "}
          {action.action === "reminder_sent_auto" ? "(Auto)" : "(Manual)"}
        </div>
        {jobTitle && (
          <div className="text-muted-foreground text-xs">📄 {jobTitle}</div>
        )}
        {reminderSequence && (
          <div className="text-muted-foreground text-xs">
            Sequence: {reminderSequence}
          </div>
        )}
        {nextReminderDate && (
          <div className="text-muted-foreground text-xs">
            Next: {formatDateStringUTC(nextReminderDate)}
          </div>
        )}
      </div>
    );
  }

  if (action.action === "reminder_failed") {
    const jobTitle =
      action.metadata?.jobTitle || action.details?.newValue?.jobTitle;
    const error =
      action.details?.error || action.details?.newValue?.error || "Unknown error";

    return (
      <div className="space-y-1.5">
        <div className="text-sm font-medium text-red-700">
          ⚠️ Reminder failed
        </div>
        {jobTitle && (
          <div className="text-muted-foreground text-xs">📄 {jobTitle}</div>
        )}
        <div className="text-muted-foreground text-xs">Error: {error}</div>
      </div>
    );
  }

  // Timeoff actions - show request details
  if (action.action.includes("timeoff")) {
    const dateRange = action.details?.metadata?.dateRange;
    const technicianId = action.details?.metadata?.technicianId;
    const status = action.action.replace("timeoff_", "");
    const reason = action.details?.newValue?.reason;

    return (
      <div className="space-y-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              status === "approved"
                ? "text-green-700"
                : status === "rejected"
                  ? "text-red-700"
                  : "text-blue-700"
            }`}
          >
            {status === "approved"
              ? "✅ Approved"
              : status === "rejected"
                ? "❌ Rejected"
                : status === "requested"
                  ? "📝 Requested"
                  : "🗑️ Deleted"}
          </span>
        </div>

        {/* Date range */}
        {dateRange && (
          <div className="text-muted-foreground text-xs">📅 {dateRange}</div>
        )}

        {/* Technician context */}
        {technicianId && (
          <div className="text-muted-foreground text-xs">
            👤 Technician: {technicianId}
          </div>
        )}

        {/* Reason if available */}
        {reason && (
          <div className="text-muted-foreground text-xs italic">
            &ldquo;{reason}&rdquo;
          </div>
        )}
      </div>
    );
  }

  // Other actions - simplified description
  return <div className="text-sm font-medium">{action.description}</div>;
}

export default function ActionsFeed({
  searchParams,
  recentActions,
}: ActionsFeedProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Parse date range from searchParams
  const dateRange: DateRange | undefined = useMemo(() => {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const from = searchParams.actionsDateFrom
      ? new Date(searchParams.actionsDateFrom)
      : defaultFrom;
    const to = searchParams.actionsDateTo
      ? new Date(searchParams.actionsDateTo)
      : defaultTo;

    // Validate dates
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return { from: defaultFrom, to: defaultTo };
    }

    return { from, to };
  }, [searchParams.actionsDateFrom, searchParams.actionsDateTo]);

  // Parse search query from searchParams
  const searchQuery = searchParams.actionsSearch || "";

  const initialCategory = useMemo(() => {
    const category = searchParams.actionsCategory;
    return category && category in ACTION_CATEGORIES ? category : "all";
  }, [searchParams.actionsCategory]);

  // Local state for category filter (synced with URL)
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);

  // Parse pill filters from URL
  const initialPills = useMemo(() => {
    const pills = searchParams.actionsPills;
    return pills ? pills.split(",").filter(Boolean) : [];
  }, [searchParams.actionsPills]);

  const [selectedPills, setSelectedPills] = useState<string[]>(initialPills);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSelectedPills(initialPills);
  }, [initialPills]);

  // Update URL with debounced search query
  const updateSearchQuery = useDebouncedCallback((query: string) => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) {
      params.set("actionsSearch", query);
    } else {
      params.delete("actionsSearch");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 500);

  // Update date range in URL
  const handleDateRangeChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(window.location.search);
    if (range?.from) {
      params.set("actionsDateFrom", range.from.toISOString());
    } else {
      params.delete("actionsDateFrom");
    }
    if (range?.to) {
      params.set("actionsDateTo", range.to.toISOString());
    } else {
      params.delete("actionsDateTo");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set("actionsCategory", value);
    } else {
      params.delete("actionsCategory");
    }
    // Clear pills when category changes
    params.delete("actionsPills");
    setSelectedPills([]);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handlePillToggle = (pillValues: string[]) => {
    const params = new URLSearchParams(window.location.search);
    let newPills: string[];

    // Check if any of the pill values are already selected
    const isSelected = pillValues.some((v) => selectedPills.includes(v));

    if (isSelected) {
      // Remove all pill values from selection
      newPills = selectedPills.filter((p) => !pillValues.includes(p));
    } else {
      // Add all pill values to selection
      newPills = [...selectedPills, ...pillValues];
    }

    setSelectedPills(newPills);
    if (newPills.length > 0) {
      params.set("actionsPills", newPills.join(","));
    } else {
      params.delete("actionsPills");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleClearPills = () => {
    setSelectedPills([]);
    const params = new URLSearchParams(window.location.search);
    params.delete("actionsPills");
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Client-side filtering by category and pills
  const filteredActions = useMemo(() => {
    return recentActions.filter((action: DisplayAction) => {
      // First filter by category
      if (selectedCategory !== "all") {
        if (
          selectedCategory === "invoices" &&
          !action.action.includes("invoice")
        )
          return false;
        if (
          selectedCategory === "schedules" &&
          !action.action.includes("schedule")
        )
          return false;
        if (
          selectedCategory === "confirmations" &&
          !(
            action.action.includes("confirmed") ||
            action.action.includes("unconfirmed")
          )
        )
          return false;
        if (
          selectedCategory === "calls" &&
          !action.action.includes("call_logged")
        )
          return false;
        if (
          selectedCategory === "reminders" &&
          !action.action.includes("reminder")
        )
          return false;
        if (
          selectedCategory === "availability" &&
          !action.action.includes("availability")
        )
          return false;
        if (
          selectedCategory === "timeoff" &&
          !action.action.includes("timeoff")
        )
          return false;
        if (
          selectedCategory === "payments" &&
          !action.action.includes("payment") &&
          !action.action.includes("stripe")
        )
          return false;
      }

      // Then filter by selected pills (if any)
      if (selectedPills.length > 0) {
        return selectedPills.includes(action.action);
      }

      return true;
    });
  }, [recentActions, selectedCategory, selectedPills]);

  return (
    <Card className="flex h-full max-h-[calc(100vh-120px)] min-h-0 flex-col gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="bg-muted/40 shrink-0 border-b p-3 pb-3 sm:p-4 sm:pb-4 lg:p-6 lg:pb-4">
        {/* Title Section with Category and Date Picker */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg sm:text-xl">
                Recent Activity
              </CardTitle>
              <CardDescription className="mt-0.5 truncate text-xs sm:text-sm">
                Latest actions by your team
              </CardDescription>
            </div>

            {/* Category and Date Picker - Compact size */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger
                  className="bg-background h-7 w-[130px] shrink-0 text-xs sm:h-8 sm:w-[150px] sm:text-xs"
                  aria-label="Filter by category"
                >
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-background h-7 w-[130px] shrink-0 justify-start text-left text-xs font-normal sm:h-9 sm:w-[150px] sm:text-xs"
                  >
                    <FaCalendarAlt
                      className="mr-1.5 h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate text-[10px] sm:text-xs">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d")} -{" "}
                            {format(dateRange.to, "MMM d")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d")
                        )
                      ) : (
                        <span>Date</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={1}
                    className="rounded-lg border shadow-sm"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <ActionFilterPills
          selectedCategory={selectedCategory}
          selectedPills={selectedPills}
          onPillToggle={handlePillToggle}
          onClearAll={handleClearPills}
        />

        {/* Search Bar */}
        <div className="relative min-w-0 flex-1">
          <FaSearch
            className="text-muted-foreground absolute top-2.5 left-2.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="actionsSearch"
            autoComplete="off"
            placeholder="Search actions…"
            defaultValue={searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
            aria-label="Search actions"
            className="bg-background h-9 min-w-0 pl-8 text-sm sm:h-10 sm:pl-9 sm:text-base"
          />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {filteredActions.length === 0 ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center p-8 text-center">
              <p>No actions found matching your criteria</p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 lg:grid-cols-2 lg:gap-4">
              {filteredActions.map((action: DisplayAction) => (
                <ActionCard key={action._id} action={action} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="bg-muted/20 text-muted-foreground shrink-0 justify-center border-t px-4 py-2 text-xs">
        <span className="truncate">
          Showing {filteredActions.length} of {recentActions.length} actions
        </span>
      </CardFooter>
    </Card>
  );
}

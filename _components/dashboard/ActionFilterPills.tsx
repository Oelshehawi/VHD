"use client";

import { Badge } from "../ui/badge";
import { X } from "lucide-react";

// Define pill options for each category
const CATEGORY_PILLS: Record<string, { label: string; values: string[] }[]> = {
  invoices: [
    { label: "Created", values: ["invoice_created"] },
    { label: "Emailed", values: ["invoice_emailed"] },
  ],
  schedules: [
    { label: "Created", values: ["schedule_created"] },
    { label: "Confirmed", values: ["schedule_confirmed"] },
    { label: "Unconfirmed", values: ["schedule_unconfirmed"] },
    {
      label: "Dead Run",
      values: ["schedule_dead_run_marked", "schedule_dead_run_cleared"],
    },
    { label: "Updated", values: ["schedule_updated"] },
  ],
  payments: [
    { label: "Link Generated", values: ["stripe_payment_link_generated"] },
    { label: "Started", values: ["stripe_payment_initiated"] },
    { label: "Completed", values: ["stripe_payment_succeeded"] },
    { label: "Failed", values: ["stripe_payment_failed"] },
    { label: "Status Changed", values: ["payment_status_changed"] },
    {
      label: "Settings Updated",
      values: ["stripe_payment_settings_configured"],
    },
  ],
  confirmations: [
    { label: "Confirmed", values: ["schedule_confirmed"] },
    { label: "Unconfirmed", values: ["schedule_unconfirmed"] },
  ],
  calls: [
    { label: "Job Calls", values: ["call_logged_job"] },
    { label: "Payment Calls", values: ["call_logged_payment"] },
  ],
  reminders: [
    { label: "Configured", values: ["reminder_configured"] },
    { label: "Sent (Auto)", values: ["reminder_sent_auto"] },
    { label: "Sent (Manual)", values: ["reminder_sent_manual"] },
    { label: "Failed", values: ["reminder_failed"] },
  ],
  availability: [
    { label: "Created", values: ["availability_created"] },
    { label: "Updated", values: ["availability_updated"] },
    { label: "Deleted", values: ["availability_deleted"] },
  ],
  timeoff: [
    { label: "Requested", values: ["timeoff_requested"] },
    { label: "Approved", values: ["timeoff_approved"] },
    { label: "Rejected", values: ["timeoff_rejected"] },
    { label: "Updated", values: ["timeoff_updated"] },
    { label: "Deleted", values: ["timeoff_deleted"] },
  ],
};

interface ActionFilterPillsProps {
  selectedCategory: string;
  selectedPills: string[];
  onPillToggle: (pillValues: string[]) => void;
  onClearAll: () => void;
}

export default function ActionFilterPills({
  selectedCategory,
  selectedPills,
  onPillToggle,
  onClearAll,
}: ActionFilterPillsProps) {
  const pills = CATEGORY_PILLS[selectedCategory];

  // Don't render if no pills for this category or "all" is selected
  if (!pills || selectedCategory === "all") {
    return null;
  }

  const isPillSelected = (pillValues: string[]) => {
    return pillValues.some((v) => selectedPills.includes(v));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {pills.map((pill) => {
        const isSelected = isPillSelected(pill.values);
        return (
          <Badge
            key={pill.label}
            variant={isSelected ? "default" : "outline"}
            className={`cursor-pointer text-xs transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-muted"
            }`}
            onClick={() => onPillToggle(pill.values)}
          >
            {pill.label}
          </Badge>
        );
      })}

      {/* Clear all button when any pills are selected */}
      {selectedPills.length > 0 && (
        <Badge
          variant="secondary"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer text-xs transition-colors"
          onClick={onClearAll}
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Badge>
      )}
    </div>
  );
}

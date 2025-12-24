"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { DisplayAction } from "../../app/lib/dashboard.data";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
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

const ACTION_CATEGORIES = {
  all: "All Categories",
  invoices: "Invoices",
  schedules: "Schedules",
  confirmations: "Confirmations",
  calls: "Calls",
  reminders: "Reminders",
  availability: "Availability",
  timeoff: "Time-off",
};

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

  // Local state for category filter (client-side only)
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  // Client-side filtering by category
  const filteredActions = useMemo(() => {
    return recentActions.filter((action: DisplayAction) => {
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
      }
      return true;
    });
  }, [recentActions, selectedCategory]);

  return (
    <Card className="flex h-full max-h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/40 shrink-0 border-b p-3 pb-3 sm:p-4 sm:pb-4 lg:p-6 lg:pb-4">
        {/* Title Section - Compact on mobile */}
        <div className="mb-3 sm:mb-4">
          <CardTitle className="truncate text-lg sm:text-xl">
            Recent Activity
          </CardTitle>
          <CardDescription className="mt-0.5 truncate text-xs sm:text-sm">
            Latest actions by your team
          </CardDescription>
        </div>

        {/* Filters Section - Responsive layout */}
        <div className="flex min-w-0 flex-col gap-2 sm:gap-2.5 lg:gap-3">
          {/* Search Bar - Full width on mobile, flex-1 on larger screens */}
          <div className="relative min-w-0 flex-1">
            <FaSearch className="text-muted-foreground absolute top-2.5 left-2.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <Input
              type="search"
              placeholder="Search actions..."
              defaultValue={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="bg-background h-9 min-w-0 pl-8 text-sm sm:h-10 sm:pl-9 sm:text-base"
            />
          </div>

          {/* Category and Date Picker - Side by side on tablet+, stacked on mobile */}
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:gap-2 lg:gap-3">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="bg-background h-9 w-full shrink-0 text-sm sm:h-10 sm:w-[140px] sm:text-base lg:w-[180px]">
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
                  className="bg-background h-9 w-full shrink-0 justify-start text-left text-sm font-normal sm:h-10 sm:w-auto sm:text-base"
                >
                  <FaCalendarAlt className="mr-2 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate text-xs sm:text-sm">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} -{" "}
                          {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
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
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {filteredActions.length === 0 ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center p-8 text-center">
              <p>No actions found matching your criteria</p>
            </div>
          ) : (
            <div className="divide-border divide-y">
              {filteredActions.map((action: DisplayAction, index: number) => (
                <div
                  key={`${action._id}-${index}`}
                  className="hover:bg-muted/50 flex items-start gap-3 p-4 transition-colors"
                >
                  <Avatar className="mt-1 h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {action.performedByName?.substring(0, 2).toUpperCase() ||
                        "??"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground text-sm font-medium">
                        {action.performedByName}
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span
                        className="text-muted-foreground text-xs"
                        title={action.formattedTimeTitle}
                      >
                        {action.formattedTime}
                      </span>
                    </div>

                    <p className="text-foreground/90 text-sm leading-relaxed">
                      {action.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className={`font-normal ${getBadgeClassName(action.severity)}`}
                      >
                        {getActionLabel(action.action)}
                      </Badge>

                      {!action.success && (
                        <Badge variant="destructive" className="font-normal">
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
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

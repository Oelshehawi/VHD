"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { DisplayAction, fetchRecentActions } from "../../app/lib/dashboard.data";
import { FaFilter, FaHistory, FaChevronDown, FaSearch } from "react-icons/fa";
import { formatDateStringUTC } from "../../app/lib/utils";

interface ActionsFeedProps {}

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

function getBadgeClass(severity: string): string {
  switch (severity) {
    case "success":
      return "bg-green-100 text-green-800";
    case "info":
      return "bg-blue-100 text-blue-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const ACTION_CATEGORIES = {
  all: "All",
  invoices: "Invoices",
  schedules: "Schedules",
  confirmations: "Confirmations",
  calls: "Calls",
  reminders: "Reminders",
  availability: "Availability",
  timeoff: "Time-off",
};

export default function ActionsFeed({}: ActionsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ACTION_CATEGORIES>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const dateDebounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query (500ms delay)
  useEffect(() => {
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Date range state - default to current month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split("T")[0];
  });

  // Handlers for date input with debounce on blur (prevents refetch on arrow clicks)
  const handleStartDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (dateDebounceTimeoutRef.current) {
      clearTimeout(dateDebounceTimeoutRef.current);
    }
    dateDebounceTimeoutRef.current = setTimeout(() => {
      setStartDate(newDate);
    }, 300);
  };

  const handleEndDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (dateDebounceTimeoutRef.current) {
      clearTimeout(dateDebounceTimeoutRef.current);
    }
    dateDebounceTimeoutRef.current = setTimeout(() => {
      setEndDate(newDate);
    }, 300);
  };

  // Convert ISO date strings to Date objects for the query
  const startDateObj = new Date(startDate || "");
  const endDateObj = new Date(endDate || "");

  // Fetch actions using TanStack Query
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["recentActions", startDate, endDate, debouncedSearchQuery],
    queryFn: async () => {
      // Adjust end date to include the entire day (add 1 day then subtract 1 ms)
      const adjustedEndDate = new Date(endDateObj);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      const result = await fetchRecentActions(startDateObj, adjustedEndDate, debouncedSearchQuery);
      return result;
    },
  });

  // Client-side filtering by category only (date and search are server-side via useQuery)
  const filteredActions = useMemo(() => {
    return actions.filter((action: DisplayAction) => {
      // Filter by category
      if (selectedCategory !== "all") {
        if (selectedCategory === "invoices" && !action.action.includes("invoice")) return false;
        if (selectedCategory === "schedules" && !action.action.includes("schedule")) return false;
        if (selectedCategory === "confirmations" && !(action.action.includes("confirmed") || action.action.includes("unconfirmed"))) return false;
        if (selectedCategory === "calls" && !action.action.includes("call_logged")) return false;
        if (selectedCategory === "reminders" && !action.action.includes("reminder")) return false;
        if (selectedCategory === "availability" && !action.action.includes("availability")) return false;
        if (selectedCategory === "timeoff" && !action.action.includes("timeoff")) return false;
      }

      return true;
    });
  }, [actions, selectedCategory]);


  return (
    <div className="rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-blue-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-blue-600 shadow-lg">
            <FaHistory className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Recent Activity
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Latest actions by your team
            </p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search actions, clients, invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <FaFilter className="h-4 w-4" />
              Category
              {selectedCategory !== "all" && (
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                  1
                </span>
              )}
              <FaChevronDown className="h-3 w-3 ml-1" />
            </button>

            {/* Category Dropdown Menu */}
            {showCategoryDropdown && (
              <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-lg shadow-lg bg-white border border-gray-200 z-10">
                <div className="p-3 space-y-2">
                  {Object.entries(ACTION_CATEGORIES).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCategory(key as keyof typeof ACTION_CATEGORIES);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === key
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="flex justify-between items-center">
                        <span>{label}</span>
                        {key !== "all" && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {
                              actions.filter((a) => {
                                if (key === "invoices") return a.action.includes("invoice");
                                if (key === "schedules") return a.action.includes("schedule");
                                if (key === "confirmations") return a.action.includes("confirmed") || a.action.includes("unconfirmed");
                                if (key === "calls") return a.action.includes("call_logged");
                                if (key === "reminders") return a.action.includes("reminder");
                                if (key === "availability") return a.action.includes("availability");
                                if (key === "timeoff") return a.action.includes("timeoff");
                                return false;
                              }).length
                            }
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Range Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateRangeDropdown(!showDateRangeDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 7.5" />
              </svg>
              Dates
              <FaChevronDown className="h-3 w-3 ml-1" />
            </button>

            {/* Date Range Dropdown Menu */}
            {showDateRangeDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white border border-gray-200 z-10 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onBlur={handleStartDateBlur}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onBlur={handleEndDateBlur}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {formatDateStringUTC(startDate || "")} to {formatDateStringUTC(endDate || "")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 sm:px-6 py-4 sm:py-5 border-l-4 border-l-gray-300 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badge skeleton */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
                    </div>
                    {/* Description skeleton */}
                    <div className="space-y-2">
                      <div className="h-5 w-full bg-gray-200 rounded"></div>
                      <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
                    </div>
                    {/* Meta info skeleton */}
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="h-3 w-24 bg-gray-100 rounded"></div>
                      <span className="hidden sm:block text-gray-300">•</span>
                      <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p className="font-medium">No {selectedCategory} actions found</p>
            </div>
          </div>
        ) : (
          filteredActions.map((action: DisplayAction, index: number) => (
            <div
              key={`${action._id}-${index}`}
              className={`px-4 sm:px-6 py-4 sm:py-5 border-l-4 ${
                action.severity === "success"
                  ? "border-l-green-500"
                  : action.severity === "warning"
                    ? "border-l-yellow-500"
                    : action.severity === "error"
                      ? "border-l-red-500"
                      : "border-l-blue-500"
              } transition-all hover:bg-gray-50`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${getBadgeClass(
                        action.severity
                      )}`}
                    >
                      {getActionLabel(action.action)}
                    </span>
                    {!action.success && (
                      <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                        Failed
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-gray-900 font-medium wrap-break-word">
                    {action.description}
                  </p>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-semibold">{action.performedByName}</span>
                    </p>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <p
                      className="text-xs sm:text-sm text-gray-500"
                      title={action.formattedTimeTitle}
                    >
                      {action.formattedTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-600">
        Showing {filteredActions.length} of {actions.length} actions from {formatDateStringUTC(startDate || "")} to {formatDateStringUTC(endDate || "")}
      </div>
    </div>
  );
}

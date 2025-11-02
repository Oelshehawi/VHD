"use client";

import { useState, useMemo } from "react";
import { DisplayAction } from "../../app/lib/dashboard.data";
import { FaFilter, FaHistory } from "react-icons/fa";

interface ActionsFeedProps {
  actions: DisplayAction[];
}

function getActionLabel(action: string): string {
  const labels: { [key: string]: string } = {
    invoice_created: "Invoice Created",
    invoice_emailed: "Invoice Sent",
    schedule_created: "Schedule Created",
    call_logged_job: "Job Call Logged",
    call_logged_payment: "Payment Call Logged",
    reminder_configured: "Reminder Configured",
    reminder_sent_auto: "Reminder Sent (Auto)",
    reminder_sent_manual: "Reminder Sent",
    reminder_failed: "Reminder Failed",
    payment_status_changed: "Payment Status Changed",
    payment_info_updated: "Payment Info Updated",
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
  calls: "Calls",
  reminders: "Reminders",
};

export default function ActionsFeed({ actions }: ActionsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ACTION_CATEGORIES>("all");

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "invoices")
        return action.action.includes("invoice");
      if (selectedCategory === "schedules")
        return action.action.includes("schedule");
      if (selectedCategory === "calls")
        return action.action.includes("call_logged");
      if (selectedCategory === "reminders")
        return action.action.includes("reminder");
      return true;
    });
  }, [actions, selectedCategory]);

  if (actions.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200 h-full flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <svg
              className="h-12 w-12 text-gray-400 mb-4 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No recent actions
            </h3>
            <p className="text-gray-600">
              Actions will appear here as team members perform tasks
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <FaFilter className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(ACTION_CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  setSelectedCategory(key as keyof typeof ACTION_CATEGORIES)
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                }`}
              >
                {label} {key !== "all" && `(${
                  actions.filter((a) => {
                    if (key === "invoices") return a.action.includes("invoice");
                    if (key === "schedules") return a.action.includes("schedule");
                    if (key === "calls") return a.action.includes("call_logged");
                    if (key === "reminders") return a.action.includes("reminder");
                    return false;
                  }).length
                })`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {filteredActions.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p className="font-medium">No {selectedCategory} actions found</p>
            </div>
          </div>
        ) : (
          filteredActions.map((action, index) => (
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
                  <p className="text-sm sm:text-base text-gray-900 font-medium break-words">
                    {action.description}
                  </p>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <p className="text-xs sm:text-sm text-gray-600">
                      <span className="font-semibold">{action.performedBy}</span>
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
        Showing {filteredActions.length} of {actions.length} actions
      </div>
    </div>
  );
}

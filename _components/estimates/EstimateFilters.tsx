"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import { useDebouncedCallback } from "use-debounce";

interface EstimateFiltersProps {
  currentQuery: string;
  currentStatus: string;
  currentDateFrom: string;
  currentDateTo: string;
  statusCounts: {
    draft: number;
    sent: number;
    approved: number;
    rejected: number;
  };
}

export default function EstimateFilters({
  currentQuery,
  currentStatus,
  currentDateFrom,
  currentDateTo,
  statusCounts,
}: EstimateFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (status && status !== currentStatus) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handleDateFilter = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    } else {
      params.delete("dateFrom");
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    } else {
      params.delete("dateTo");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("dateFrom");
    params.delete("dateTo");
    replace(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setDateFrom("");
    setDateTo("");
    replace(pathname || "/estimates");
  };

  const statusOptions = [
    {
      key: "draft",
      label: "Draft",
      count: statusCounts.draft,
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    {
      key: "sent",
      label: "Sent",
      count: statusCounts.sent,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      key: "approved",
      label: "Approved",
      count: statusCounts.approved,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      key: "rejected",
      label: "Rejected",
      count: statusCounts.rejected,
      color: "bg-red-100 text-red-700 hover:bg-red-200",
    },
  ];

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      {/* Search Bar */}
      <div className="mb-3">
        <div className="flex flex-1">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search estimates by number, business name, or contact..."
              onChange={(e) => handleSearch(e.target.value)}
              defaultValue={currentQuery}
              className="h-9 w-full rounded-l-md border border-darkGreen px-3 pl-10 ring-2 ring-darkGreen focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center justify-center rounded-r-md border-darkGreen bg-darkGreen px-2 py-0 text-white ring-2 ring-darkGreen">
            <FaSearch className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Date Range Filter */}
        <div className="flex-1">
          <div className="mb-2 text-sm font-medium text-gray-700">
            Date range:
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-darkGreen focus:outline-none focus:ring-1 focus:ring-darkGreen"
              placeholder="From date"
            />
            <span className="hidden text-gray-500 sm:block">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-darkGreen focus:outline-none focus:ring-1 focus:ring-darkGreen"
              placeholder="To date"
            />
            <button
              onClick={handleDateFilter}
              className="rounded-md bg-darkGreen px-3 py-1.5 text-sm text-white hover:bg-darkGreen/90"
            >
              Apply
            </button>
            {(dateFrom || dateTo) && (
              <button
                onClick={clearDateFilter}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <FaFilter className="h-3 w-3" />
            Status:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((status) => (
              <button
                key={status.key}
                onClick={() => handleStatusFilter(status.key)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  currentStatus === status.key
                    ? "bg-darkGreen text-white"
                    : status.color
                }`}
              >
                {status.label} ({status.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear All Filters */}
      {(currentQuery || currentStatus || currentDateFrom || currentDateTo) && (
        <div className="border-t pt-2 mt-3">
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

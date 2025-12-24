"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import { useDebouncedCallback } from "use-debounce";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";

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

  // Parse date range from searchParams
  const dateRange: DateRange | undefined = useMemo(() => {
    const from = currentDateFrom ? new Date(currentDateFrom) : undefined;
    const to = currentDateTo ? new Date(currentDateTo) : undefined;

    // Validate dates
    if (from && isNaN(from.getTime())) return undefined;
    if (to && isNaN(to.getTime())) return undefined;

    if (from || to) {
      return { from, to };
    }
    return undefined;
  }, [currentDateFrom, currentDateTo]);

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

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (range?.from) {
      params.set("dateFrom", range.from.toISOString());
    } else {
      params.delete("dateFrom");
    }
    if (range?.to) {
      params.set("dateTo", range.to.toISOString());
    } else {
      params.delete("dateTo");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    replace(pathname || "/estimates");
  };

  const statusOptions = [
    {
      key: "draft",
      label: "Draft",
      count: statusCounts.draft,
    },
    {
      key: "sent",
      label: "Sent",
      count: statusCounts.sent,
    },
    {
      key: "approved",
      label: "Approved",
      count: statusCounts.approved,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: statusCounts.rejected,
    },
  ];

  const getStatusBadgeVariant = (key: string) => {
    if (currentStatus === key) {
      return "default" as const;
    }
    return "secondary" as const;
  };

  const getStatusBadgeClassName = (key: string) => {
    if (currentStatus === key) {
      return "";
    }
    switch (key) {
      case "draft":
        return "bg-muted";
      case "sent":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-300";
      default:
        return "";
    }
  };

  return (
    <Card className="">
      <CardContent className="p-3">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <FaSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search estimates by number, business name, or contact..."
              onChange={(e) => handleSearch(e.target.value)}
              defaultValue={currentQuery}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* Date Range Filter */}
          <div className="flex-1">
            <div className="text-foreground mb-2 text-sm font-medium">
              Date range:
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <FaCalendarAlt className="mr-2 h-4 w-4" />
                  <span className="truncate">
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
                      <span className="text-muted-foreground">
                        Pick a date range
                      </span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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

          {/* Status Filters */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((status) => (
                <Badge
                  key={status.key}
                  variant={getStatusBadgeVariant(status.key)}
                  className={`cursor-pointer transition-colors ${getStatusBadgeClassName(status.key)}`}
                  onClick={() => handleStatusFilter(status.key)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Clear All Filters */}
        {(currentQuery ||
          currentStatus ||
          currentDateFrom ||
          currentDateTo) && (
          <div className="mt-3 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-0 text-xs"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

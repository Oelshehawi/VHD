"use client";

import { useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import InvoiceRow from "./InvoiceRow";
import CustomSelect from "./CustomSelect";
import {
  fetchJobsDueData,
} from "../../app/lib/dashboard.data";
import { FaCalendarAlt, FaFilter, FaClock } from "react-icons/fa";
import ScheduledJobsBox from "./ScheduledJobsBox";
import { CallLogProvider } from "./CallLogManager";

// Constants
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from({ length: 8 }, (_, i) => 2024 + i);

// Helper function to serialize objects (convert to plain objects)
const serializeData = <T,>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

const JobsDueContainer = ({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) => {
  // Calculate current date at render time (not at module load)
  const currentDate = new Date();
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Use searchParams if provided, otherwise default to current month/year
  const month = searchParams.month || currentMonth;
  const year = searchParams.year || currentYear;

  // Local state for month/year to avoid server re-renders
  const [displayMonth, setDisplayMonth] = useState(month);
  const [displayYear, setDisplayYear] = useState(typeof year === "string" ? parseInt(year) : year);

  // Update URL without triggering server re-renders
  const updateUrl = useCallback((newMonth: string | undefined, newYear: number) => {
    if (!newMonth) return;
    const params = new URLSearchParams();
    params.set("month", newMonth);
    params.set("year", newYear.toString());
    if (searchParams?.scheduled) params.set("scheduled", searchParams.scheduled);

    const newUrl = `?${params.toString()}`;
    window.history.pushState({ month: newMonth, year: newYear }, "", newUrl);
  }, [searchParams?.scheduled]);

  // Handler for month selection from dropdown
  const handleMonthChange = useCallback(
    (selectedMonth: string | number) => {
      const monthStr = String(selectedMonth);
      setDisplayMonth(monthStr);
      updateUrl(monthStr, displayYear);
    },
    [displayYear, updateUrl]
  );

  // Handler for year selection from dropdown
  const handleYearChange = useCallback(
    (selectedYear: string | number) => {
      const yearNum = typeof selectedYear === "string" ? parseInt(selectedYear) : selectedYear;
      setDisplayYear(yearNum);
      updateUrl(displayMonth || MONTHS[0], yearNum);
    },
    [displayMonth, updateUrl]
  );

  // Handler for month navigation arrows (previous/next)
  const navigateMonth = useCallback(
    (offset: number) => {
      const currentMonthIndex = MONTHS.indexOf(displayMonth || "");
      const currentYearNum = displayYear;

      let newMonthIndex = currentMonthIndex + offset;
      let newYear = currentYearNum;

      if (newMonthIndex < 0) {
        newMonthIndex = 11;
        newYear -= 1;
      } else if (newMonthIndex > 11) {
        newMonthIndex = 0;
        newYear += 1;
      }

      const newMonthStr = MONTHS[newMonthIndex];
      setDisplayMonth(newMonthStr);
      setDisplayYear(newYear);
      updateUrl(newMonthStr, newYear);
    },
    [displayMonth, displayYear, updateUrl]
  );

  // Fetch data using TanStack Query
  const { data: invoicesData, isLoading, error } = useQuery({
    queryKey: ["jobsDue", displayMonth, displayYear],
    queryFn: async () => {
      return await fetchJobsDueData({
        month: displayMonth || "",
        year: displayYear,
      });
    },
  });

  // Compute filtered data from query result
  const { totalDue, displayInvoices, scheduledInvoices, scheduledCount, unscheduledCount } = useMemo(() => {
    if (!invoicesData) {
      return {
        totalDue: 0,
        displayInvoices: [],
        scheduledInvoices: [],
        scheduledCount: 0,
        unscheduledCount: 0,
      };
    }

    const { invoicesWithSchedule, scheduledCount, unscheduledCount } = invoicesData;
    const total = invoicesWithSchedule?.length || 0;

    // Filter for display based on isScheduled - default to showing unscheduled
    const display = invoicesWithSchedule.filter((invoice) =>
      searchParams?.scheduled === "true"
        ? invoice?.isScheduled
        : !invoice?.isScheduled,
    );

    // Get scheduled invoices for the modal
    const scheduled = invoicesWithSchedule.filter(
      (invoice) => invoice?.isScheduled,
    );

    return {
      totalDue: total,
      displayInvoices: serializeData(display),
      scheduledInvoices: serializeData(scheduled),
      scheduledCount,
      unscheduledCount,
    };
  }, [invoicesData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="space-y-4">
          <div className="h-6 w-full bg-gray-100 rounded"></div>
          <div className="h-64 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <FaClock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium text-gray-500">Error loading jobs</p>
            <p className="text-sm text-gray-400">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CallLogProvider>
      <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-gray-200 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-darkGreen to-green-600 shadow-lg">
            <FaCalendarAlt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Jobs Due</h2>
            <p className="text-sm text-gray-600">Track and manage upcoming jobs</p>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-darkGreen to-green-600 font-bold text-white shadow-lg">
          {totalDue}
        </div>
      </div>

      {/* Status Cards */}
      <div className="px-6 pt-4">
        <ScheduledJobsBox
          scheduledCount={scheduledCount}
          unscheduledCount={unscheduledCount}
          scheduledInvoices={scheduledInvoices}
        />
      </div>

      {/* Filters Section */}
      <div className="flex items-center justify-between gap-2 px-6 z-20 py-4">
        <div className="flex items-center gap-2">
          <FaFilter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 mr-2">Filter by:</span>
          <div className="flex flex-wrap gap-2">
            <CustomSelect
              values={MONTHS}
              currentValue={displayMonth}
              urlName="month"
              searchParams={searchParams}
              onChange={handleMonthChange}
            />
            <CustomSelect
              values={YEARS}
              currentValue={displayYear.toString()}
              urlName="year"
              searchParams={searchParams}
              onChange={handleYearChange}
            />
          </div>
        </div>

        {/* Month Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400"
            title="Previous Month"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => navigateMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400"
            title="Next Month"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="grow overflow-hidden px-6 pb-6">
        <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <div className="h-full overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>Job & Contact</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <FaClock className="h-3 w-3" />
                      <span>Due Date</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {displayInvoices.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center" colSpan={3}>
                      <div className="flex flex-col items-center justify-center">
                        <FaClock className="mb-4 h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No jobs due this month</p>
                        <p className="text-sm text-gray-400 mt-1">Check back later or adjust your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayInvoices.map((invoice) => (
                    <InvoiceRow key={invoice.invoiceId} invoiceData={invoice} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </CallLogProvider>
  );
};

export default JobsDueContainer;

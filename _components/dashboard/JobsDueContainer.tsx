"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { JobsDueDataType } from "../../app/lib/dashboard.data";
import InvoiceRow from "./InvoiceRow";
import { FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ScheduledJobsBox from "./ScheduledJobsBox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../ui/table";

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

const YEARS = Array.from({ length: 8 }, (_, i) => 2023 + i);

// Helper function to serialize objects
const serializeData = <T,>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

const JobsDueContainer = ({
  jobsDueData,
}: {
  jobsDueData: JobsDueDataType;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Calculate current date at render time
  const currentDate = new Date();
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Read from URL params using useSearchParams hook
  const monthParam = searchParams?.get("month") || null;
  const yearParam = searchParams?.get("year") || null;
  const scheduledParam = searchParams?.get("scheduled") || null;

  // Use URL params or default to current month/year
  const month = (monthParam || currentMonth) as string;
  const year: number = yearParam ? parseInt(yearParam) : currentYear;

  // Update URL using router.replace() - only fires when user explicitly changes values
  const updateUrl = (newMonth: string, newYear: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("month", newMonth);
    params.set("year", newYear.toString());
    if (scheduledParam) params.set("scheduled", scheduledParam);

    // router.replace() does client-side navigation, no full refresh
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Handler for month selection
  const handleMonthChange = (selectedMonth: string) => {
    updateUrl(selectedMonth, year);
  };

  // Handler for year selection
  const handleYearChange = (selectedYear: string) => {
    const yearNum = parseInt(selectedYear);
    updateUrl(month, yearNum);
  };

  // Handler for month navigation arrows
  const navigateMonth = (offset: number) => {
    const currentMonthIndex = MONTHS.indexOf(month);
    const currentYearNum = year;

    let newMonthIndex = currentMonthIndex + offset;
    let newYear = currentYearNum;

    if (newMonthIndex < 0) {
      newMonthIndex = 11;
      newYear -= 1;
    } else if (newMonthIndex > 11) {
      newMonthIndex = 0;
      newYear += 1;
    }

    const newMonthStr = MONTHS[newMonthIndex]!;
    updateUrl(newMonthStr, newYear);
  };

  // Use jobsDueData directly - no TanStack Query
  const {
    displayInvoices,
    scheduledInvoices,
    scheduledCount,
    unscheduledCount,
  } = useMemo(() => {
    const { invoicesWithSchedule, scheduledCount, unscheduledCount } =
      jobsDueData;
    const total = invoicesWithSchedule?.length || 0;

    // Filter for display based on isScheduled - default to showing unscheduled
    const display = invoicesWithSchedule.filter((invoice) =>
      scheduledParam === "true" ? invoice?.isScheduled : !invoice?.isScheduled,
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
  }, [jobsDueData, scheduledParam]);

  return (
    <Card className="flex h-full gap-0 max-h-[calc(100vh-120px)] w-full flex-col py-0 shadow-sm">
      <CardHeader className="bg-muted/40 border-border border-b p-4 pb-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Jobs Due</CardTitle>
            <CardDescription className="mt-1">
              Track and manage upcoming jobs
            </CardDescription>
          </div>
          {/* KPI Stats - Clickable to open ScheduledJobsBox */}
          <ScheduledJobsBox
            scheduledCount={scheduledCount}
            unscheduledCount={unscheduledCount}
            scheduledInvoices={scheduledInvoices}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <Select value={month} onValueChange={handleMonthChange}>
              <SelectTrigger className="bg-background w-[130px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((monthOption) => (
                  <SelectItem key={monthOption} value={monthOption}>
                    {monthOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="bg-background w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
              title="Previous Month"
              className="bg-background cursor-pointer"
            >
              <FaChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              title="Next Month"
              className="bg-background cursor-pointer"
            >
              <FaChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10 border-b">
            <TableRow>
              <TableHead className="w-[60%]">Job & Contact</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-64 text-center">
                  <div className="text-muted-foreground flex flex-col items-center justify-center">
                    <FaClock className="text-muted-foreground/30 mb-4 h-12 w-12" />
                    <p className="text-foreground text-lg font-medium">
                      No jobs due this month
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Check back later or adjust your filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayInvoices.map((invoice) => (
                <InvoiceRow key={invoice.invoiceId} invoiceData={invoice} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default JobsDueContainer;

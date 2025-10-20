"use client";
import MiniCalendar from "./MiniCalendar";
import FullCalendar from "./FullCalendar";
import SearchSelect from "./JobSearchSelect";
import OptimizationModal from "../optimization/OptimizationModal";
import { useState, useEffect } from "react";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import { add, startOfWeek, eachDayOfInterval, format, parse, isValid } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { AnimatePresence } from "framer-motion";
import AddEvent from "./AddEvent";
import { useRouter, useSearchParams } from "next/navigation";

const isMobileDevice = (): boolean => {
  if (typeof window !== "undefined") {
    return /Mobi|Android/i.test(navigator.userAgent);
  }
  return false;
};

const CalendarOptions = ({
  invoices,
  scheduledJobs,
  canManage,
  holidays,
  technicians,
  initialView,
  initialDate,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
  initialView?: string;
  initialDate?: string | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize calendar view from URL or default to mobile detection
  const [calendarOption, setCalendarOption] = useState<boolean>(() => {
    if (initialView === "month") return true;
    if (initialView === "week") return false;
    return isMobileDevice();
  });

  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState<boolean>(false);

  // Initialize current week from URL date or default to today
  const [currentWeek, setCurrentWeek] = useState<Date[]>(() => {
    let startDate = new Date();

    if (initialDate) {
      const parsedDate = parse(initialDate, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        startDate = parsedDate;
      }
    }

    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    return eachDayOfInterval({
      start: weekStart,
      end: add(weekStart, { days: 6 }),
    });
  });

  // Update URL when view changes
  const updateURL = (view: "week" | "month", date?: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);

    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"));
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // Only set mobile default if no URL param is present
    if (!initialView) {
      setCalendarOption(isMobileDevice());
    }
  }, [initialView]);

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7;
    const newWeekStart = add(currentWeek[0] as Date, { days });
    const weekStart = startOfWeek(newWeekStart, { weekStartsOn: 0 });

    setCurrentWeek(
      eachDayOfInterval({
        start: weekStart,
        end: add(weekStart, { days: 6 }),
      }),
    );

    // Update URL with new date
    updateURL("week", weekStart);
  };

  const toggleCalendarView = () => {
    const newView = !calendarOption;
    setCalendarOption(newView);
    updateURL(newView ? "month" : "week", currentWeek[0]);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      <Header
        calendarOption={calendarOption}
        setCalendarOption={toggleCalendarView}
        scheduledJobs={scheduledJobs}
        previousWeek={() => navigateWeek("prev")}
        nextWeek={() => navigateWeek("next")}
        currentWeek={currentWeek}
        invoices={invoices}
        canManage={canManage}
        isMobile={isMobileDevice()}
        technicians={technicians}
        isOptimizationModalOpen={isOptimizationModalOpen}
        setIsOptimizationModalOpen={setIsOptimizationModalOpen}
      />

      <OptimizationModal
        isOpen={isOptimizationModalOpen}
        onClose={() => setIsOptimizationModalOpen(false)}
        canManage={canManage}
      />

      <main className="flex-1 overflow-y-auto">
        {calendarOption ? (
          <div className="flex h-full items-start justify-center p-2 md:items-center md:p-4">
            <div className="w-full max-w-4xl rounded-xl border border-gray-200 bg-white shadow-lg">
              <MiniCalendar
                invoices={invoices}
                scheduledJobs={scheduledJobs}
                canManage={canManage}
                technicians={technicians}
              />
            </div>
          </div>
        ) : (
          <div className="h-full">
            <FullCalendar
              invoices={invoices}
              scheduledJobs={scheduledJobs}
              canManage={canManage}
              currentWeek={currentWeek}
              holidays={holidays}
              technicians={technicians}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarOptions;

const Header = ({
  calendarOption,
  setCalendarOption,
  scheduledJobs,
  currentWeek,
  previousWeek,
  nextWeek,
  invoices,
  canManage,
  isMobile,
  technicians,
  isOptimizationModalOpen,
  setIsOptimizationModalOpen,
}: {
  setCalendarOption: () => void;
  calendarOption: boolean;
  scheduledJobs: ScheduleType[];
  currentWeek: Date[];
  previousWeek: () => void;
  nextWeek: () => void;
  invoices: InvoiceType[];
  canManage: boolean;
  isMobile: boolean;
  technicians: { id: string; name: string }[];
  isOptimizationModalOpen: boolean;
  setIsOptimizationModalOpen: (open: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  
  const weekStart = currentWeek[0];
  const weekEnd = currentWeek[currentWeek.length - 1];
  const weekLabel = `${format(weekStart as Date, "MMM d")} - ${format(weekEnd as Date, "MMM d, yyyy")}`;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        {/* Responsive Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
          {/* Left Section - Search and Add Job */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
            {/* Enhanced Search */}
            <div className="flex-1 max-w-xs lg:max-w-md xl:max-w-lg">
              <SearchSelect
                scheduledJobs={scheduledJobs}
                placeholder="Search jobs..."
                technicians={technicians}
                canManage={canManage}
              />
            </div>

            {/* Add Job Button */}
            {canManage && (
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap touch-manipulation"
              >
                <svg className="h-4 w-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Job</span>
              </button>
            )}
          </div>

          {/* Center Section - Week Navigation (only for full calendar) */}
          {!calendarOption && (
            <div className="flex items-center justify-between lg:justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={previousWeek}
                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all duration-200 touch-manipulation"
                  aria-label="Previous week"
                >
                  <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <button
                  onClick={nextWeek}
                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all duration-200 touch-manipulation"
                  aria-label="Next week"
                >
                  <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              <div className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{weekLabel}</span>
              </div>
            </div>
          )}

          {/* Right Section - View Toggle and Optimization */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Optimization Button - Hidden on mobile */}
            {canManage && (
              <button
                onClick={() => setIsOptimizationModalOpen(true)}
                className="hidden md:flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
              >
                <svg className="h-4 w-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Optimize</span>
              </button>
            )}

            {/* View Toggle */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">View:</span>
                <button
                  onClick={setCalendarOption}
                  className={`px-2 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation ${
                    calendarOption
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {calendarOption ? "Week" : "Month"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      <AnimatePresence>
        {open && (
          <AddEvent
            invoices={invoices}
            open={open}
            setOpen={() => setOpen(!open)}
            technicians={technicians}
            scheduledJobs={scheduledJobs}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

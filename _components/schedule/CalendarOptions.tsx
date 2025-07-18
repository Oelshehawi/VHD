"use client";
import MiniCalendar from "./MiniCalendar";
import FullCalendar from "./FullCalendar";
import SearchSelect from "./JobSearchSelect";
import OptimizationControls from "./OptimizationControls";
import { useState, useEffect } from "react";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { add, startOfWeek, eachDayOfInterval, format } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { AnimatePresence } from "framer-motion";
import AddEvent from "./AddEvent";

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
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
}) => {
  const [calendarOption, setCalendarOption] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<SerializedOptimizationResult | null>(null);
  const [showOptimization, setShowOptimization] = useState<boolean>(false);
  const [currentWeek, setCurrentWeek] = useState<Date[]>(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    return eachDayOfInterval({
      start: weekStart,
      end: add(weekStart, { days: 6 }),
    });
  });

  useEffect(() => {
    setCalendarOption(isMobileDevice());
  }, []);

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7;
    const newWeekStart = add(currentWeek[0] as Date, { days });
    setCurrentWeek(
      eachDayOfInterval({
        start: startOfWeek(newWeekStart, { weekStartsOn: 0 }),
        end: add(startOfWeek(newWeekStart, { weekStartsOn: 0 }), { days: 6 }),
      }),
    );
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      <Header
        calendarOption={calendarOption}
        setCalendarOption={() => setCalendarOption(!calendarOption)}
        scheduledJobs={scheduledJobs}
        previousWeek={() => navigateWeek("prev")}
        nextWeek={() => navigateWeek("next")}
        currentWeek={currentWeek}
        invoices={invoices}
        canManage={canManage}
        isMobile={isMobileDevice()}
        technicians={technicians}
        showOptimization={showOptimization}
        setShowOptimization={setShowOptimization}
        optimizationResult={optimizationResult}
        setOptimizationResult={setOptimizationResult}
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
              optimizationResult={optimizationResult}
              showOptimization={showOptimization}
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
  showOptimization,
  setShowOptimization,
  optimizationResult,
  setOptimizationResult,
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
  showOptimization: boolean;
  setShowOptimization: (show: boolean) => void;
  optimizationResult: SerializedOptimizationResult | null;
  setOptimizationResult: (result: SerializedOptimizationResult | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  
  const weekStart = currentWeek[0];
  const weekEnd = currentWeek[currentWeek.length - 1];
  const weekLabel = `${format(weekStart as Date, "MMM d")} - ${format(weekEnd as Date, "MMM d, yyyy")}`;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        {/* Single Row Layout */}
        <div className="flex items-center justify-between">
          {/* Left Section - Search and Add Job */}
          <div className="flex items-center space-x-4">
            {/* Enhanced Search */}
            <div className="w-80">
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
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Job
              </button>
            )}
          </div>

          {/* Center Section - Week Navigation (only for full calendar) */}
          {!calendarOption && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={previousWeek}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={nextWeek}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all duration-200"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-900">{weekLabel}</span>
              </div>
            </div>
          )}

          {/* Right Section - View Toggle and Optimization */}
          <div className="flex items-center space-x-4">
            {/* Optimization Controls */}
            <OptimizationControls
              showOptimization={showOptimization}
              setShowOptimization={setShowOptimization}
              optimizationResult={optimizationResult}
              setOptimizationResult={setOptimizationResult}
              canManage={canManage}
            />

            {/* View Toggle */}
            {!isMobile && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">View:</span>
                <button
                  onClick={setCalendarOption}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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

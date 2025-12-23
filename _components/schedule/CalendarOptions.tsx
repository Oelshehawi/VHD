"use client";
import MonthCalendar from "./views/MonthCalendar";
import WeekCalendar from "./views/WeekCalendar";
import DayCalendar from "./views/DayCalendar";
import SearchSelect from "./JobSearchSelect";
import OptimizationModal from "../optimization/OptimizationModal";
import { useState, useEffect } from "react";
import {
  InvoiceType,
  ScheduleType,
  AvailabilityType,
} from "../../app/lib/typeDefinitions";
import {
  add,
  startOfWeek,
  eachDayOfInterval,
  format,
  parse,
  isValid,
  startOfDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  BarChart3,
} from "lucide-react";
import AddJob from "./AddJob";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";

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
  availability,
  initialView,
  initialDate,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  initialView?: string;
  initialDate?: string | null;
}) => {
  // Initialize calendar view from URL or default to mobile detection
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">(
    () => {
      const isMobile = isMobileDevice();
      // Force month view on mobile regardless of URL
      if (isMobile) return "month";
      // For desktop, respect URL params
      if (initialView === "month") return "month";
      if (initialView === "week") return "week";
      if (initialView === "day") return "day";
      return "week"; // Default to week view for desktop if no URL param
    },
  );

  const [currentDay, setCurrentDay] = useState<Date>(() => {
    if (initialDate) {
      const parsedDate = parse(initialDate, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        return startOfDay(parsedDate);
      }
    }
    return startOfDay(new Date());
  });

  const [isOptimizationModalOpen, setIsOptimizationModalOpen] =
    useState<boolean>(false);
  const [showAvailability, setShowAvailability] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string | null>(
    initialDate || null,
  );

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

  // Instant URL update using native History API (Google Calendar style)
  const updateURLInstant = (view: "day" | "week" | "month", date: Date) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    params.set("date", format(date, "yyyy-MM-dd"));

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    // Update currentDate state so MiniCalendar syncs
    setCurrentDate(format(date, "yyyy-MM-dd"));

    // Use pushState to create history entries for back/forward navigation
    // Store the state so we can restore it on popstate
    window.history.pushState(
      { view, date: format(date, "yyyy-MM-dd") },
      "",
      newUrl,
    );
  };

  // Mobile detection is handled in initial state, no need for effect

  // Add a useEffect to listen for URL changes and update currentDate
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlDate = params.get("date");
      if (urlDate) {
        setCurrentDate(urlDate);
      }
    };

    // Listen for popstate events (back/forward button)
    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  // Sync state with URL params (both on mount and popstate events)
  useEffect(() => {
    const syncStateWithURL = () => {
      // Get current URL params
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get("view");
      const urlDate = params.get("date");

      // Update view state - force month view on mobile
      const isMobile = isMobileDevice();
      if (isMobile) {
        // Mobile users always get month view
        setCurrentView("month");
      } else {
        // Desktop users can switch between views
        if (urlView === "month") {
          setCurrentView("month");
        } else if (urlView === "week") {
          setCurrentView("week");
        } else if (urlView === "day") {
          setCurrentView("day");
        }
      }

      // Update date/week/day state
      if (urlDate) {
        const parsedDate = parse(urlDate, "yyyy-MM-dd", new Date());

        if (isValid(parsedDate)) {
          setCurrentDate(urlDate);
          setCurrentDay(startOfDay(parsedDate));
          const weekStart = startOfWeek(parsedDate, { weekStartsOn: 0 });
          const newWeek = eachDayOfInterval({
            start: weekStart,
            end: add(weekStart, { days: 6 }),
          });
          setCurrentWeek(newWeek);
        }
      }
    };

    // Sync on mount (when navigating back from different page)
    syncStateWithURL();

    // Also listen for popstate events (back/forward button within same page)
    const handlePopState = () => {
      syncStateWithURL();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7;
    const newWeekStart = add(currentWeek[0] as Date, { days });
    const weekStart = startOfWeek(newWeekStart, { weekStartsOn: 0 });

    const newWeek = eachDayOfInterval({
      start: weekStart,
      end: add(weekStart, { days: 6 }),
    });

    // Update state and URL instantly together
    setCurrentWeek(newWeek);
    updateURLInstant("week", weekStart);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -1 : 1;
    const newDay = add(currentDay, { days });
    setCurrentDay(startOfDay(newDay));
    updateURLInstant("day", newDay);
  };

  const handleViewChange = (view: "day" | "week" | "month") => {
    setCurrentView(view);
    const dateToUse = view === "day" ? currentDay : (currentWeek[0] as Date);
    updateURLInstant(view, dateToUse);
  };

  // Handler for MiniCalendar to update URL when month/day changes
  const handleDateChange = (date: Date, view: "week" | "month" = "month") => {
    updateURLInstant(view, date);
  };

  // Navigate to today
  const navigateToToday = () => {
    const today = startOfDay(new Date());
    if (currentView === "day") {
      setCurrentDay(today);
      updateURLInstant("day", today);
    } else if (currentView === "week") {
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const newWeek = eachDayOfInterval({
        start: weekStart,
        end: add(weekStart, { days: 6 }),
      });
      setCurrentWeek(newWeek);
      updateURLInstant("week", weekStart);
    } else {
      // Month view - update to today's date (which will show the month containing today)
      updateURLInstant("month", today);
    }
  };

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        scheduledJobs={scheduledJobs}
        previousWeek={() => navigateWeek("prev")}
        nextWeek={() => navigateWeek("next")}
        previousDay={() => navigateDay("prev")}
        nextDay={() => navigateDay("next")}
        goToToday={navigateToToday}
        currentWeek={currentWeek}
        currentDay={currentDay}
        invoices={invoices}
        canManage={canManage}
        isMobile={isMobileDevice()}
        technicians={technicians}
        isOptimizationModalOpen={isOptimizationModalOpen}
        setIsOptimizationModalOpen={setIsOptimizationModalOpen}
        showAvailability={showAvailability}
        setShowAvailability={setShowAvailability}
      />

      <OptimizationModal
        isOpen={isOptimizationModalOpen}
        onClose={() => setIsOptimizationModalOpen(false)}
        canManage={canManage}
      />

      <main className="bg-background flex-1 overflow-y-auto">
        {currentView === "month" ? (
          <div className="flex h-full items-start justify-center p-2 md:items-center md:p-4">
            <Card className="w-full max-w-4xl">
              <MonthCalendar
                key={currentDate}
                invoices={invoices}
                scheduledJobs={scheduledJobs}
                canManage={canManage}
                technicians={technicians}
                availability={availability}
                showAvailability={showAvailability}
                onDateChange={handleDateChange}
                initialDate={currentDate}
              />
            </Card>
          </div>
        ) : currentView === "week" ? (
          <div className="h-full">
            <WeekCalendar
              invoices={invoices}
              scheduledJobs={scheduledJobs}
              canManage={canManage}
              currentWeek={currentWeek}
              holidays={holidays}
              technicians={technicians}
              availability={availability}
              showAvailability={showAvailability}
            />
          </div>
        ) : (
          <div className="h-full">
            <DayCalendar
              invoices={invoices}
              scheduledJobs={scheduledJobs}
              canManage={canManage}
              currentDay={currentDay}
              holidays={holidays}
              technicians={technicians}
              availability={availability}
              showAvailability={showAvailability}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarOptions;

const Header = ({
  currentView,
  onViewChange,
  scheduledJobs,
  currentWeek,
  currentDay,
  previousWeek,
  nextWeek,
  previousDay,
  nextDay,
  goToToday,
  invoices,
  canManage,
  isMobile,
  technicians,
  isOptimizationModalOpen,
  setIsOptimizationModalOpen,
  showAvailability,
  setShowAvailability,
}: {
  currentView: "day" | "week" | "month";
  onViewChange: (view: "day" | "week" | "month") => void;
  scheduledJobs: ScheduleType[];
  currentWeek: Date[];
  currentDay: Date;
  previousWeek: () => void;
  nextWeek: () => void;
  previousDay: () => void;
  nextDay: () => void;
  goToToday: () => void;
  invoices: InvoiceType[];
  canManage: boolean;
  isMobile: boolean;
  technicians: { id: string; name: string }[];
  isOptimizationModalOpen: boolean;
  setIsOptimizationModalOpen: (open: boolean) => void;
  showAvailability: boolean;
  setShowAvailability: (show: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);

  const weekStart = currentWeek[0];
  const weekEnd = currentWeek[currentWeek.length - 1];
  const weekLabel = `${format(weekStart as Date, "MMM d")} - ${format(weekEnd as Date, "MMM d, yyyy")}`;
  const dayLabel = format(currentDay, "EEEE, MMM d, yyyy");

  const getNavigationLabel = () => {
    if (currentView === "day") return dayLabel;
    if (currentView === "week") return weekLabel;
    return null;
  };

  const handleNavigation = (direction: "prev" | "next") => {
    if (currentView === "day") {
      direction === "prev" ? previousDay() : nextDay();
    } else if (currentView === "week") {
      direction === "prev" ? previousWeek() : nextWeek();
    }
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Row 1: Search + Add Job (Left) | Navigation (Center/Right) */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="w-48 sm:w-64 lg:w-80">
            <SearchSelect
              scheduledJobs={scheduledJobs}
              placeholder="Search jobs..."
              technicians={technicians}
              canManage={canManage}
            />
          </div>

          {/* Add Job Button */}
          {canManage && (
            <Button onClick={() => setOpen(!open)} size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add Job</span>
            </Button>
          )}
        </div>

        {/* Navigation Controls (Day/Week views) */}
        {(currentView === "day" || currentView === "week") && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleNavigation("prev")}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleNavigation("next")}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium text-foreground min-w-[140px] sm:min-w-[200px] text-center">
              {getNavigationLabel()}
            </span>

            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Today
            </Button>
          </div>
        )}

        {/* Right Section: Actions + View Tabs */}
        <div className="flex items-center gap-2">
          {/* Today Button - Month view only */}
          {currentView === "month" && (
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Today
            </Button>
          )}

          {/* Optimize Button */}
          {canManage && (
            <Button
              onClick={() => setIsOptimizationModalOpen(true)}
              size="sm"
              className="hidden h-8 md:flex"
            >
              <BarChart3 className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Optimize</span>
            </Button>
          )}

          {/* Availability Toggle */}
          <Button
            onClick={() => setShowAvailability(!showAvailability)}
            variant={showAvailability ? "secondary" : "outline"}
            size="sm"
            className="h-8"
            title={showAvailability ? "Hide availability" : "Show availability"}
          >
            {showAvailability ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            <span className="ml-1.5 hidden sm:inline">
              {showAvailability ? "Availability On" : "Availability Off"}
            </span>
          </Button>

          {/* View Tabs */}
          {!isMobile && (
            <Tabs
              value={currentView}
              onValueChange={(v) => onViewChange(v as "day" | "week" | "month")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="day" className="text-xs px-3">
                  Day
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-3">
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3">
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      <AddJob
        invoices={invoices}
        open={open}
        onOpenChange={setOpen}
        technicians={technicians}
        scheduledJobs={scheduledJobs}
      />
    </div>
  );
};

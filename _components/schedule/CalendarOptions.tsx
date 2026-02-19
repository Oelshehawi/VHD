"use client";
import MonthCalendar from "./views/MonthCalendar";
import WeekCalendar from "./views/WeekCalendar";
import SearchSelect from "./JobSearchSelect";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ScheduleType,
  AvailabilityType,
  TimeOffRequestType,
} from "../../app/lib/typeDefinitions";
import {
  add,
  addMonths,
  startOfWeek,
  eachDayOfInterval,
  format,
  parse,
  isValid,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2, Wand2 } from "lucide-react";
import AddJob from "./AddJob";
import SmartSchedulePanel from "./smart-scheduling/SmartSchedulePanel";
import ScheduleInsightsPanel, {
  defaultInsightWindowFromView,
} from "./insights/ScheduleInsightsPanel";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { fetchVisibleScheduledJobsWithShifts } from "../../app/lib/scheduleAndShifts";
import { useTravelTimeEstimates } from "./hooks/useTravelTimeEstimates";

const isMobileDevice = (): boolean => {
  if (typeof window !== "undefined") {
    return /Mobi|Android/i.test(navigator.userAgent);
  }
  return false;
};

type LoadedRange = {
  startMs: number;
  endMs: number;
};

const RANGE_WINDOW_PAST_DAYS = 14;
const RANGE_WINDOW_FUTURE_MONTHS = 2;
const RANGE_FETCH_DEBOUNCE_MS = 200;

const parseRangeFromIso = (
  startIso?: string,
  endIso?: string,
): LoadedRange | null => {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start.getTime() > end.getTime()) return null;

  return { startMs: start.getTime(), endMs: end.getTime() };
};

const mergeLoadedRanges = (ranges: LoadedRange[]): LoadedRange[] => {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a.startMs - b.startMs);
  const merged: LoadedRange[] = [sorted[0] as LoadedRange];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i] as LoadedRange;
    const last = merged[merged.length - 1] as LoadedRange;

    if (current.startMs <= last.endMs + 1) {
      last.endMs = Math.max(last.endMs, current.endMs);
      continue;
    }

    merged.push(current);
  }

  return merged;
};

const isRangeCovered = (
  requiredRange: LoadedRange,
  loadedRanges: LoadedRange[],
): boolean => {
  if (loadedRanges.length === 0) return false;

  let cursor = requiredRange.startMs;
  const sorted = [...loadedRanges].sort((a, b) => a.startMs - b.startMs);

  for (const range of sorted) {
    if (range.endMs < cursor) continue;
    if (range.startMs > cursor) return false;

    cursor = Math.max(cursor, range.endMs + 1);
    if (cursor > requiredRange.endMs) return true;
  }

  return false;
};

const buildFetchWindowForDate = (anchor: Date): LoadedRange => {
  const start = startOfDay(subDays(anchor, RANGE_WINDOW_PAST_DAYS));
  const end = endOfDay(addMonths(anchor, RANGE_WINDOW_FUTURE_MONTHS));
  return { startMs: start.getTime(), endMs: end.getTime() };
};

const getVisibleWindow = ({
  currentView,
  currentDay,
  currentWeek,
  currentDate,
}: {
  currentView: "week" | "month";
  currentDay: Date;
  currentWeek: Date[];
  currentDate: string | null;
}): { requiredRange: LoadedRange; anchorDate: Date } => {
  if (currentView === "week") {
    const dayStart = startOfDay(currentWeek[0] as Date);
    const dayEnd = endOfDay(currentWeek[6] as Date);
    return {
      requiredRange: { startMs: dayStart.getTime(), endMs: dayEnd.getTime() },
      anchorDate: dayStart,
    };
  }

  // Month view
  const parsedCurrent = currentDate
    ? parse(currentDate, "yyyy-MM-dd", new Date())
    : null;
  const monthAnchor =
    parsedCurrent && isValid(parsedCurrent) ? parsedCurrent : currentDay;
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return {
    requiredRange: {
      startMs: monthGridStart.getTime(),
      endMs: monthGridEnd.getTime(),
    },
    anchorDate: monthStart,
  };
};

const mergeJobsById = (
  existingJobs: ScheduleType[],
  incomingJobs: ScheduleType[],
): ScheduleType[] => {
  const jobsById = new Map<string, ScheduleType>();

  for (const job of existingJobs) {
    jobsById.set(job._id.toString(), job);
  }

  for (const job of incomingJobs) {
    jobsById.set(job._id.toString(), job);
  }

  return Array.from(jobsById.values());
};

const CalendarOptions = ({
  scheduledJobs,
  canManage,
  holidays,
  technicians,
  availability,
  timeOffRequests = [],
  initialView,
  initialDate,
  initialRangeStart,
  initialRangeEnd,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string; depotAddress?: string | null }[];
  availability: AvailabilityType[];
  timeOffRequests?: TimeOffRequestType[];
  initialView?: string;
  initialDate?: string | null;
  initialRangeStart?: string;
  initialRangeEnd?: string;
}) => {
  // Initialize calendar view from URL or default to mobile detection
  const [currentView, setCurrentView] = useState<"week" | "month">(
    () => {
      const isMobile = isMobileDevice();
      // Force month view on mobile regardless of URL
      if (isMobile) return "month";
      // For desktop, respect URL params
      if (initialView === "month") return "month";
      if (initialView === "week") return "week";
      // Fallback: if URL has "day", use week for desktop or month for mobile
      if (initialView === "day") return isMobile ? "month" : "week";
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

  // Availability is always shown - no toggle needed
  const showAvailability = true;
  const [jobsData, setJobsData] = useState<ScheduleType[]>(scheduledJobs);
  const [currentDate, setCurrentDate] = useState<string | null>(
    initialDate || null,
  );
  const [isRangeLoading, setIsRangeLoading] = useState<boolean>(false);
  const [loadedRanges, setLoadedRanges] = useState<LoadedRange[]>(() => {
    const initialRange = parseRangeFromIso(initialRangeStart, initialRangeEnd);
    return initialRange ? [initialRange] : [];
  });
  const latestRequestIdRef = useRef(0);
  const loadedRangesRef = useRef<LoadedRange[]>(loadedRanges);

  useEffect(() => {
    loadedRangesRef.current = loadedRanges;
  }, [loadedRanges]);

  useEffect(() => {
    setJobsData(scheduledJobs);
    const initialRange = parseRangeFromIso(initialRangeStart, initialRangeEnd);
    const nextRanges = initialRange ? [initialRange] : [];
    setLoadedRanges(nextRanges);
    loadedRangesRef.current = nextRanges;
    setIsRangeLoading(false);
    latestRequestIdRef.current += 1;
  }, [scheduledJobs, initialRangeStart, initialRangeEnd]);

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
  const updateURLInstant = (view: "week" | "month", date: Date) => {
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
          // Fallback: redirect day view to week
          setCurrentView("week");
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


  const navigateMonth = (direction: "prev" | "next") => {
    const parsedCurrentDate = currentDate
      ? parse(currentDate, "yyyy-MM-dd", new Date())
      : null;
    const baseDate =
      parsedCurrentDate && isValid(parsedCurrentDate)
        ? parsedCurrentDate
        : currentDay;
    const firstDayOfCurrentMonth = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      1,
    );
    const newMonthDate = add(firstDayOfCurrentMonth, {
      months: direction === "prev" ? -1 : 1,
    });
    updateURLInstant("month", newMonthDate);
  };

  const handleViewChange = (view: "week" | "month") => {
    setCurrentView(view);
    const dateToUse = currentWeek[0] as Date;
    updateURLInstant(view, dateToUse);
  };

  // Handler for MiniCalendar to update URL when month/day changes
  const handleDateChange = (date: Date, view: "week" | "month" = "month") => {
    updateURLInstant(view, date);
  };

  // Navigate to today
  const navigateToToday = () => {
    const today = startOfDay(new Date());
    if (currentView === "month") {
      updateURLInstant("month", today);
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

  const fetchRangeForAnchorDate = useCallback(async (anchorDate: Date) => {
    const fetchWindow = buildFetchWindowForDate(anchorDate);
    if (isRangeCovered(fetchWindow, loadedRangesRef.current)) {
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setIsRangeLoading(true);

    try {
      const fetchedJobs = await fetchVisibleScheduledJobsWithShifts(
        new Date(fetchWindow.startMs).toISOString(),
        new Date(fetchWindow.endMs).toISOString(),
      );

      if (requestId !== latestRequestIdRef.current) return;

      setJobsData((previousJobs) => mergeJobsById(previousJobs, fetchedJobs));
      setLoadedRanges((previousRanges) => {
        const mergedRanges = mergeLoadedRanges([
          ...previousRanges,
          fetchWindow,
        ]);
        loadedRangesRef.current = mergedRanges;
        return mergedRanges;
      });
    } catch (error) {
      if (requestId === latestRequestIdRef.current) {
        console.error("Failed to fetch schedule range:", error);
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsRangeLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const { requiredRange, anchorDate } = getVisibleWindow({
      currentView,
      currentDay,
      currentWeek,
      currentDate,
    });

    if (isRangeCovered(requiredRange, loadedRanges)) return;

    const timer = window.setTimeout(() => {
      void fetchRangeForAnchorDate(anchorDate);
    }, RANGE_FETCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    currentView,
    currentDay,
    currentWeek,
    currentDate,
    loadedRanges,
    fetchRangeForAnchorDate,
  ]);

  // ── Travel Time ────────────────────────────────────────────────────────
  // Find the first technician with a depot address
  const depotAddress = useMemo(() => {
    const techWithDepot = technicians.find((t) => t.depotAddress);
    return techWithDepot?.depotAddress ?? null;
  }, [technicians]);

  // Compute visible date keys based on current view
  const visibleDateKeys = useMemo(() => {
    if (currentView === "week") {
      return currentWeek.map((d) => format(d, "yyyy-MM-dd"));
    }
    // Month view
    const parsedCurrent = currentDate
      ? parse(currentDate, "yyyy-MM-dd", new Date())
      : null;
    const monthAnchor =
      parsedCurrent && isValid(parsedCurrent) ? parsedCurrent : currentDay;
    const monthGridStart = startOfWeek(startOfMonth(monthAnchor), {
      weekStartsOn: 0,
    });
    const monthGridEnd = endOfWeek(endOfMonth(monthAnchor), {
      weekStartsOn: 0,
    });
    return eachDayOfInterval({ start: monthGridStart, end: monthGridEnd }).map(
      (d) => format(d, "yyyy-MM-dd"),
    );
  }, [currentView, currentDay, currentWeek, currentDate]);

  const { summaries: travelTimeSummaries, isLoading: isTravelTimeLoading } =
    useTravelTimeEstimates(jobsData, depotAddress, visibleDateKeys);

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden p-2 sm:p-3 lg:p-4">
      <div className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-xl">
        <Header
          currentView={currentView}
          onViewChange={handleViewChange}
          scheduledJobs={jobsData}
          previousWeek={() => navigateWeek("prev")}
          nextWeek={() => navigateWeek("next")}
          previousDay={() => {}}
          nextDay={() => {}}
          goToToday={navigateToToday}
          currentWeek={currentWeek}
          currentDay={currentDay}
          currentDate={currentDate}
          canManage={canManage}
          isMobile={isMobileDevice()}
          technicians={technicians}
          previousMonth={() => navigateMonth("prev")}
          nextMonth={() => navigateMonth("next")}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div
            className={`relative h-full transition-opacity ${
              isRangeLoading ? "opacity-80" : "opacity-100"
            }`}
            aria-busy={isRangeLoading}
            aria-live="polite"
          >
            {currentView === "month" ? (
              <div className="h-full">
                <MonthCalendar
                  key={currentDate}
                  scheduledJobs={jobsData}
                  canManage={canManage}
                  technicians={technicians}
                  availability={availability}
                  showAvailability={showAvailability}
                  timeOffRequests={timeOffRequests}
                  onDateChange={handleDateChange}
                  initialDate={currentDate}
                  showDesktopHeader={false}
                  travelTimeSummaries={travelTimeSummaries}
                  isTravelTimeLoading={isTravelTimeLoading}
                />
              </div>
            ) : (
              <div className="h-full">
                <WeekCalendar
                  scheduledJobs={jobsData}
                  canManage={canManage}
                  currentWeek={currentWeek}
                  holidays={holidays}
                  technicians={technicians}
                  availability={availability}
                  timeOffRequests={timeOffRequests}
                  travelTimeSummaries={travelTimeSummaries}
                  isTravelTimeLoading={isTravelTimeLoading}
                />
              </div>
            )}
            {isRangeLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 bg-black/15">
                <div className="absolute top-3 right-3 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white shadow">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading schedule
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
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
  currentDate,
  previousWeek,
  nextWeek,
  previousDay,
  nextDay,
  previousMonth,
  nextMonth,
  goToToday,
  canManage,
  isMobile,
  technicians,
}: {
  currentView: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
  scheduledJobs: ScheduleType[];
  currentWeek: Date[];
  currentDay: Date;
  currentDate: string | null;
  previousWeek: () => void;
  nextWeek: () => void;
  previousDay: () => void;
  nextDay: () => void;
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
  canManage: boolean;
  isMobile: boolean;
  technicians: { id: string; name: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const [smartScheduleOpen, setSmartScheduleOpen] = useState(false);

  const weekStart = currentWeek[0];
  const weekEnd = currentWeek[currentWeek.length - 1];
  const weekLabel = `${format(weekStart as Date, "MMM d")} - ${format(weekEnd as Date, "MMM d, yyyy")}`;
  const dayLabel = format(currentDay, "EEEE, MMM d, yyyy");
  const parsedCurrentDate = currentDate
    ? parse(currentDate, "yyyy-MM-dd", new Date())
    : null;
  const monthAnchorDate =
    parsedCurrentDate && isValid(parsedCurrentDate)
      ? parsedCurrentDate
      : currentDay;
  const monthLabel = format(monthAnchorDate, "MMMM yyyy");
  const insightWindow = useMemo(() => {
    return defaultInsightWindowFromView({
      currentView,
      currentDay,
      currentWeek,
      currentDate,
    });
  }, [currentView, currentDay, currentWeek, currentDate]);
  const getNavigationLabel = () => {
    if (currentView === "week") return weekLabel;
    return monthLabel;
  };

  const handleNavigation = (direction: "prev" | "next") => {
    if (currentView === "week") {
      direction === "prev" ? previousWeek() : nextWeek();
    } else {
      direction === "prev" ? previousMonth() : nextMonth();
    }
  };

  return (
    <div className="border-border bg-card border-b">
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        {/* Row 1: Search + Add Job */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Search */}
          <div className="w-32 min-w-0 flex-1 sm:w-48 md:w-64 lg:w-80 lg:flex-none">
            <SearchSelect
              placeholder="Search jobs..."
              technicians={technicians}
              canManage={canManage}
            />
          </div>

          {/* Add Job Button */}
          {canManage && (
            <>
              <Button
                onClick={() => setOpen(!open)}
                size="sm"
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Add Job</span>
              </Button>
              {/* Smart Schedule Button - Month view only */}
              {currentView === "month" && (
                <Button
                  onClick={() => setSmartScheduleOpen(true)}
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                >
                  <Wand2 className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Smart Schedule</span>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Navigation Controls - Desktop */}
        <div className="hidden flex-shrink-0 items-center gap-2 lg:flex">
          <div className="border-border bg-background flex items-center rounded-md border p-0.5">
            <Button
              onClick={() => handleNavigation("prev")}
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleNavigation("next")}
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-foreground min-w-[170px] text-center text-sm font-semibold sm:min-w-[220px]">
            {getNavigationLabel()}
          </span>

          <Button
            onClick={goToToday}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            Today
          </Button>
        </div>

        {/* Right Section: Actions + View Tabs */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 lg:flex-nowrap lg:justify-start">
          {canManage && (
            <ScheduleInsightsPanel
              canManage={canManage}
              defaultDateFrom={insightWindow.dateFrom}
              defaultDateTo={insightWindow.dateTo}
              technicians={technicians}
            />
          )}

          {/* Today Button - Month view only, show on mobile too */}
          {currentView === "month" && isMobile && (
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className="h-8 flex-shrink-0"
            >
              Today
            </Button>
          )}

          {/* View Tabs - Hide on mobile, show Week only on desktop */}
          {!isMobile && (
            <Tabs
              value={currentView}
              onValueChange={(v) => onViewChange(v as "week" | "month")}
              className="flex-shrink-0"
            >
              <TabsList className="h-8">
                <TabsTrigger
                  value="week"
                  className="hidden px-2 text-xs sm:px-3 lg:inline-flex"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="px-2 text-xs sm:px-3">
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      <AddJob
        open={open}
        onOpenChange={setOpen}
        technicians={technicians}
        scheduledJobs={scheduledJobs}
      />

      {/* Smart Schedule Panel */}
      {currentView === "month" && (
        <SmartSchedulePanel
          open={smartScheduleOpen}
          onOpenChange={setSmartScheduleOpen}
          technicians={technicians}
          currentMonth={
            currentDate
              ? startOfMonth(parse(currentDate, "yyyy-MM-dd", new Date()))
              : startOfMonth(new Date())
          }
          onScheduleCreated={() => {
            // Refresh the schedule data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

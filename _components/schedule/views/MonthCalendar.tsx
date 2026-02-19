// components/MonthCalendar.tsx
"use client";
import dynamic from "next/dynamic";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parse,
  startOfToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useState, useMemo, useEffect } from "react";
import {
  ScheduleType,
  AvailabilityType,
  TimeOffRequestType,
  DayTravelTimeSummary,
} from "../../../app/lib/typeDefinitions";
import JobDetailsModal from "../JobDetailsModal";
import { getTechnicianUnavailabilityInfo } from "../../../app/lib/utils/availabilityUtils";
import { formatTimeRange12hr } from "../../../app/lib/utils/timeFormatUtils";
import { cn, formatDateStringUTC } from "../../../app/lib/utils";
import {
  compareScheduleDisplayOrder,
  getScheduleDisplayDateKey,
} from "../../../app/lib/utils/scheduleDayUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import TravelTimeDaySummary from "../TravelTimeDaySummary";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const ScheduleMap = dynamic(() => import("../map/ScheduleMap"), {
  ssr: false,
});

export default function MonthCalendar({
  scheduledJobs,
  canManage,
  technicians,
  availability,
  showAvailability,
  timeOffRequests = [],
  onDateChange,
  initialDate,
  showDesktopHeader = true,
  travelTimeSummaries,
  isTravelTimeLoading,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  technicians: { id: string; name: string; depotAddress?: string | null }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  timeOffRequests?: TimeOffRequestType[];
  onDateChange?: (date: Date, view: "week" | "month") => void;
  initialDate?: string | null;
  showDesktopHeader?: boolean;
  travelTimeSummaries?: Map<string, DayTravelTimeSummary>;
  isTravelTimeLoading?: boolean;
}) {
  let today = startOfToday();

  // Initialize from URL if provided
  const getInitialDay = () => {
    if (initialDate) {
      const parsedDate = parse(initialDate, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return today;
  };

  const initialDay = getInitialDay();
  let [selectedDay, setSelectedDay] = useState(initialDay);
  let [currentMonth, setCurrentMonth] = useState(
    format(initialDay, "MMM-yyyy"),
  );
  let firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  // Note: Parent component uses key={currentDate} to remount this component
  // when initialDate changes, so no useEffect needed for prop syncing

  // Modal state
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayJobsModalOpen, setDayJobsModalOpen] = useState(false);
  const [dayJobsModalDate, setDayJobsModalDate] = useState<Date | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapDateKey, setMapDateKey] = useState<string | null>(null);

  // Get all days to display (including days from prev/next month to fill the grid)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(firstDayCurrentMonth, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(firstDayCurrentMonth), {
      weekStartsOn: 0,
    });
    return eachDayOfInterval({ start, end });
  }, [firstDayCurrentMonth]);

  // Simple days for mobile view (just current month)
  let days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const map: Record<string, ScheduleType[]> = {};
    scheduledJobs.forEach((job) => {
      const dateKey = getScheduleDisplayDateKey(job.startDateTime);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey]!.push(job);
    });
    // Sort jobs by time within each day
    Object.keys(map).forEach((key) => {
      map[key]!.sort((a, b) =>
        compareScheduleDisplayOrder(a.startDateTime, b.startDateTime),
      );
    });
    return map;
  }, [scheduledJobs]);

  // Group time-off requests by date
  const timeOffByDate = useMemo(() => {
    const map: Record<string, TimeOffRequestType[]> = {};
    timeOffRequests.forEach((request) => {
      // Parse dates as UTC to avoid timezone shifts
      const startDateStr =
        typeof request.startDate === "string"
          ? request.startDate.split("T")[0] || request.startDate
          : format(request.startDate, "yyyy-MM-dd");
      const endDateStr =
        typeof request.endDate === "string"
          ? request.endDate.split("T")[0] || request.endDate
          : format(request.endDate, "yyyy-MM-dd");

      // Parse as UTC dates (YYYY-MM-DD format)
      const [startYear, startMonth, startDay] = startDateStr
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);
      const startDate = new Date(
        startYear as number,
        (startMonth as number) - 1,
        startDay as number,
      );
      const endDate = new Date(
        endYear as number,
        (endMonth as number) - 1,
        endDay as number,
      );

      // Add request to all days in the range (inclusive of both start and end)
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, "yyyy-MM-dd");
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey]!.push(request);
        currentDate = add(currentDate, { days: 1 });
      }
    });
    return map;
  }, [timeOffRequests]);

  function previousMonth() {
    let firstDayPrevMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayPrevMonth, "MMM-yyyy"));
    onDateChange?.(firstDayPrevMonth, "month");
  }

  function nextMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    onDateChange?.(firstDayNextMonth, "month");
  }

  let selectedDayJobs = scheduledJobs
    .filter(
      (job) =>
        getScheduleDisplayDateKey(job.startDateTime) ===
        format(selectedDay, "yyyy-MM-dd"),
    )
    .sort((a, b) =>
      compareScheduleDisplayOrder(a.startDateTime, b.startDateTime),
    );

  // Get time-off requests for selected day
  const selectedDayTimeOff = useMemo(() => {
    const dateKey = format(selectedDay, "yyyy-MM-dd");
    return timeOffByDate[dateKey] || [];
  }, [timeOffByDate, selectedDay]);

  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
    onDateChange?.(day, "month");
  };

  const handleJobClick = (job: ScheduleType) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleShowMap = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    if ((jobsByDate[dateKey] || []).length === 0) return;
    setMapDateKey(dateKey);
    setIsMapOpen(true);
  };

  const openDayJobsModal = (day: Date) => {
    setDayJobsModalDate(day);
    setDayJobsModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      // Clear selectedJob after animation completes
      setTimeout(() => setSelectedJob(null), 150);
    }
  };

  // Sync state with URL params
  useEffect(() => {
    const syncStateWithURL = () => {
      const params = new URLSearchParams(window.location.search);
      const urlDate = params.get("date");
      if (urlDate) {
        const parsedDate = parse(urlDate, "yyyy-MM-dd", new Date());
        if (isValid(parsedDate)) {
          setSelectedDay(parsedDate);
          setCurrentMonth(format(parsedDate, "MMM-yyyy"));
        }
      }
    };
    syncStateWithURL();
    const handlePopState = () => syncStateWithURL();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const selectedDayKey = format(selectedDay, "yyyy-MM-dd");
  const mapDate = mapDateKey
    ? parse(mapDateKey, "yyyy-MM-dd", new Date())
    : null;
  const mapJobs = mapDateKey ? jobsByDate[mapDateKey] || [] : [];
  const mapSummary = mapDateKey
    ? travelTimeSummaries?.get(mapDateKey)
    : undefined;
  const depotAddress =
    technicians.find((tech) => tech.depotAddress)?.depotAddress ?? null;

  return (
    <>
      {/* DESKTOP VIEW - Full calendar with events on days */}
      <div className="hidden h-full lg:block">
        <CardContent className="flex h-full flex-col p-4">
          {/* Desktop month nav can be rendered by parent header for a single connected control strip */}
          {showDesktopHeader && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-xl font-bold">
                {format(firstDayCurrentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  onClick={previousMonth}
                  variant="ghost"
                  size="icon"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={nextMonth}
                  type="button"
                  variant="ghost"
                  size="icon"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Weekday headers */}
          <div
            className={cn(
              "text-muted-foreground border-border grid grid-cols-7 border-b text-center text-xs font-semibold",
              showDesktopHeader ? "mb-1 pb-2" : "mb-2 py-2",
            )}
          >
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-border/50 grid flex-1 auto-rows-fr grid-cols-7 gap-px overflow-hidden rounded-lg">
            {calendarDays.map((day, dayIdx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayJobs = jobsByDate[dateKey] || [];
              const dayTimeOff = timeOffByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);
              const isTodayDate = isToday(day);

              // Get unavailability info for this day
              const unavailabilityInfoList = technicians
                .map((tech) => ({
                  tech,
                  info: getTechnicianUnavailabilityInfo(
                    availability,
                    tech.id,
                    day,
                  ),
                }))
                .filter((item) => item.info.isUnavailable === true);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "bg-card relative flex min-h-[100px] flex-col p-1",
                    !isCurrentMonth && "bg-muted/30",
                  )}
                >
                  {/* Day number */}
                  <button
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    className={cn(
                      "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isTodayDate &&
                        "bg-primary text-primary-foreground",
                      !isTodayDate &&
                        isCurrentMonth &&
                        "text-foreground hover:bg-muted",
                      !isCurrentMonth && "text-muted-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </button>

                  {/* Job count + travel time badges */}
                  {dayJobs.length > 0 && (
                    <div className="absolute right-1 bottom-1 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-5 w-5"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleShowMap(day);
                        }}
                        aria-label={`Open route map for ${format(day, "MMM d, yyyy")}`}
                      >
                        <MapPin className="h-3 w-3" />
                      </Button>
                      <TravelTimeDaySummary
                        summary={travelTimeSummaries?.get(dateKey)}
                        isLoading={isTravelTimeLoading}
                      />
                      <Badge
                        variant="secondary"
                        className="h-4 min-w-[16px] px-1 text-[9px] font-medium"
                      >
                        {dayJobs.length}
                      </Badge>
                    </div>
                  )}

                  {/* Indicator dots - top-right corner */}
                  <div className="absolute top-1 right-1 flex items-center gap-1">
                    {/* Unavailability dot (red) */}
                    {unavailabilityInfoList.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <div className="bg-destructive h-2.5 w-2.5 animate-pulse rounded-full shadow-sm" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            <div className="font-semibold">Unavailability</div>
                            {unavailabilityInfoList.map(({ tech, info }) => (
                              <div key={tech.id}>
                                <div className="font-medium">{tech.name}</div>
                                <div className="text-muted-foreground">
                                  {info.type === "full-day"
                                    ? "All day"
                                    : formatTimeRange12hr(
                                        info.startTime || "00:00",
                                        info.endTime || "23:59",
                                      )}
                                </div>
                                {info.reason && (
                                  <div className="text-muted-foreground">
                                    {info.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Time-off dot (blue) */}
                    {dayTimeOff.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500 shadow-sm" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            <div className="font-semibold">Time Off</div>
                            {dayTimeOff.map((request) => {
                              const technician = technicians.find(
                                (t) => t.id === request.technicianId,
                              );
                              const startDateStr =
                                typeof request.startDate === "string"
                                  ? request.startDate.split("T")[0] ||
                                    request.startDate
                                  : format(request.startDate, "yyyy-MM-dd");
                              const endDateStr =
                                typeof request.endDate === "string"
                                  ? request.endDate.split("T")[0] ||
                                    request.endDate
                                  : format(request.endDate, "yyyy-MM-dd");
                              const startDate =
                                formatDateStringUTC(startDateStr);
                              const endDate = formatDateStringUTC(endDateStr);
                              return (
                                <div key={request._id as string}>
                                  <div className="font-medium">
                                    {technician?.name || "Unknown"}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {startDate === endDate
                                      ? startDate
                                      : `${startDate} - ${endDate}`}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {request.reason}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Jobs for this day */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayJobs.slice(0, 3).map((job) => {
                      const color = job.confirmed
                        ? {
                            bg: "bg-green-500/20",
                            border: "border-l-green-500",
                            text: "text-green-700 dark:text-green-400",
                          }
                        : {
                            bg: "bg-destructive/20",
                            border: "border-l-destructive",
                            text: "text-destructive",
                          };
                      return (
                        <button
                          key={job._id as string}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJobClick(job);
                          }}
                          className={cn(
                            "flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded border-l-2 px-1.5 py-0.5 text-left text-[11px] transition-opacity hover:opacity-80",
                            color.bg,
                            color.border,
                          )}
                        >
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate font-medium",
                              color.text,
                            )}
                          >
                            {job.jobTitle}
                          </span>
                          <span className="text-muted-foreground flex-shrink-0 text-[10px]">
                            {format(new Date(job.startDateTime), "h:mm a")}
                          </span>
                        </button>
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDayJobsModal(day);
                        }}
                        className="text-muted-foreground hover:text-foreground w-full px-1.5 py-0.5 text-left text-[10px]"
                      >
                        +{dayJobs.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>

      {/* MOBILE VIEW - Original compact view with selected day jobs list */}
      <CardContent className="min-w-0 px-2 py-3 sm:px-4 sm:py-4 md:py-6 lg:hidden">
        <div className="w-full min-w-0">
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-foreground text-base font-bold sm:text-lg md:text-xl">
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    onClick={previousMonth}
                    variant="ghost"
                    size="icon"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <Button
                    onClick={nextMonth}
                    type="button"
                    variant="ghost"
                    size="icon"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>
              </div>
              <div className="text-muted-foreground grid grid-cols-7 text-center text-xs leading-6 font-semibold">
                <div className="py-2">S</div>
                <div className="py-2">M</div>
                <div className="py-2">T</div>
                <div className="py-2">W</div>
                <div className="py-2">T</div>
                <div className="py-2">F</div>
                <div className="py-2">S</div>
              </div>
              <div className="bg-muted mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-lg text-sm shadow-sm">
                {days.map((day, dayIdx) => {
                  const jobCount = scheduledJobs.filter((job) =>
                    isSameDay(new Date(job.startDateTime), day),
                  ).length;

                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayTimeOff = timeOffByDate[dateKey] || [];
                  const timeOffCount = dayTimeOff.length;

                  // Availability is always shown
                  const unavailabilityInfoList = technicians
                    .map((tech) => ({
                      tech,
                      info: getTechnicianUnavailabilityInfo(
                        availability,
                        tech.id,
                        day,
                      ),
                    }))
                    .filter((item) => item.info.isUnavailable === true);

                  const tooltipText = unavailabilityInfoList
                    .map((item) => `${item.tech.name}: ${item.info.reason}`)
                    .join("\n");

                  return (
                    <div
                      key={day.toString()}
                      className={classNames(
                        dayIdx === 0 && colStartClasses[getDay(day)],
                        "bg-card relative",
                      )}
                      title={tooltipText || undefined}
                    >
                      <button
                        type="button"
                        onClick={() => handleDaySelect(day)}
                        className={classNames(
                          "group relative flex w-full touch-manipulation flex-col items-center justify-start py-1.5 transition-all duration-200 sm:py-2 md:py-3",
                          isToday(day) &&
                            "text-primary font-semibold",
                          !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            "text-foreground",
                          !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            "text-muted-foreground",
                          !isToday(day) && "hover:bg-muted",
                        )}
                      >
                        <time
                          dateTime={format(day, "yyyy-MM-dd")}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm md:h-7 md:w-7 md:text-base"
                        >
                          {format(day, "d")}
                        </time>

                        {jobCount > 0 && (
                          <div className="mt-0.5">
                            <Badge
                              variant={isToday(day) ? "default" : "secondary"}
                              className="h-[14px] min-w-[14px] px-1 text-[8px] font-medium sm:h-[16px] sm:min-w-[16px] sm:text-[9px]"
                            >
                              {jobCount}
                            </Badge>
                          </div>
                        )}

                        {/* Indicator dots - top-right corner */}
                        <div className="absolute top-1 right-1 flex items-center gap-0.5 sm:top-2 sm:right-2 sm:gap-1">
                          {/* Unavailability dot (red) */}
                          {unavailabilityInfoList.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <div className="bg-destructive h-2 w-2 animate-pulse rounded-full shadow-sm sm:h-2.5 sm:w-2.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2 text-xs">
                                  <div className="font-semibold">
                                    Unavailability
                                  </div>
                                  {unavailabilityInfoList.map(
                                    ({ tech, info }) => (
                                      <div key={tech.id}>
                                        <div className="font-medium">
                                          {tech.name}
                                        </div>
                                        <div className="text-muted-foreground">
                                          {info.type === "full-day"
                                            ? "All day"
                                            : formatTimeRange12hr(
                                                info.startTime || "00:00",
                                                info.endTime || "23:59",
                                              )}
                                        </div>
                                        {info.reason && (
                                          <div className="text-muted-foreground">
                                            {info.reason}
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Time-off dot (blue) */}
                          {timeOffCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 shadow-sm sm:h-2.5 sm:w-2.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2 text-xs">
                                  <div className="font-semibold">Time Off</div>
                                  {dayTimeOff.map((request) => {
                                    const technician = technicians.find(
                                      (t) => t.id === request.technicianId,
                                    );
                                    const startDateStr =
                                      typeof request.startDate === "string"
                                        ? request.startDate.split("T")[0] ||
                                          request.startDate
                                        : format(
                                            request.startDate,
                                            "yyyy-MM-dd",
                                          );
                                    const endDateStr =
                                      typeof request.endDate === "string"
                                        ? request.endDate.split("T")[0] ||
                                          request.endDate
                                        : format(request.endDate, "yyyy-MM-dd");
                                    const startDate =
                                      formatDateStringUTC(startDateStr);
                                    const endDate =
                                      formatDateStringUTC(endDateStr);
                                    return (
                                      <div key={request._id as string}>
                                        <div className="font-medium">
                                          {technician?.name || "Unknown"}
                                        </div>
                                        <div className="text-muted-foreground">
                                          {startDate === endDate
                                            ? startDate
                                            : `${startDate} - ${endDate}`}
                                        </div>
                                        <div className="text-muted-foreground">
                                          {request.reason}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {isToday(day) && (
                          <div className="border-primary pointer-events-none absolute inset-0 rounded-lg border-2"></div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Jobs List - Mobile */}
            <section className="min-w-0">
              <div className="sticky top-0 z-20 min-w-0 overflow-hidden">
                {(() => {
                  // Availability is always shown
                  const dayUnavailability = technicians
                    .map((tech) => ({
                      tech,
                      info: getTechnicianUnavailabilityInfo(
                        availability,
                        tech.id,
                        selectedDay,
                      ),
                    }))
                    .filter((item) => item.info.isUnavailable === true);

                  return dayUnavailability.length > 0 ? (
                    <Card className="border-l-destructive bg-destructive/10 mb-3 border-l-4">
                      <CardContent className="p-3">
                        <h3 className="text-destructive-foreground mb-2 text-xs font-semibold">
                          ⚠️ Unavailability
                        </h3>
                        <div className="space-y-1">
                          {dayUnavailability.map(({ tech, info }) => (
                            <div
                              key={tech.id}
                              className="text-destructive-foreground text-xs"
                            >
                              <span className="font-medium">{tech.name}</span>
                              {info.type === "full-day" ? (
                                <span className="text-destructive/80 ml-2">
                                  - All day
                                </span>
                              ) : (
                                <span className="text-destructive/80 ml-2">
                                  -{" "}
                                  {formatTimeRange12hr(
                                    info.startTime || "00:00",
                                    info.endTime || "23:59",
                                  )}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                <div className="bg-card border-border mb-3 border-b pb-3">
                  <h2 className="text-foreground flex items-center justify-between gap-2 text-sm font-semibold">
                    <span>
                      Schedule for{" "}
                      <time
                        dateTime={format(selectedDay, "yyyy-MM-dd")}
                        className="text-primary"
                      >
                        {format(selectedDay, "MMM dd, yyyy")}
                      </time>
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedDayJobs.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-6 w-6"
                          onClick={() => handleShowMap(selectedDay)}
                          aria-label={`Open route map for ${format(selectedDay, "MMM d, yyyy")}`}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {selectedDayJobs.length > 0 && (
                        <TravelTimeDaySummary
                          summary={travelTimeSummaries?.get(selectedDayKey)}
                          isLoading={isTravelTimeLoading}
                        />
                      )}
                      {selectedDayJobs.length > 0 && (
                        <Badge variant="default">
                          {selectedDayJobs.length}{" "}
                          {selectedDayJobs.length === 1 ? "job" : "jobs"}
                        </Badge>
                      )}
                    </div>
                  </h2>
                </div>
              </div>

              {/* Time-off requests for selected day */}
              {selectedDayTimeOff.length > 0 && (
                <Card className="mb-3 border-l-4 border-l-blue-500 bg-blue-500/10">
                  <CardContent className="p-3">
                    <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <CalendarDays className="h-4 w-4" />
                      Time Off
                    </h3>
                    <div className="space-y-1">
                      {selectedDayTimeOff.map((request) => {
                        const technician = technicians.find(
                          (tech) => tech.id === request.technicianId,
                        );
                        // Format dates using UTC to avoid timezone issues
                        const startDateStr =
                          typeof request.startDate === "string"
                            ? request.startDate.split("T")[0] ||
                              request.startDate
                            : format(request.startDate, "yyyy-MM-dd");
                        const endDateStr =
                          typeof request.endDate === "string"
                            ? request.endDate.split("T")[0] || request.endDate
                            : format(request.endDate, "yyyy-MM-dd");
                        const startDate = formatDateStringUTC(startDateStr);
                        const endDate = formatDateStringUTC(endDateStr);
                        return (
                          <div
                            key={request._id as string}
                            className="text-xs text-blue-600 dark:text-blue-400"
                          >
                            <span className="font-medium">
                              {technician?.name || "Unknown"}
                            </span>
                            <span className="ml-2 text-blue-500/80">
                              {startDate === endDate
                                ? startDate
                                : `${startDate} - ${endDate}`}
                            </span>
                            <div className="mt-0.5 ml-0 text-blue-500/80">
                              - {request.reason}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <ul className="flex min-w-0 flex-col gap-2 overflow-hidden sm:gap-3">
                {selectedDayJobs.length > 0 ? (
                  selectedDayJobs.map((job) => (
                    <Job
                      job={job}
                      key={job._id as string}
                      technicians={technicians}
                      onJobClick={handleJobClick}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <svg
                      className="text-muted-foreground mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <p className="text-muted-foreground mt-2 text-sm">
                      No jobs scheduled for this day
                    </p>
                  </div>
                )}
              </ul>
            </section>
          </div>
        </div>
      </CardContent>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canManage={canManage}
        technicians={technicians}
      />

      {/* Route Map Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-[95vw] overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="border-border border-b px-4 py-3">
            <DialogTitle className="text-base">
              Route Map
              {mapDate ? ` - ${format(mapDate, "EEEE, MMM d")}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-3">
            <ScheduleMap
              jobs={mapJobs}
              summary={mapSummary}
              technicians={technicians}
              depotAddress={depotAddress}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Jobs Modal (desktop "more" list) */}
      <Dialog open={dayJobsModalOpen} onOpenChange={setDayJobsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {dayJobsModalDate
                  ? `Schedule for ${format(dayJobsModalDate, "MMM dd, yyyy")}`
                  : "Schedule"}
              </span>
              <div className="flex items-center gap-2">
                {dayJobsModalDate && (
                  <TravelTimeDaySummary
                    summary={travelTimeSummaries?.get(
                      format(dayJobsModalDate, "yyyy-MM-dd"),
                    )}
                    isLoading={isTravelTimeLoading}
                  />
                )}
                {dayJobsModalDate && (
                  <Badge variant="secondary">
                    {
                      (jobsByDate[format(dayJobsModalDate, "yyyy-MM-dd")] || [])
                        .length
                    }{" "}
                    jobs
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <ul className="flex flex-col gap-2">
              {(dayJobsModalDate
                ? jobsByDate[format(dayJobsModalDate, "yyyy-MM-dd")] || []
                : []
              ).map((job) => (
                <Job
                  key={job._id as string}
                  job={job}
                  technicians={technicians}
                  onJobClick={(selected) => {
                    setDayJobsModalOpen(false);
                    handleJobClick(selected);
                  }}
                />
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Job({
  job,
  technicians,
  onJobClick,
}: {
  job: ScheduleType;
  technicians: { id: string; name: string }[];
  onJobClick?: (job: ScheduleType) => void;
}) {
  const startDateTime = new Date(job.startDateTime);

  const techNames = useMemo(() => {
    return job.assignedTechnicians.map(
      (techId) =>
        technicians.find((tech) => tech.id === techId)?.name.split(" ")[0] ||
        "Unknown",
    );
  }, [job.assignedTechnicians, technicians]);

  const statusClasses = job.confirmed
    ? "bg-job-confirmed-bg hover:bg-job-confirmed-hover border-l-2 border-job-confirmed"
    : "bg-destructive/10 hover:bg-destructive/20 border-l-2 border-destructive";

  return (
    <li
      className={cn(
        "min-w-0 cursor-pointer rounded-md px-3 py-2.5 transition-colors",
        statusClasses,
      )}
      onClick={() => onJobClick?.(job)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-foreground truncate text-sm leading-tight font-medium">
          {job.jobTitle}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {job.location}
        </span>
        <span className="text-muted-foreground text-xs font-medium">
          {format(startDateTime, "h:mm a")}
        </span>
        {techNames.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {techNames.slice(0, 3).map((tech, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="h-4 px-1.5 text-[10px]"
              >
                {tech}
              </Badge>
            ))}
            {techNames.length > 3 && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                +{techNames.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

let colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

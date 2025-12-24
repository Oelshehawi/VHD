// components/MonthCalendar.tsx
"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { useState, useEffect, useMemo } from "react";
import {
  ScheduleType,
  AvailabilityType,
} from "../../../app/lib/typeDefinitions";
import JobDetailsModal from "../JobDetailsModal";
import { getTechnicianUnavailabilityInfo } from "../../../app/lib/utils/availabilityUtils";
import { formatTimeRange12hr } from "../../../app/lib/utils/timeFormatUtils";
import { cn } from "../../../app/lib/utils";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function MonthCalendar({
  scheduledJobs,
  canManage,
  technicians,
  availability,
  showAvailability,
  onDateChange,
  initialDate,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  onDateChange?: (date: Date, view: "week" | "month") => void;
  initialDate?: string | null;
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

  // Update state when initialDate prop changes
  useEffect(() => {
    if (initialDate) {
      const parsedDate = parse(initialDate, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        setSelectedDay(parsedDate);
        setCurrentMonth(format(parsedDate, "MMM-yyyy"));
      }
    }
  }, [initialDate]);

  // Modal state
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const dateKey = format(new Date(job.startDateTime), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey]!.push(job);
    });
    // Sort jobs by time within each day
    Object.keys(map).forEach((key) => {
      map[key]!.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      );
    });
    return map;
  }, [scheduledJobs]);

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
    .filter((job) => isSameDay(new Date(job.startDateTime), selectedDay))
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );

  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
    onDateChange?.(day, "month");
  };

  const handleJobClick = (job: ScheduleType) => {
    setSelectedJob(job);
    setIsModalOpen(true);
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

  return (
    <>
      {/* DESKTOP VIEW - Full calendar with events on days */}
      <div className="hidden h-full lg:block">
        <CardContent className="flex h-full flex-col p-4">
          {/* Header */}
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

          {/* Weekday headers */}
          <div className="text-muted-foreground border-border mb-1 grid grid-cols-7 border-b pb-2 text-center text-xs font-semibold">
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
              const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);
              const isSelected = isEqual(day, selectedDay);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "bg-card flex min-h-[100px] flex-col p-1",
                    !isCurrentMonth && "bg-muted/30",
                  )}
                >
                  {/* Day number */}
                  <button
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    className={cn(
                      "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isSelected && "bg-foreground text-background",
                      !isSelected &&
                        isTodayDate &&
                        "bg-primary text-primary-foreground",
                      !isSelected &&
                        !isTodayDate &&
                        isCurrentMonth &&
                        "text-foreground hover:bg-muted",
                      !isCurrentMonth && "text-muted-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </button>

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
                        onClick={() => handleDaySelect(day)}
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

                  const unavailabilityInfoList = showAvailability
                    ? technicians
                        .map((tech) => ({
                          tech,
                          info: getTechnicianUnavailabilityInfo(
                            availability,
                            tech.id,
                            day,
                          ),
                        }))
                        .filter((item) => item.info.isUnavailable === true)
                    : [];

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
                          isEqual(day, selectedDay) && "text-background z-10",
                          !isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "text-primary font-bold",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            "text-foreground",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            "text-muted-foreground",
                          isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "bg-primary shadow-lg",
                          isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            "bg-foreground shadow-lg",
                          !isEqual(day, selectedDay) && "hover:bg-muted",
                          (isEqual(day, selectedDay) || isToday(day)) &&
                            "font-semibold",
                          showAvailability &&
                            unavailabilityInfoList.length > 0 &&
                            !isEqual(day, selectedDay) &&
                            "border-destructive hover:bg-destructive/10 border-2",
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
                              variant={
                                isEqual(day, selectedDay)
                                  ? "secondary"
                                  : isToday(day)
                                    ? "default"
                                    : "secondary"
                              }
                              className={classNames(
                                "h-[14px] min-w-[14px] px-1 text-[8px] font-medium sm:h-[16px] sm:min-w-[16px] sm:text-[9px]",
                                isEqual(day, selectedDay) &&
                                  "bg-primary-foreground/30 text-primary-foreground",
                              )}
                            >
                              {jobCount}
                            </Badge>
                          </div>
                        )}

                        {showAvailability &&
                          unavailabilityInfoList.length > 0 && (
                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                              <div className="bg-destructive h-2 w-2 rounded-full shadow-sm sm:h-2.5 sm:w-2.5" />
                            </div>
                          )}

                        {isToday(day) && !isEqual(day, selectedDay) && (
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
                {showAvailability &&
                  (() => {
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
                    {selectedDayJobs.length > 0 && (
                      <Badge variant="default">
                        {selectedDayJobs.length}{" "}
                        {selectedDayJobs.length === 1 ? "job" : "jobs"}
                      </Badge>
                    )}
                  </h2>
                </div>
              </div>
              <ul className="flex min-w-0 flex-col gap-2 overflow-hidden sm:gap-3">
                {selectedDayJobs.length > 0 ? (
                  selectedDayJobs.map((job) => (
                    <Job
                      job={job}
                      key={job._id as string}
                      canManage={canManage}
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
    </>
  );
}

export function Job({
  job,
  technicians,
  onJobClick,
}: {
  job: ScheduleType;
  canManage: boolean;
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

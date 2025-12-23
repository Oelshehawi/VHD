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
} from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { ScheduleType, InvoiceType, AvailabilityType } from "../../../app/lib/typeDefinitions";
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
  invoices: InvoiceType[];
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
  let [currentMonth, setCurrentMonth] = useState(format(initialDay, "MMM-yyyy"));
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

  let days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    let firstDayPrevMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayPrevMonth, "MMM-yyyy"));
    // Update URL instantly with first day of previous month
    onDateChange?.(firstDayPrevMonth, "month");
  }

  function nextMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    // Update URL instantly with first day of next month
    onDateChange?.(firstDayNextMonth, "month");
  }

  let selectedDayJobs = scheduledJobs
    .filter((job) => isSameDay(new Date(job.startDateTime), selectedDay))
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );

  // Handle day selection
  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
    // Update URL instantly with selected day
    onDateChange?.(day, "month");
  };

  // Handle job click to open modal
  const handleJobClick = (job: ScheduleType) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  // Sync state with URL params (both on mount and popstate events)
  useEffect(() => {
    const syncStateWithURL = () => {
      // Get current URL params
      const params = new URLSearchParams(window.location.search);
      const urlDate = params.get("date");

      // Update date/month state
      if (urlDate) {
        const parsedDate = parse(urlDate, "yyyy-MM-dd", new Date());

        if (isValid(parsedDate)) {
          setSelectedDay(parsedDate);
          setCurrentMonth(format(parsedDate, "MMM-yyyy"));
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

  return (
    <>
      <CardContent className="py-3 px-2 sm:py-4 sm:px-4 md:py-6">
        <div className="mx-auto max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-border lg:gap-0">
            <div className="lg:pr-8 xl:pr-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-foreground sm:text-lg md:text-xl">
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    onClick={previousMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </Button>
                  <Button
                    onClick={nextMonth}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div className="mt-6 md:mt-10 grid grid-cols-7 text-center text-xs leading-6 text-muted-foreground font-semibold">
                <div className="py-2">S</div>
                <div className="py-2">M</div>
                <div className="py-2">T</div>
                <div className="py-2">W</div>
                <div className="py-2">T</div>
                <div className="py-2">F</div>
                <div className="py-2">S</div>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-px text-sm bg-muted rounded-lg overflow-hidden shadow-sm">
                {days.map((day, dayIdx) => {
                  const jobCount = scheduledJobs.filter((job) =>
                    isSameDay(new Date(job.startDateTime), day)
                  ).length;

                  // Get unavailability info for the day
                  const unavailabilityInfoList = showAvailability
                    ? technicians
                        .map(tech => ({
                          tech,
                          info: getTechnicianUnavailabilityInfo(availability, tech.id, day)
                        }))
                        .filter(item => item.info.isUnavailable === true)
                    : [];

                  const tooltipText = unavailabilityInfoList
                    .map(item => `${item.tech.name}: ${item.info.reason}`)
                    .join('\n');

                  return (
                    <div
                      key={day.toString()}
                      className={classNames(
                        dayIdx === 0 && colStartClasses[getDay(day)],
                        "relative bg-card",
                      )}
                      title={tooltipText || undefined}
                    >
                      <button
                        type="button"
                        onClick={() => handleDaySelect(day)}
                        className={classNames(
                          "group relative w-full py-2 sm:py-3 md:py-4 transition-all duration-200 touch-manipulation",
                          isEqual(day, selectedDay) && "text-primary-foreground z-10",
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
                          showAvailability && unavailabilityInfoList.length > 0 && !isEqual(day, selectedDay) &&
                            "border-2 border-destructive hover:bg-destructive/10",
                        )}
                      >
                        {/* Date number */}
                        <time
                          dateTime={format(day, "yyyy-MM-dd")}
                          className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 items-center justify-center mx-auto rounded-full text-xs sm:text-sm md:text-base"
                        >
                          {format(day, "d")}
                        </time>

                        {/* Job count badge */}
                        {jobCount > 0 && (
                          <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2">
                            <Badge
                              variant={isEqual(day, selectedDay) ? "secondary" : isToday(day) ? "default" : "secondary"}
                              className={classNames(
                                "text-[9px] sm:text-[10px] font-medium min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1",
                                isEqual(day, selectedDay) && "bg-primary-foreground/30 text-primary-foreground"
                              )}
                            >
                              {jobCount}
                            </Badge>
                          </div>
                        )}

                        {/* Unavailability indicator dot */}
                        {showAvailability && unavailabilityInfoList.length > 0 && (
                          <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-destructive shadow-sm" />
                          </div>
                        )}

                        {/* Today indicator ring */}
                        {isToday(day) && !isEqual(day, selectedDay) && (
                          <div className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"></div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <section className="max-h-[60vh] overflow-y-auto lg:mt-0 lg:max-h-none lg:pl-8 xl:pl-14 pb-4">
              {/* Sticky Container for Banner and Header */}
              <div className="sticky top-0 z-20">
                {/* Unavailability Banner */}
                {showAvailability && (() => {
                  const dayUnavailability = technicians
                    .map(tech => ({
                      tech,
                      info: getTechnicianUnavailabilityInfo(availability, tech.id, selectedDay)
                    }))
                    .filter(item => item.info.isUnavailable === true);

                  return dayUnavailability.length > 0 ? (
                    <Card className="mb-3 border-l-4 border-l-destructive bg-destructive/10">
                      <CardContent className="p-3">
                        <h3 className="text-xs font-semibold text-destructive-foreground mb-2">⚠️ Unavailability</h3>
                        <div className="space-y-1">
                          {dayUnavailability.map(({ tech, info }) => (
                            <div key={tech.id} className="text-xs text-destructive-foreground">
                              <span className="font-medium">{tech.name}</span>
                              {info.type === "full-day" ? (
                                <span className="ml-2 text-destructive/80">- All day</span>
                              ) : (
                                <span className="ml-2 text-destructive/80">
                                  - {formatTimeRange12hr(info.startTime || "00:00", info.endTime || "23:59")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                <div className="bg-card pb-3 mb-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground sm:text-base md:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="flex-1">
                    Schedule for{" "}
                    <time dateTime={format(selectedDay, "yyyy-MM-dd")} className="text-primary block sm:inline mt-1 sm:mt-0">
                      {format(selectedDay, "MMM dd, yyyy")}
                    </time>
                  </span>
                  {selectedDayJobs.length > 0 && (
                    <Badge variant="default" className="self-start sm:self-auto">
                      {selectedDayJobs.length} {selectedDayJobs.length === 1 ? 'job' : 'jobs'}
                    </Badge>
                  )}
                </h2>
              </div>
              </div>
              <ul className="flex flex-col gap-2 sm:gap-3">
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
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-muted-foreground">No jobs scheduled for this day</p>
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
        onClose={handleCloseModal}
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

  // Memoize technician names
  const techNames = useMemo(() => {
    return job.assignedTechnicians.map(
      (techId) =>
        technicians.find((tech) => tech.id === techId)?.name.split(" ")[0] || "Unknown"
    );
  }, [job.assignedTechnicians, technicians]);

  // Status-based styling (matching JobItem pattern)
  const statusClasses = job.confirmed
    ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-l-2 border-emerald-500"
    : "bg-destructive/10 hover:bg-destructive/20 border-l-2 border-destructive";

  return (
    <li
      className={cn(
        "rounded-md px-3 py-2.5 cursor-pointer transition-colors",
        statusClasses
      )}
      onClick={() => onJobClick?.(job)}
    >
      <div className="flex flex-col gap-1">
        {/* Job Title */}
        <span className="text-sm font-medium text-foreground leading-tight">
          {job.jobTitle}
        </span>

        {/* Location */}
        <span className="text-xs text-muted-foreground truncate">
          {job.location}
        </span>

        {/* Time */}
        <span className="text-xs font-medium text-muted-foreground">
          {format(startDateTime, "h:mm a")}
        </span>

        {/* Technician Pills */}
        {techNames.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {techNames.slice(0, 3).map((tech, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {tech}
              </Badge>
            ))}
            {techNames.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4"
              >
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


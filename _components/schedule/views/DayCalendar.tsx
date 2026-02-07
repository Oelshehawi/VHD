"use client";
import { useMemo, useState } from "react";
import { format, isToday, isSameDay, startOfDay, parseISO } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { getTechnicianUnavailabilityInfo } from "../../../app/lib/utils/availabilityUtils";
import { formatTimeRange12hr } from "../../../app/lib/utils/timeFormatUtils";
import { formatDateStringUTC } from "../../../app/lib/utils";
import {
  ScheduleType,
  InvoiceType,
  AvailabilityType,
  TimeOffRequestType,
} from "../../../app/lib/typeDefinitions";
import CalendarColumn from "../CalendarColumn";
import { Calendar } from "../../ui/calendar";
import { Badge } from "../../ui/badge";
import { cn } from "../../../app/lib/utils";
import JobDetailsModal from "../JobDetailsModal";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DayCalendarProps {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentDay: Date;
  holidays: any;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  timeOffRequests?: TimeOffRequestType[];
  onDateSelect?: (date: Date | undefined) => void;
}

const DayCalendar = ({
  scheduledJobs,
  canManage,
  currentDay,
  holidays,
  technicians,
  availability,
  showAvailability,
  timeOffRequests = [],
  onDateSelect,
}: DayCalendarProps) => {
  // Modal state
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group jobs by date with optimized performance
  const selectedDayJobsMap = useMemo(() => {
    const jobsMap: { [key: string]: ScheduleType[] } = {};

    scheduledJobs.forEach((job) => {
      const jobDate = new Date(job.startDateTime);
      const jobDateKey = format(jobDate, "yyyy-MM-dd");

      if (!jobsMap[jobDateKey]) {
        jobsMap[jobDateKey] = [];
      }

      (jobsMap[jobDateKey] as ScheduleType[]).push(job);
    });

    // Sort jobs by time within each day
    Object.keys(jobsMap).forEach((dateKey) => {
      (jobsMap[dateKey] as ScheduleType[]).sort((a, b) => {
        const timeA = new Date(a.startDateTime).getTime();
        const timeB = new Date(b.startDateTime).getTime();
        return timeA - timeB;
      });
    });

    return jobsMap;
  }, [scheduledJobs]);

  const selectedDayJobs = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return selectedDayJobsMap[dayKey] || [];
  };

  // Get dates that have jobs for the calendar indicator
  const datesWithJobs = useMemo(() => {
    return new Set(Object.keys(selectedDayJobsMap));
  }, [selectedDayJobsMap]);

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

  const currentDayJobs = selectedDayJobs(currentDay);

  // Get time-off requests for the current day
  const currentDayTimeOff = useMemo(() => {
    const dayKey = format(currentDay, "yyyy-MM-dd");
    return timeOffRequests.filter((request) => {
      // Parse dates as UTC to avoid timezone shifts
      const startDateStr =
        typeof request.startDate === "string"
          ? request.startDate.split("T")[0] || request.startDate
          : format(request.startDate, "yyyy-MM-dd");
      const endDateStr =
        typeof request.endDate === "string"
          ? request.endDate.split("T")[0] || request.endDate
          : format(request.endDate, "yyyy-MM-dd");
      return dayKey >= startDateStr && dayKey <= endDateStr;
    });
  }, [timeOffRequests, currentDay]);

  // Get availability/unavailability info for the current day (always shown)
  const dayAvailability = useMemo(() => {
    return technicians
      .map((tech) => ({
        tech,
        info: getTechnicianUnavailabilityInfo(
          availability,
          tech.id,
          currentDay,
        ),
      }))
      .filter((item) => item.info.isUnavailable);
  }, [technicians, availability, currentDay]);

  return (
    <>
      <div className="h-full">
        <div className="bg-card flex h-full flex-col">
          {/* Desktop: Grid with sidebar on RIGHT | Mobile: Single column */}
          <div className="flex flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_260px]">
            {/* Main calendar grid */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-muted/50 border-border flex-none border-b">
                <div className="bg-card flex">
                  {/* Time axis label */}
                  <div className="bg-muted/50 border-border flex w-12 flex-none items-center justify-center border-r py-2 sm:w-16 sm:py-3 md:w-20 md:py-4">
                    <span className="text-muted-foreground hidden text-[10px] font-medium tracking-wide uppercase sm:inline sm:text-xs">
                      Time
                    </span>
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase sm:hidden">
                      T
                    </span>
                  </div>

                  {/* Day header */}
                  <div
                    className={`relative flex flex-1 flex-col items-center py-2 transition-colors sm:py-3 md:py-4 ${
                      isToday(currentDay)
                        ? "bg-primary/10 border-primary border-r-2 border-l-2"
                        : "bg-card hover:bg-muted/50"
                    }`}
                  >
                    {/* Day name */}
                    <span
                      className={`text-[10px] font-semibold tracking-wide sm:text-xs md:text-sm ${
                        isToday(currentDay)
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(currentDay, "EEEE")}
                    </span>

                    {/* Date */}
                    <span
                      className={`mt-0.5 text-lg font-bold sm:mt-1 sm:text-xl md:text-2xl ${
                        isToday(currentDay) ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {format(currentDay, "d")}
                    </span>

                    {/* Today indicator */}
                    {isToday(currentDay) && (
                      <div className="bg-primary absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full"></div>
                    )}

                    {/* Job count indicator */}
                    {currentDayJobs.length > 0 && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium sm:h-5 sm:w-5 sm:text-xs ${
                            isToday(currentDay)
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentDayJobs.length}
                        </span>
                      </div>
                    )}

                    {/* Time-off indicator */}
                    {currentDayTimeOff.length > 0 && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-medium text-blue-600 sm:h-5 sm:w-5 sm:text-xs dark:text-blue-400`}
                          title={`${currentDayTimeOff.length} time-off request${currentDayTimeOff.length > 1 ? "s" : ""}`}
                        >
                          <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="relative flex-1 overflow-x-hidden overflow-y-auto">
                <div className="flex h-full min-h-[1200px] md:min-h-[1440px]">
                  {/* Time axis */}
                  <div className="bg-muted/50 border-border sticky left-0 z-10 w-12 flex-none border-r sm:w-16 md:w-20">
                    <div className="grid auto-rows-[50px] sm:auto-rows-[60px]">
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="border-border relative border-b last:border-b-0"
                        >
                          {/* Hour label */}
                          <div className="absolute -top-1.5 right-1 flex items-center justify-center sm:-top-2 sm:right-2 md:right-3">
                            <span className="text-muted-foreground bg-card border-border rounded border px-1 py-0.5 text-[9px] font-medium shadow-sm sm:px-1.5 sm:py-1 sm:text-[10px] md:px-2 md:text-xs">
                              <span className="hidden sm:inline">
                                {format(
                                  new Date().setHours(hour, 0, 0, 0),
                                  "h a",
                                )}
                              </span>
                              <span className="sm:hidden">
                                {format(
                                  new Date().setHours(hour, 0, 0, 0),
                                  "ha",
                                )}
                              </span>
                            </span>
                          </div>

                          {/* Hour marker line */}
                          <div className="bg-border absolute top-0 right-0 h-px w-2 sm:w-3"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar column */}
                  <div className="relative z-0 flex flex-1">
                    <div
                      className={`relative flex-1 ${
                        isToday(currentDay) ? "bg-primary/5" : "bg-card"
                      }`}
                    >
                      <CalendarColumn
                        day={currentDay}
                        jobs={currentDayJobs}
                        isToday={isToday(currentDay)}
                        canManage={canManage}
                        holidays={holidays}
                        technicians={technicians}
                        availability={availability}
                        showAvailability={showAvailability}
                        timeOffRequests={currentDayTimeOff}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - hidden on mobile, on RIGHT side */}
            <aside className="border-border bg-card hidden flex-col overflow-y-auto border-l lg:flex">
              {/* Mini Calendar - compact */}
              <div className="border-border flex items-center justify-center border-b p-2">
                <Calendar
                  mode="single"
                  selected={currentDay}
                  onSelect={onDateSelect}
                  className="rounded-md"
                  modifiers={{
                    hasJobs: (date) =>
                      datesWithJobs.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersStyles={{
                    hasJobs: {
                      fontWeight: "bold",
                    },
                  }}
                />
              </div>

              {/* Jobs List */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-foreground text-xs font-semibold">
                    Jobs for {format(currentDay, "MMM d")}
                  </h3>
                  {currentDayJobs.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      {currentDayJobs.length}
                    </Badge>
                  )}
                </div>

                {/* Availability/Unavailability - Always shown */}
                {dayAvailability.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <h4 className="text-foreground mb-1 text-xs font-semibold">
                      Unavailability
                    </h4>
                    {dayAvailability.map(({ tech, info }) => (
                      <div
                        key={tech.id}
                        className="bg-destructive/10 hover:bg-destructive/20 border-destructive rounded-md border-l-2 px-2 py-1.5"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-destructive flex items-center gap-1 truncate text-xs font-medium">
                            <Clock className="h-3 w-3" />
                            {tech.name}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {info.type === "full-day"
                              ? "All day"
                              : formatTimeRange12hr(
                                  info.startTime || "00:00",
                                  info.endTime || "23:59",
                                )}
                          </span>
                          {info.reason && (
                            <span className="text-muted-foreground text-[10px]">
                              {info.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Time-off requests */}
                {currentDayTimeOff.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <h4 className="text-foreground mb-1 text-xs font-semibold">
                      Time Off
                    </h4>
                    {currentDayTimeOff.map((request) => {
                      const technician = technicians.find(
                        (tech) => tech.id === request.technicianId,
                      );
                      // Format dates using UTC to avoid timezone issues
                      const startDateStr =
                        typeof request.startDate === "string"
                          ? request.startDate.split("T")[0] || request.startDate
                          : format(request.startDate, "yyyy-MM-dd");
                      const endDateStr =
                        typeof request.endDate === "string"
                          ? request.endDate.split("T")[0] || request.endDate
                          : format(request.endDate, "yyyy-MM-dd");
                      const startDate = formatDateStringUTC(startDateStr);
                      const endDate = formatDateStringUTC(endDateStr);
                      const dateRange =
                        startDate === endDate
                          ? startDate
                          : `${startDate} - ${endDate}`;

                      return (
                        <div
                          key={request._id as string}
                          className="rounded-md border-l-2 border-blue-500 bg-blue-500/10 px-2 py-1.5 hover:bg-blue-500/20"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 truncate text-xs font-medium text-blue-600 dark:text-blue-400">
                              <CalendarDays className="h-3 w-3" />
                              {technician?.name || "Unknown"}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              {dateRange}
                            </span>
                            {request.reason && (
                              <span className="text-muted-foreground text-[10px]">
                                {request.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentDayJobs.length > 0 ? (
                  <ul className="space-y-1.5">
                    {currentDayJobs.map((job) => {
                      const statusClasses = job.confirmed
                        ? "bg-job-confirmed-bg hover:bg-job-confirmed-hover border-l-2 border-job-confirmed"
                        : "bg-destructive/10 hover:bg-destructive/20 border-l-2 border-destructive";

                      return (
                        <li
                          key={job._id as string}
                          className={cn(
                            "cursor-pointer rounded-md px-2 py-1.5 transition-colors",
                            statusClasses,
                          )}
                          onClick={() => handleJobClick(job)}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-foreground truncate text-xs font-medium">
                              {job.jobTitle}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              {format(new Date(job.startDateTime), "h:mm a")}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground text-xs">
                      No jobs scheduled
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

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
};

export default DayCalendar;

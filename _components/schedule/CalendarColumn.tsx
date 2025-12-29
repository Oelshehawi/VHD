"use client";
import { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDays } from "lucide-react";
import { formatDateStringUTC } from "../../app/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Holiday,
  ScheduleType,
  AvailabilityType,
  TimeOffRequestType,
} from "../../app/lib/typeDefinitions";
import JobItem from "./JobItem";
import JobDetailsModal from "./JobDetailsModal";
import {
  calculateJobDurationFromPrice,
  convertMinutesToHours,
  cn,
} from "../../app/lib/utils";
import { isTechnicianUnavailable } from "../../app/lib/utils/availabilityUtils";

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year as number, (month as number) - 1, day as number);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarColumn = ({
  day,
  jobs,
  isToday,
  canManage,
  holidays,
  technicians,
  availability,
  showAvailability,
  timeOffRequests = [],
}: {
  day: Date;
  jobs: ScheduleType[];
  isToday: boolean;
  canManage: boolean;
  holidays: Holiday[];
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  showOptimization?: boolean;
  timeOffRequests?: TimeOffRequestType[];
}) => {
  const [selectedJob, setSelectedJob] = useState<ScheduleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize holiday lookup
  const holiday = useMemo(
    () => holidays.find((h) => isSameDay(parseDate(h.date), day)),
    [holidays, day],
  );

  // Memoize sorted jobs
  const sortedJobs = useMemo(
    () =>
      [...jobs].sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      ),
    [jobs],
  );

  // Get hour and minutes from job's start time
  const getJobTime = (job: ScheduleType) => {
    const date = new Date(job.startDateTime);
    return {
      hour: date.getHours(),
      minutes: date.getMinutes(),
    };
  };

  // Handle job click to open modal
  const handleJobClick = (job: ScheduleType) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  // Get time-off requests for this day
  const dayTimeOff = useMemo(() => {
    const dayKey = format(day, "yyyy-MM-dd");
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
  }, [timeOffRequests, day]);

  return (
    <div className="relative h-full">
      {/* Holiday banner */}
      {holiday && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-20 px-2 py-1 text-center",
            holiday.type === "statutory"
              ? "bg-red-500/20 text-red-700 dark:text-red-300"
              : "bg-purple-500/20 text-purple-700 dark:text-purple-300",
          )}
        >
          <span className="text-xs font-medium">
            {holiday.nameEn}
            {holiday.type === "observance" && (
              <span className="ml-1 opacity-70">(Observance)</span>
            )}
          </span>
        </div>
      )}

      {/* Time-off banner */}
      {dayTimeOff.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "absolute inset-x-0 z-20 cursor-help px-2 py-1 text-center",
                holiday ? "top-8" : "top-0",
                "bg-blue-500/20 text-blue-700 dark:text-blue-300",
              )}
            >
              <div className="flex flex-wrap items-center justify-center gap-1">
                {dayTimeOff.map((request) => {
                  const technician = technicians.find(
                    (tech) => tech.id === request.technicianId,
                  );
                  return (
                    <span
                      key={request._id as string}
                      className="flex items-center gap-1 text-xs font-medium"
                    >
                      <CalendarDays className="h-3 w-3" />
                      {technician?.name || "Unknown"}
                    </span>
                  );
                })}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              {dayTimeOff.map((request) => {
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
                return (
                  <div key={request._id as string} className="text-xs">
                    <div className="font-semibold">
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

      {/* Time slots */}
      <div className="relative h-full">
        {HOURS.map((hour) => {
          // Always check unavailability (availability always shown)
          const isUnavailableHour = technicians.some((tech) =>
            isTechnicianUnavailable(
              availability,
              tech.id,
              day,
              `${String(hour).padStart(2, "0")}:00`,
              `${String(hour + 1).padStart(2, "0")}:00`,
            ),
          );

          return (
            <div
              key={hour}
              className={cn(
                "border-border/30 relative h-[50px] border-b sm:h-[60px]",
                isUnavailableHour && "bg-destructive/10",
              )}
            >
              {/* Jobs that start at this hour */}
              {sortedJobs
                .filter((job) => getJobTime(job).hour === hour)
                .map((job) => {
                  const { minutes } = getJobTime(job);
                  const topOffset = (minutes / 60) * 100;

                  // Use the hours stored on the schedule directly
                  const jobDuration = job.hours || 4;

                  // 50px per hour on mobile, 60px on desktop
                  const heightInPixels = Math.max(60, jobDuration * 50);

                  return (
                    <div
                      key={job._id as string}
                      className="absolute inset-x-1 z-10 sm:inset-x-1.5"
                      style={{
                        top: `${topOffset}%`,
                        height: `${heightInPixels}px`,
                      }}
                    >
                      <JobItem
                        job={job}
                        canManage={canManage}
                        technicians={technicians}
                        onJobClick={handleJobClick}
                      />
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canManage={canManage}
        technicians={technicians}
      />
    </div>
  );
};

export default CalendarColumn;

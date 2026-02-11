"use client";
import { useMemo } from "react";
import { format } from "date-fns-tz";
import {
  Holiday,
  ScheduleType,
  AvailabilityType,
  TimeOffRequestType,
  DayTravelTimeSummary,
} from "../../../app/lib/typeDefinitions";
import CalendarGrid from "../CalendarGrid";
import {
  compareScheduleDisplayOrder,
  getScheduleDisplayDateKey,
} from "../../../app/lib/utils/scheduleDayUtils";

const WeekCalendar = ({
  scheduledJobs,
  canManage,
  currentWeek,
  holidays,
  technicians,
  availability,
  timeOffRequests = [],
  travelTimeSummaries,
  isTravelTimeLoading,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentWeek: Date[];
  holidays: Holiday[];
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  timeOffRequests?: TimeOffRequestType[];
  travelTimeSummaries?: Map<string, DayTravelTimeSummary>;
  isTravelTimeLoading?: boolean;
}) => {
  // Group jobs by date with optimized performance
  const selectedDayJobsMap = useMemo(() => {
    const jobsMap: { [key: string]: ScheduleType[] } = {};

    scheduledJobs.forEach((job) => {
      const jobDateKey = getScheduleDisplayDateKey(job.startDateTime);

      if (!jobsMap[jobDateKey]) {
        jobsMap[jobDateKey] = [];
      }

      (jobsMap[jobDateKey] as ScheduleType[]).push(job);
    });

    // Sort jobs by time within each day
    Object.keys(jobsMap).forEach((dateKey) => {
      (jobsMap[dateKey] as ScheduleType[]).sort((a, b) => {
        return compareScheduleDisplayOrder(a.startDateTime, b.startDateTime);
      });
    });

    return jobsMap;
  }, [scheduledJobs]);

  const selectedDayJobs = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return selectedDayJobsMap[dayKey] || [];
  };

  return (
    <div className="h-full">
      <CalendarGrid
        week={currentWeek}
        selectedDayJobs={selectedDayJobs}
        canManage={canManage}
        holidays={holidays}
        technicians={technicians}
        availability={availability}
        timeOffRequests={timeOffRequests}
        travelTimeSummaries={travelTimeSummaries}
        isTravelTimeLoading={isTravelTimeLoading}
      />
    </div>
  );
};

export default WeekCalendar;

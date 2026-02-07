"use client";
import { useMemo } from "react";
import { format } from "date-fns-tz";
import {
  ScheduleType,
  InvoiceType,
  AvailabilityType,
  TimeOffRequestType,
} from "../../../app/lib/typeDefinitions";
import CalendarGrid from "../CalendarGrid";

const WeekCalendar = ({
  scheduledJobs,
  canManage,
  currentWeek,
  holidays,
  technicians,
  availability,
  showAvailability,
  timeOffRequests = [],
  showOptimization,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentWeek: Date[];
  holidays: any;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  timeOffRequests?: TimeOffRequestType[];
  showOptimization?: boolean;
}) => {
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

  return (
    <div className="h-full">
      <CalendarGrid
        week={currentWeek}
        selectedDayJobs={selectedDayJobs}
        canManage={canManage}
        holidays={holidays}
        technicians={technicians}
        availability={availability}
        showAvailability={showAvailability}
        timeOffRequests={timeOffRequests}
      />
    </div>
  );
};

export default WeekCalendar;

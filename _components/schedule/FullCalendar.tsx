"use client";
import { useMemo } from "react";
import { format } from "date-fns";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import CalendarGrid from "./CalendarGrid";

const FullCalendar = ({
  scheduledJobs,
  canManage,
  currentWeek,
  holidays,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentWeek: Date[];
  holidays: any;
}) => {
  const selectedDayJobsMap = useMemo(() => {
    const jobsMap: { [key: string]: ScheduleType[] } = {};
    scheduledJobs.forEach((job) => {
      const jobDateKey = format(job.startDateTime, "yyyy-MM-dd");
      if (!jobsMap[jobDateKey]) {
        jobsMap[jobDateKey] = [];
      }
      jobsMap[jobDateKey]?.push(job);
    });
    return jobsMap;
  }, [scheduledJobs]);

  const selectedDayJobs = (day: Date) =>
    selectedDayJobsMap[format(day, "yyyy-MM-dd")] || [];

  return (
    <CalendarGrid
      week={currentWeek}
      selectedDayJobs={selectedDayJobs}
      canManage={canManage}
      holidays={holidays}
    />
  );
};

export default FullCalendar;
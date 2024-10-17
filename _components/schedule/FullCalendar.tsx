"use client";
import { useMemo } from "react";
import { format } from "date-fns-tz";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import CalendarGrid from "./CalendarGrid";

const FullCalendar = ({
  scheduledJobs,
  canManage,
  currentWeek,
  holidays,
  technicians,
}: {
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentWeek: Date[];
  holidays: any;
  technicians: { id: string; name: string }[];
}) => {
  const selectedDayJobsMap = useMemo(() => {
    const jobsMap: { [key: string]: ScheduleType[] } = {};
    scheduledJobs.forEach((job) => {
      const jobDateKey = format(new Date(job.startDateTime), "yyyy-MM-dd", {
        timeZone: "UTC",
      });
      if (!jobsMap[jobDateKey]) {
        jobsMap[jobDateKey] = [];
      }
      jobsMap[jobDateKey]?.push(job);
    });
    return jobsMap;
  }, [scheduledJobs]);

  

  const selectedDayJobs = (day: Date) =>
    selectedDayJobsMap[format(day, "yyyy-MM-dd", { timeZone: "UTC" })] || [];

  return (
    <CalendarGrid
      week={currentWeek}
      selectedDayJobs={selectedDayJobs}
      canManage={canManage}
      holidays={holidays}
      technicians={technicians}
    />
  );
};

export default FullCalendar;

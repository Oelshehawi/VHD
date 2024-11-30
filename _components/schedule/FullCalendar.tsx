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
  // Group jobs by date
  const selectedDayJobsMap = useMemo(() => {
    const jobsMap: { [key: string]: ScheduleType[] } = {};
    
    scheduledJobs.forEach((job) => {
      const jobDate = new Date(job.startDateTime);
      const jobDateKey = format(jobDate, "yyyy-MM-dd");
      
      if (!jobsMap[jobDateKey]) {
        jobsMap[jobDateKey] = [];
      }
      
      (jobsMap[jobDateKey] as ScheduleType[]).push(job);
      
      // Sort jobs by time within each day
      (jobsMap[jobDateKey] as ScheduleType[]).sort((a, b) => {
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
    <div className="h-full overflow-hidden bg-white">
      <CalendarGrid
        week={currentWeek}
        selectedDayJobs={selectedDayJobs}
        canManage={canManage}
        holidays={holidays}
        technicians={technicians}
      />
    </div>
  );
};

export default FullCalendar;

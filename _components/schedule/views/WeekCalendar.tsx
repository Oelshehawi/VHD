"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  compareScheduleDisplayOrder,
  getScheduleDisplayDateKey,
} from "../../../app/lib/utils/scheduleDayUtils";

const ScheduleMap = dynamic(() => import("../map/ScheduleMap"), {
  ssr: false,
});

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
  technicians: { id: string; name: string; depotAddress?: string | null }[];
  availability: AvailabilityType[];
  timeOffRequests?: TimeOffRequestType[];
  travelTimeSummaries?: Map<string, DayTravelTimeSummary>;
  isTravelTimeLoading?: boolean;
}) => {
  const [activeMapDate, setActiveMapDate] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

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

  const activeMapDay = useMemo(() => {
    if (!activeMapDate) return null;
    return (
      currentWeek.find((day) => format(day, "yyyy-MM-dd") === activeMapDate) ||
      null
    );
  }, [currentWeek, activeMapDate]);

  const activeMapJobs = useMemo(() => {
    if (!activeMapDate) return [];
    return selectedDayJobsMap[activeMapDate] || [];
  }, [activeMapDate, selectedDayJobsMap]);

  const activeMapSummary = activeMapDate
    ? travelTimeSummaries?.get(activeMapDate)
    : undefined;

  const depotAddress =
    technicians.find((tech) => tech.depotAddress)?.depotAddress ?? null;

  const handleShowMap = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    if ((selectedDayJobsMap[dayKey] || []).length === 0) return;
    setActiveMapDate(dayKey);
    setIsMapOpen(true);
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
        onShowMap={handleShowMap}
      />

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-[95vw] overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="border-border border-b px-4 py-3">
            <DialogTitle className="text-base">
              Route Map
              {activeMapDay ? ` - ${format(activeMapDay, "EEEE, MMM d")}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-3">
            <ScheduleMap
              jobs={activeMapJobs}
              summary={activeMapSummary}
              technicians={technicians}
              depotAddress={depotAddress}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeekCalendar;

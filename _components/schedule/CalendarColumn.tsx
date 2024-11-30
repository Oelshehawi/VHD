"use client";
import { format, isSameDay } from "date-fns";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import JobItem from "./JobItem";

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarColumn = ({
  day,
  jobs,
  isToday,
  canManage,
  holidays,
  technicians,
}: {
  day: Date;
  jobs: ScheduleType[];
  isToday: boolean;
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
}) => {
  const holiday = holidays.find((holiday: any) =>
    isSameDay(parseDate(holiday.date), day)
  );

  // Sort jobs by start time
  const sortedJobs = jobs.sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  // Get hour and minutes from job's start time
  const getJobTime = (job: ScheduleType) => {
    const date = new Date(job.startDateTime);
    return {
      hour: date.getHours(),
      minutes: date.getMinutes(),
    };
  };

  return (
    <div className={`h-full ${isToday ? "bg-blue-50" : "bg-white"}`}>
      {/* Holiday banner */}
      {holiday && (
        <div className="sticky top-0 z-20 bg-yellow-50 px-2 py-1">
          <p className="text-xs font-medium text-yellow-800">{holiday.name}</p>
        </div>
      )}

      {/* Time slots */}
      <div className="relative">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="relative h-[60px] border-b border-gray-100 last:border-b-0"
          >
            {/* Jobs that start at this hour */}
            {sortedJobs
              .filter((job) => getJobTime(job).hour === hour)
              .map((job) => {
                const { minutes } = getJobTime(job);
                const topOffset = (minutes / 60) * 100;

                return (
                  <div
                    key={job._id as string}
                    className="absolute inset-x-1 z-10"
                    style={{ top: `${topOffset}%` }}
                  >
                    <JobItem
                      job={job}
                      canManage={canManage}
                      technicians={technicians}
                    />
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarColumn;



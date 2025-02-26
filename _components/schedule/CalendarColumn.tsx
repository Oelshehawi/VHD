"use client";
import { format, isSameDay } from "date-fns";
import { Holiday, ScheduleType } from "../../app/lib/typeDefinitions";
import JobItem from "./JobItem";

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year as number, (month as number) - 1, day as number);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getHolidayStyles = (type?: "statutory" | "observance") => {
  switch (type) {
    case "statutory":
      return {
        container: "border-red-200/50 bg-red-50/90",
        text: "text-red-800 font-semibold",
      };
    case "observance":
      return {
        container: "border-purple-200/50 bg-purple-50/90",
        text: "text-purple-800",
      };
    default:
      return {
        container: "border-yellow-200/50 bg-yellow-50/90",
        text: "text-yellow-800",
      };
  }
};

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
  holidays: Holiday[];
  technicians: { id: string; name: string }[];
}) => {
  const holiday = holidays.find((holiday) =>
    isSameDay(parseDate(holiday.date), day),
  );

  const holidayStyles = getHolidayStyles(holiday?.type);

  // Sort jobs by start time
  const sortedJobs = jobs.sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
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
    <div
      className={`relative z-0 h-full transition-colors ${
        isToday
          ? "bg-blue-50/90 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]"
          : "bg-white hover:bg-gray-50/50"
      }`}
    >
      {/* Day indicator for today */}
      {isToday && (
        <div className="absolute -top-[3.25rem] left-1/2 flex -translate-x-1/2 items-center justify-center">
          <div className="relative">
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-full bg-blue-200/50 blur-sm" />
            {/* White ring */}
            <div className="absolute -inset-1 rounded-full bg-white shadow-lg" />
            {/* Blue circle with number */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white shadow-md">
              {format(day, "d")}
            </div>
          </div>
        </div>
      )}

      {/* Holiday banner */}
      {holiday && (
        <div
          className={`absolute inset-x-0 top-0 z-30 border-y ${holidayStyles.container} px-2 py-1.5 shadow-sm backdrop-blur-[2px]`}
        >
          <p className={`text-center text-xs ${holidayStyles.text}`}>
            {holiday.nameEn}
            {holiday.type === "observance" && (
              <span className="ml-1 text-[10px] opacity-75">(Observance)</span>
            )}
          </p>
        </div>
      )}

      {/* Time slots */}
      <div className="relative h-full">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="relative h-[60px] border-b border-gray-100 last:border-b-0"
          >
            {/* Hour marker line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gray-100" />

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

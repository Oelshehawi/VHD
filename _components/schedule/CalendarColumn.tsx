"use client";
import { format, isSameDay } from "date-fns";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import JobItem from "./JobItem";

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year as any, (month as any) - 1, day);
};

const CalendarColumn = ({
  day,
  jobs,
  isToday,
  canManage,
  holidays,
}: {
  day: Date;
  jobs: ScheduleType[];
  isToday: boolean;
  canManage: boolean;
  holidays: any;
}) => {
  const holiday = holidays.find((holiday: any) =>
    isSameDay(parseDate(holiday.date), day),
  );

  const sortedJobs = jobs.sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
  );

  return (
    <div
      className={`flex flex-col gap-2 overflow-y-auto rounded border-2 p-2 ${
        isToday ? "bg-blue-100" : ""
      }`}
    >
      <button className="font-bold">{format(day, "E d")}</button>
      {holiday && (
        <div className="mt-2 border-b-2 border-gray-300 bg-yellow-200 p-2">
          <p className="font-semibold text-red-600">{holiday.name}</p>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {sortedJobs.map((job) => (
          <JobItem key={job._id as string} job={job} canManage={canManage} />
        ))}
      </ul>
    </div>
  );
};

export default CalendarColumn;



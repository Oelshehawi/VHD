import { format, isToday } from "date-fns";
import CalendarColumn from "./CalendarColumn";
import { ScheduleType } from "../../app/lib/typeDefinitions";

const CalendarGrid = ({
  week,
  selectedDayJobs,
  canManage,
  holidays,
}: {
  week: Date[];
  selectedDayJobs: (day: Date) => ScheduleType[];
  canManage: boolean;
  holidays: any;
}) => {
  const firstDay = week[0] as Date;
  const lastDay = week[week.length - 1] as Date;

  const monthName =
    format(firstDay, "MMM yyyy") !== format(lastDay, "MMM yyyy")
      ? `${format(firstDay, "MMM yyyy")} – ${format(lastDay, "MMM yyyy")}`
      : format(firstDay, "MMMM yyyy");

  return (
    <div className="h-full p-12">
      <div className="text-center font-bold text-lg mb-4">{monthName}</div>

      <div className="grid h-[90%] grid-flow-col grid-cols-7 gap-1">
        {week.map((day, index) => (
          <CalendarColumn
            key={index}
            day={day}
            jobs={selectedDayJobs(day)}
            isToday={isToday(day)}
            canManage={canManage}
            holidays={holidays}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;

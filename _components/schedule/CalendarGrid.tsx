import { format, isToday } from "date-fns";
import CalendarColumn from "./CalendarColumn";
import { ScheduleType } from "../../app/lib/typeDefinitions";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({
  week,
  selectedDayJobs,
  canManage,
  holidays,
  technicians,
}: {
  week: Date[];
  selectedDayJobs: (day: Date) => ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
}) => {
  const firstDay = week[0] as Date;
  const lastDay = week[week.length - 1] as Date;

  const monthName =
    format(firstDay, "MMM yyyy") !== format(lastDay, "MMM yyyy")
      ? `${format(firstDay, "MMM yyyy")} – ${format(lastDay, "MMM yyyy")}`
      : format(firstDay, "MMMM yyyy");

  return (
    <div className="flex h-full flex-col">
      {/* Fixed headers */}
      <div className="flex-none">
        {/* Month header */}
        <div className="border-b border-gray-200 bg-white px-6 py-2">
          <h2 className="text-center text-lg font-semibold text-gray-900">
            {monthName}
          </h2>
        </div>

        {/* Days header */}
        <div className="flex border-b border-gray-200">
          <div className="w-16 flex-none bg-white" /> {/* Time axis spacer */}
          {week.map((day, idx) => (
            <div
              key={idx}
              className={`relative flex flex-1 flex-col items-center py-2 ${
                isToday(day) ? "bg-blue-50" : "bg-white"
              }`}
            >
              <span className="text-sm font-medium text-gray-500">
                {format(day, "EEE")}
              </span>
              <span
                className={`mt-1 text-2xl font-semibold ${
                  isToday(day) ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="flex h-full">
          {/* Time axis - Update z-index */}
          <div className="sticky left-0 w-16 flex-none bg-white">
            <div className="grid auto-rows-[60px]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b border-gray-100 pr-2"
                >
                  <span className="absolute -top-3 right-2 text-xs text-gray-500">
                    {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar columns - Add stacking context */}
          <div className="relative z-0 flex flex-1 divide-x divide-gray-200">
            {week.map((day, idx) => (
              <div key={idx} className="relative flex-1">
                <CalendarColumn
                  day={day}
                  jobs={selectedDayJobs(day)}
                  isToday={isToday(day)}
                  canManage={canManage}
                  holidays={holidays}
                  technicians={technicians}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;

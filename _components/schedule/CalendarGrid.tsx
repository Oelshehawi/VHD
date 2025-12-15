import { format, isToday } from "date-fns";
import CalendarColumn from "./CalendarColumn";
import { ScheduleType, InvoiceType, AvailabilityType } from "../../app/lib/typeDefinitions";
import { getTechnicianUnavailabilityInfo } from "../../app/lib/utils/availabilityUtils";
import { formatTimeRange12hr } from "../../app/lib/utils/timeFormatUtils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({
  invoices,
  week,
  selectedDayJobs,
  canManage,
  holidays,
  technicians,
  availability,
  showAvailability,
}: {
  invoices: InvoiceType[];
  week: Date[];
  selectedDayJobs: (day: Date) => ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  showOptimization?: boolean;
}) => {
  const firstDay = week[0] as Date;
  const lastDay = week[week.length - 1] as Date;

  const monthName =
    format(firstDay, "MMM yyyy") !== format(lastDay, "MMM yyyy")
      ? `${format(firstDay, "MMM yyyy")} – ${format(lastDay, "MMM yyyy")}`
      : format(firstDay, "MMMM yyyy");


  return (
    <div className="flex h-full flex-col bg-white">
      {/* Enhanced Header */}
      <div className="flex-none bg-linear-to-r from-gray-50 to-white border-b border-gray-200">

        {/* Enhanced Days header */}
        <div className="flex bg-white">
          {/* Time axis label */}
          <div className="w-12 sm:w-16 md:w-20 flex-none flex items-center justify-center py-2 sm:py-3 md:py-4 bg-gray-50/50 border-r border-gray-200">
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:inline">Time</span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide sm:hidden">T</span>
          </div>

          {/* Day headers */}
          {week.map((day, idx) => {
            // Check if there's any unavailability for this day
            const hasUnavailability = technicians.some(tech =>
              getTechnicianUnavailabilityInfo(availability, tech.id, day).isUnavailable
            );

            // Build tooltip with unavailability details
            const unavailabilityTitle = technicians
              .map(tech => {
                const info = getTechnicianUnavailabilityInfo(availability, tech.id, day);
                if (info.isUnavailable) {
                  if (info.type === "full-day") {
                    return `${tech.name}: All day`;
                  } else {
                    return `${tech.name}: ${formatTimeRange12hr(info.startTime || "00:00", info.endTime || "23:59")}`;
                  }
                }
                return null;
              })
              .filter((item) => item !== null)
              .join("\n");

            return (
              <div
                key={idx}
                className={`relative flex flex-1 flex-col items-center py-2 sm:py-3 md:py-4 transition-colors ${
                  isToday(day)
                    ? "bg-linear-to-b from-blue-50 to-blue-100/50 border-l-2 border-r-2 border-blue-200"
                    : "bg-white hover:bg-gray-50/50"
                } ${hasUnavailability ? "border-t-2 border-t-red-400" : ""}`}
                title={hasUnavailability ? unavailabilityTitle : ""}
              >
                {/* Day name */}
                <span className={`text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide ${
                  isToday(day) ? "text-blue-700" : "text-gray-600"
                }`}>
                  {/* Show abbreviated on mobile, full on desktop */}
                  <span className="hidden md:inline">{format(day, "EEEE")}</span>
                  <span className="md:hidden">{format(day, "EEE")}</span>
                </span>

                {/* Date */}
                <span className={`mt-0.5 sm:mt-1 text-lg sm:text-xl md:text-2xl font-bold ${
                  isToday(day) ? "text-blue-700" : "text-gray-900"
                }`}>
                  {format(day, "d")}
                </span>

                {/* Unavailability indicator dot */}
                {hasUnavailability && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 shadow-sm" />
                  </div>
                )}

                {/* Today indicator */}
                {isToday(day) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                {/* Job count indicator */}
                {selectedDayJobs(day).length > 0 && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                    <span className={`inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 text-[10px] sm:text-xs font-medium rounded-full ${
                      isToday(day)
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {selectedDayJobs(day).length}
                    </span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Scrollable content */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex h-full min-h-[1200px] md:min-h-[1440px]">
          {/* Enhanced Time axis */}
          <div className="sticky left-0 w-12 sm:w-16 md:w-20 flex-none bg-linear-to-r from-gray-50 to-gray-25 border-r border-gray-200 z-10">
            <div className="grid auto-rows-[50px] sm:auto-rows-[60px]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b border-gray-100 last:border-b-0"
                >
                  {/* Hour label with improved styling */}
                  <div className="absolute -top-1.5 sm:-top-2 right-1 sm:right-2 md:right-3 flex items-center justify-center">
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-500 bg-white px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded shadow-sm border border-gray-200">
                      {/* Show abbreviated on mobile */}
                      <span className="hidden sm:inline">{format(new Date().setHours(hour, 0, 0, 0), "h a")}</span>
                      <span className="sm:hidden">{format(new Date().setHours(hour, 0, 0, 0), "ha")}</span>
                    </span>
                  </div>

                  {/* Hour marker line */}
                  <div className="absolute top-0 right-0 w-2 sm:w-3 h-px bg-gray-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Calendar columns */}
          <div className="relative z-0 flex flex-1">
            {week.map((day, idx) => (
              <div 
                key={idx} 
                className={`relative flex-1 ${
                  idx < week.length - 1 ? 'border-r border-gray-200' : ''
                } ${isToday(day) ? 'bg-blue-50/20' : 'bg-white'}`}
              >
                <CalendarColumn
                  invoices={invoices}
                  day={day}
                  jobs={selectedDayJobs(day)}
                  isToday={isToday(day)}
                  canManage={canManage}
                  holidays={holidays}
                  technicians={technicians}
                  availability={availability}
                  showAvailability={showAvailability}
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

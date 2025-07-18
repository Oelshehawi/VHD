import { format, isToday } from "date-fns";
import CalendarColumn from "./CalendarColumn";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import { SerializedOptimizationResult, SerializedOptimizedJob } from "../../app/lib/schedulingOptimizations.types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({
  invoices,
  week,
  selectedDayJobs,
  canManage,
  holidays,
  technicians,
  optimizationResult,
  showOptimization,
}: {
  invoices: InvoiceType[];
  week: Date[];
  selectedDayJobs: (day: Date) => ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
  optimizationResult?: SerializedOptimizationResult | null;
  showOptimization?: boolean;
}) => {
  const firstDay = week[0] as Date;
  const lastDay = week[week.length - 1] as Date;

  const monthName =
    format(firstDay, "MMM yyyy") !== format(lastDay, "MMM yyyy")
      ? `${format(firstDay, "MMM yyyy")} – ${format(lastDay, "MMM yyyy")}`
      : format(firstDay, "MMMM yyyy");

  // Extract optimization jobs for each day
  const selectedDayOptimizedJobs = (day: Date): SerializedOptimizedJob[] => {
    if (!optimizationResult || !showOptimization) return [];
    
    const dayKey = format(day, "yyyy-MM-dd");
    const dayGroups = optimizationResult.scheduledGroups.filter(group => 
      format(new Date(group.date), "yyyy-MM-dd") === dayKey
    );
    
    return dayGroups.flatMap(group => group.jobs);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Enhanced Header */}
      <div className="flex-none bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">

        {/* Enhanced Days header */}
        <div className="flex bg-white">
          {/* Time axis label */}
          <div className="w-20 flex-none flex items-center justify-center py-4 bg-gray-50/50 border-r border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</span>
          </div>
          
          {/* Day headers */}
          {week.map((day, idx) => (
            <div
              key={idx}
              className={`relative flex flex-1 flex-col items-center py-4 transition-colors ${
                isToday(day) 
                  ? "bg-gradient-to-b from-blue-50 to-blue-100/50 border-l-2 border-r-2 border-blue-200" 
                  : "bg-white hover:bg-gray-50/50"
              }`}
            >
              {/* Day name */}
              <span className={`text-sm font-semibold tracking-wide ${
                isToday(day) ? "text-blue-700" : "text-gray-600"
              }`}>
                {format(day, "EEEE")}
              </span>
              
              {/* Date */}
              <span className={`mt-1 text-2xl font-bold ${
                isToday(day) ? "text-blue-700" : "text-gray-900"
              }`}>
                {format(day, "d")}
              </span>

              {/* Today indicator */}
              {isToday(day) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}

              {/* Job count indicator */}
              {selectedDayJobs(day).length > 0 && (
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center justify-center h-5 w-5 text-xs font-medium rounded-full ${
                    isToday(day) 
                      ? "bg-blue-200 text-blue-800" 
                      : "bg-gray-200 text-gray-700"
                  }`}>
                    {selectedDayJobs(day).length}
                  </span>
                </div>
              )}

              {/* Optimization indicator */}
              {showOptimization && selectedDayOptimizedJobs(day).length > 0 && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-medium bg-blue-500 text-white rounded-full animate-pulse">
                    {selectedDayOptimizedJobs(day).length}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Scrollable content */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="flex h-full min-h-[1440px]">
          {/* Enhanced Time axis */}
          <div className="sticky left-0 w-20 flex-none bg-gradient-to-r from-gray-50 to-gray-25 border-r border-gray-200 z-10">
            <div className="grid auto-rows-[60px]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b border-gray-100 last:border-b-0"
                >
                  {/* Hour label with improved styling */}
                  <div className="absolute -top-2 right-3 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200">
                      {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                    </span>
                  </div>
                  
                  {/* Hour marker line */}
                  <div className="absolute top-0 right-0 w-3 h-px bg-gray-300"></div>
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
                  optimizedJobs={selectedDayOptimizedJobs(day)}
                  isToday={isToday(day)}
                  canManage={canManage}
                  holidays={holidays}
                  technicians={technicians}
                  showOptimization={showOptimization}
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

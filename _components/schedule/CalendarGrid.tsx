import { format, isToday } from "date-fns";
import CalendarColumn from "./CalendarColumn";
import { ScheduleType, AvailabilityType } from "../../app/lib/typeDefinitions";
import { cn } from "../../app/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CalendarGrid = ({
  week,
  selectedDayJobs,
  canManage,
  holidays,
  technicians,
  availability,
  showAvailability,
}: {
  week: Date[];
  selectedDayJobs: (day: Date) => ScheduleType[];
  canManage: boolean;
  holidays: any;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
  showOptimization?: boolean;
}) => {
  return (
    <div className="bg-card flex h-full flex-col">
      {/* Day Headers */}
      <div className="border-border flex border-b">
        {/* Time column header */}
        <div className="border-border/50 bg-muted/30 w-14 flex-none border-r sm:w-16" />

        {/* Day headers */}
        {week.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-1 flex-col items-center py-3 transition-colors",
              isToday(day) ? "bg-primary/5" : "hover:bg-muted/30",
              idx < week.length - 1 && "border-border/50 border-r",
            )}
          >
            {/* Day name */}
            <span
              className={cn(
                "text-xs font-medium tracking-wide uppercase",
                isToday(day) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {format(day, "EEE")}
            </span>

            {/* Date number */}
            <span
              className={cn(
                "mt-1 text-xl font-semibold",
                isToday(day) ? "text-primary" : "text-foreground",
              )}
            >
              {format(day, "d")}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="flex min-h-[1200px] md:min-h-[1440px]">
          {/* Time axis */}
          <div className="border-border/50 bg-muted/30 sticky left-0 z-10 w-14 flex-none border-r sm:w-16">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-border/30 relative h-[50px] border-b sm:h-[60px]"
              >
                <span className="text-muted-foreground absolute -top-2.5 right-2 text-xs">
                  {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar columns */}
          <div className="flex flex-1">
            {week.map((day, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative flex-1",
                  idx < week.length - 1 && "border-border/50 border-r",
                  isToday(day) ? "bg-primary/5" : "bg-card",
                )}
              >
                <CalendarColumn
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

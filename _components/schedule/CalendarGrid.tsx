import { format, isToday } from "date-fns";
import CalendarColumn from "./CalendarColumn";
import {
  ScheduleType,
  InvoiceType,
  AvailabilityType,
} from "../../app/lib/typeDefinitions";
import { cn } from "../../app/lib/utils";

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
  return (
    <div className="flex h-full flex-col bg-card">
      {/* Day Headers */}
      <div className="flex border-b border-border">
        {/* Time column header */}
        <div className="w-14 flex-none border-r border-border/50 bg-muted/30 sm:w-16" />

        {/* Day headers */}
        {week.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-1 flex-col items-center py-3 transition-colors",
              isToday(day) ? "bg-primary/5" : "hover:bg-muted/30",
              idx < week.length - 1 && "border-r border-border/50"
            )}
          >
            {/* Day name */}
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-wide",
                isToday(day) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {format(day, "EEE")}
            </span>

            {/* Date number */}
            <span
              className={cn(
                "mt-1 text-xl font-semibold",
                isToday(day) ? "text-primary" : "text-foreground"
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
          <div className="sticky left-0 z-10 w-14 flex-none border-r border-border/50 bg-muted/30 sm:w-16">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative h-[50px] border-b border-border/30 sm:h-[60px]"
              >
                <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground">
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
                  idx < week.length - 1 && "border-r border-border/50",
                  isToday(day) ? "bg-primary/5" : "bg-card"
                )}
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

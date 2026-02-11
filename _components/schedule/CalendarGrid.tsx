import { format, isToday } from "date-fns";
import { Map as MapIcon } from "lucide-react";
import CalendarColumn from "./CalendarColumn";
import {
  Holiday,
  ScheduleType,
  AvailabilityType,
  TimeOffRequestType,
  DayTravelTimeSummary,
} from "../../app/lib/typeDefinitions";
import { cn } from "../../app/lib/utils";
import { Badge } from "../../_components/ui/badge";
import { Button } from "../../_components/ui/button";
import TravelTimeDaySummary from "./TravelTimeDaySummary";
import { SERVICE_DAY_HOUR_ORDER } from "../../app/lib/utils/scheduleDayUtils";

const HOURS = SERVICE_DAY_HOUR_ORDER;

const CalendarGrid = ({
  week,
  selectedDayJobs,
  canManage,
  holidays,
  technicians,
  availability,
  timeOffRequests = [],
  travelTimeSummaries,
  isTravelTimeLoading,
  onShowMap,
}: {
  week: Date[];
  selectedDayJobs: (day: Date) => ScheduleType[];
  canManage: boolean;
  holidays: Holiday[];
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  timeOffRequests?: TimeOffRequestType[];
  travelTimeSummaries?: Map<string, DayTravelTimeSummary>;
  isTravelTimeLoading?: boolean;
  onShowMap?: (day: Date) => void;
}) => {
  return (
    <div className="bg-card flex h-full min-h-0 flex-col">
      {/* Day Headers */}
      <div className="border-border/70 bg-muted/30 flex border-b">
        {/* Time column header */}
        <div className="border-border/60 bg-muted/40 text-muted-foreground flex w-14 flex-none items-center justify-center border-r text-[10px] font-semibold tracking-[0.14em] uppercase sm:w-16 sm:text-xs">
          Time
        </div>

        {/* Day headers */}
        {week.map((day, idx) => {
          const today = isToday(day);
          const dayJobs = selectedDayJobs(day);
          const jobCount = dayJobs.length;
          const dayKey = format(day, "yyyy-MM-dd");

          return (
            <div
              key={dayKey}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 transition-colors sm:py-3",
                today ? "bg-primary/10" : "hover:bg-muted/30",
                idx < week.length - 1 && "border-border/60 border-r",
              )}
            >
              {/* Day name */}
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-[0.14em] uppercase sm:text-xs",
                  today ? "text-primary" : "text-muted-foreground",
                )}
              >
                {format(day, "EEE")}
              </span>

              {/* Date number */}
              <span
                className={cn(
                  "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-semibold sm:h-8 sm:min-w-8 sm:text-base",
                  today
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Job count badge */}
              {jobCount > 0 && (
                <div className="absolute top-1.5 right-1.5">
                  <Badge
                    variant={today ? "default" : "secondary"}
                    className={cn(
                      "h-4 min-w-[16px] rounded-full px-1 text-[9px] font-semibold",
                      today && "bg-primary text-primary-foreground",
                    )}
                  >
                    {jobCount}
                  </Badge>
                </div>
              )}

              {/* Travel time summary */}
              {jobCount > 0 && (
                <TravelTimeDaySummary
                  summary={travelTimeSummaries?.get(format(day, "yyyy-MM-dd"))}
                  isLoading={isTravelTimeLoading}
                />
              )}

              {jobCount > 0 && onShowMap && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-[10px]"
                  onClick={() => onShowMap(day)}
                >
                  <MapIcon className="h-3 w-3" />
                  <span className="hidden md:inline">Map</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-auto">
        <div className="flex min-h-[1200px] md:min-h-[1440px]">
          {/* Time axis */}
          <div className="border-border/60 bg-muted/40 sticky left-0 z-20 w-14 flex-none border-r sm:w-16">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-border/40 relative h-[50px] border-b sm:h-[60px]"
              >
                <span className="text-muted-foreground absolute -top-2 right-1.5 text-[10px] font-medium sm:right-2 sm:text-xs">
                  {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar columns */}
          <div className="flex flex-1">
            {week.map((day, idx) => {
              const dayKey = format(day, "yyyy-MM-dd");
              return (
                <div
                  key={dayKey}
                  className={cn(
                    "relative flex-1",
                    idx < week.length - 1 && "border-border/60 border-r",
                    isToday(day) ? "bg-primary/[0.06]" : "bg-card",
                  )}
                >
                  <CalendarColumn
                    day={day}
                    jobs={selectedDayJobs(day)}
                    canManage={canManage}
                    holidays={holidays}
                    technicians={technicians}
                    availability={availability}
                    timeOffRequests={timeOffRequests}
                    travelTimeSummary={travelTimeSummaries?.get(dayKey)}
                    isTravelTimeLoading={isTravelTimeLoading}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;

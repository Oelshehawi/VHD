"use client";
import { useMemo } from "react";
import { format, isToday } from "date-fns";
import { ScheduleType, InvoiceType, AvailabilityType } from "../../../app/lib/typeDefinitions";
import CalendarColumn from "../CalendarColumn";
import { Card } from "../../ui/card";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayCalendar = ({
  invoices,
  scheduledJobs,
  canManage,
  currentDay,
  holidays,
  technicians,
  availability,
  showAvailability,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentDay: Date;
  holidays: any;
  technicians: { id: string; name: string }[];
  availability: AvailabilityType[];
  showAvailability: boolean;
}) => {
  // Group jobs by date with optimized performance
  const selectedDayJobsMap = useMemo(() => {
    const jobsMap: { [key: string]: ScheduleType[] } = {};
    
    scheduledJobs.forEach((job) => {
      const jobDate = new Date(job.startDateTime);
      const jobDateKey = format(jobDate, "yyyy-MM-dd");
      
      if (!jobsMap[jobDateKey]) {
        jobsMap[jobDateKey] = [];
      }
      
      (jobsMap[jobDateKey] as ScheduleType[]).push(job);
    });
    
    // Sort jobs by time within each day
    Object.keys(jobsMap).forEach(dateKey => {
      (jobsMap[dateKey] as ScheduleType[]).sort((a, b) => {
        const timeA = new Date(a.startDateTime).getTime();
        const timeB = new Date(b.startDateTime).getTime();
        return timeA - timeB;
      });
    });
    
    return jobsMap;
  }, [scheduledJobs]);

  const selectedDayJobs = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return selectedDayJobsMap[dayKey] || [];
  };

  const dayLabel = format(currentDay, "EEEE, MMMM d, yyyy");

  return (
    <div className="h-full bg-background">
      <Card className="h-full rounded-t-2xl shadow-xl border-border">
        <div className="flex h-full flex-col bg-card">
          {/* Header */}
          <div className="flex-none bg-muted/50 border-b border-border">
            <div className="flex bg-card">
              {/* Time axis label */}
              <div className="w-12 sm:w-16 md:w-20 flex-none flex items-center justify-center py-2 sm:py-3 md:py-4 bg-muted/50 border-r border-border">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:inline">Time</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide sm:hidden">T</span>
              </div>

              {/* Day header */}
              <div
                className={`relative flex flex-1 flex-col items-center py-2 sm:py-3 md:py-4 transition-colors ${
                  isToday(currentDay)
                    ? "bg-primary/10 border-l-2 border-r-2 border-primary"
                    : "bg-card hover:bg-muted/50"
                }`}
              >
                {/* Day name */}
                <span className={`text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide ${
                  isToday(currentDay) ? "text-primary" : "text-muted-foreground"
                }`}>
                  {format(currentDay, "EEEE")}
                </span>

                {/* Date */}
                <span className={`mt-0.5 sm:mt-1 text-lg sm:text-xl md:text-2xl font-bold ${
                  isToday(currentDay) ? "text-primary" : "text-foreground"
                }`}>
                  {format(currentDay, "d")}
                </span>

                {/* Today indicator */}
                {isToday(currentDay) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
                )}

                {/* Job count indicator */}
                {selectedDayJobs(currentDay).length > 0 && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                    <span className={`inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 text-[10px] sm:text-xs font-medium rounded-full ${
                      isToday(currentDay)
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {selectedDayJobs(currentDay).length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex h-full min-h-[1200px] md:min-h-[1440px]">
              {/* Time axis */}
              <div className="sticky left-0 w-12 sm:w-16 md:w-20 flex-none bg-muted/50 border-r border-border z-10">
                <div className="grid auto-rows-[50px] sm:auto-rows-[60px]">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="relative border-b border-border last:border-b-0"
                    >
                      {/* Hour label */}
                      <div className="absolute -top-1.5 sm:-top-2 right-1 sm:right-2 md:right-3 flex items-center justify-center">
                        <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground bg-card px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded shadow-sm border border-border">
                          <span className="hidden sm:inline">{format(new Date().setHours(hour, 0, 0, 0), "h a")}</span>
                          <span className="sm:hidden">{format(new Date().setHours(hour, 0, 0, 0), "ha")}</span>
                        </span>
                      </div>

                      {/* Hour marker line */}
                      <div className="absolute top-0 right-0 w-2 sm:w-3 h-px bg-border"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar column */}
              <div className="relative z-0 flex flex-1">
                <div 
                  className={`relative flex-1 ${
                    isToday(currentDay) ? 'bg-primary/5' : 'bg-card'
                  }`}
                >
                  <CalendarColumn
                    invoices={invoices}
                    day={currentDay}
                    jobs={selectedDayJobs(currentDay)}
                    isToday={isToday(currentDay)}
                    canManage={canManage}
                    holidays={holidays}
                    technicians={technicians}
                    availability={availability}
                    showAvailability={showAvailability}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DayCalendar;


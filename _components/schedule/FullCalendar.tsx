"use client";
import { useMemo } from "react";
import { format } from "date-fns-tz";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import CalendarGrid from "./CalendarGrid";

const FullCalendar = ({
  invoices,
  scheduledJobs,
  canManage,
  currentWeek,
  holidays,
  technicians,
  optimizationResult,
  showOptimization,
}: {
  invoices: InvoiceType[];
  scheduledJobs: ScheduleType[];
  canManage: boolean;
  currentWeek: Date[];
  holidays: any;
  technicians: { id: string; name: string }[];
  optimizationResult?: SerializedOptimizationResult | null;
  showOptimization?: boolean;
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

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white">
      {/* Optimization Status Banner */}
      {showOptimization && optimizationResult && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 border-b border-blue-700/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
              <span className="text-sm font-medium">
                Optimization Active • {optimizationResult.totalJobs} suggested jobs
              </span>
            </div>
            <div className="text-xs opacity-90">
              {Math.round(optimizationResult.metrics.utilizationRate * 100)}% efficiency
            </div>
          </div>
        </div>
      )}

      {/* Modern Calendar Container */}
      <div className="h-full bg-white rounded-t-2xl shadow-xl border border-gray-200/50">
        <CalendarGrid
          invoices={invoices}
          week={currentWeek}
          selectedDayJobs={selectedDayJobs}
          canManage={canManage}
          holidays={holidays}
          technicians={technicians}
          optimizationResult={optimizationResult}
          showOptimization={showOptimization}
        />
      </div>
    </div>
  );
};

export default FullCalendar;

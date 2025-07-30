import {
  JobOptimizationData,
} from "./typeDefinitions";

// Simple scheduling strategy enum for Cloud Run
export enum SchedulingStrategy {
  OR_TOOLS = "or_tools",
}

// Simplified job data for sending to Cloud Run API
export interface CloudRunJobData {
  jobId: string;
  invoiceId: string;
  jobTitle: string;
  location: string;
  clientName: string;
  dateDue: string; // ISO string
  estimatedDuration: number; // minutes
  coordinates?: [number, number]; // [lng, lat]
  // Time window constraints for OR Tools optimization
  timeWindows: {
    earliestStart: string; // ISO string - earliest time this job can start
    latestStart: string; // ISO string - latest time this job can start
  };
  // Fixed scheduling (for jobs that must be at specific times)
  fixedSchedule?: {
    scheduledDateTime: string; // ISO string - exact time job must be scheduled
    isFixed: boolean; // true if this job cannot be moved
  };
}

// Cloud Run optimization request
export interface CloudRunOptimizationRequest {
  jobs: CloudRunJobData[];
  settings: {
    dateRange: {
      start: string; // ISO string
      end: string; // ISO string
    };
    maxJobsPerDay: number;
    startingPointAddress: string;
    startingPointCoordinates?: [number, number]; // [lng, lat]
    allowedDays: number[]; // 1=Monday, 7=Sunday

  };
  // Distance matrix for OR Tools VRP (matches Python service expectations)
  distanceMatrix?: {
    locations: string[];
    coordinates: [number, number][]; // [lng, lat]
    distanceMatrix: number[][]; // distances in km
    durationMatrix: number[][]; // durations in minutes
  };
}

// Python API scheduled job response format
export interface PythonScheduledJob {
  job_id: string;
  scheduled_time: string; // "HH:MM" format
  drive_time_from_previous: number; // minutes
  drive_time_to_next: number; // minutes
  return_trip_time: number; // minutes
  route_order: number;
}

// Python API schedule day response format
export interface PythonScheduleDay {
  date: string; // "YYYY-MM-DD" format
  jobs: PythonScheduledJob[];
  total_travel_time: number; // minutes
  total_work_time: number; // minutes
}

// Python API summary response format
export interface PythonSummary {
  total_jobs: number;
  scheduled_jobs: number;
  unscheduled_jobs: number;
  days_used: number;
}

// Python API optimization response format
export interface PythonOptimizationResponse {
  success: boolean;
  schedule: PythonScheduleDay[];
  unscheduled_jobs: string[]; // job IDs that couldn't be scheduled
  summary: PythonSummary;
  console_logs?: string[];
}

// Cloud Run scheduled job (converted from Python format)
export interface CloudRunScheduledJob {
  jobId: string;
  originalJob: CloudRunJobData;
  scheduledDateTime: string; // ISO string
  estimatedDuration: number; // minutes
  orderInRoute: number;
  dayOfWeek: number; // 1=Monday, 7=Sunday
  driveTimeToPrevious: number; // minutes
  driveTimeToNext: number; // minutes
  returnTripTime: number; // minutes - drive time back to depot from this job
}

// Grouped schedule for UI display
export interface CloudRunScheduleGroup {
  date: string; // YYYY-MM-DD format
  clusterName: string; // e.g., "Technician 1" or "Route A"
  jobs: CloudRunScheduledJob[];
  totalWorkTime: number; // minutes
  totalDriveTime: number; // minutes
  estimatedStartTime: string; // ISO string
}

// Cloud Run optimization response (converted from Python format)
export interface CloudRunOptimizationResponse {
  success: boolean;
  scheduledJobs: CloudRunScheduledJob[];
  unscheduledJobs: CloudRunJobData[];
  scheduleGroups?: CloudRunScheduleGroup[]; // Grouped by date/technician for UI
  metrics?: {
    totalJobs: number;
    scheduledJobs: number;
    unscheduledJobs: number;
    averageJobsPerDay: number;
    totalDriveTime: number;
    totalWorkTime: number;
  };
  console_logs?: string[]; // Console logs from Python service
  error?: string;
}
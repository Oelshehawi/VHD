import {
  JobOptimizationData,
  HistoricalSchedulePatternType,
  OptimizationDistanceMatrixType,
  LocationClusterType,
} from "./typeDefinitions";

// Serialized types for client components (dates as ISO strings)
export interface SerializedJobOptimizationData extends Omit<JobOptimizationData, 'dateDue' | 'constraints'> {
  dateDue: string;
  constraints: {
    earliestStart: string;
    latestStart: string;
    bufferAfter: number;
    requiredTechnicians?: string[];
  };
}

export interface SerializedDateRange {
  start: string;
  end: string;
}

// Serialized historical pattern type (without ObjectIds)
export interface SerializedHistoricalSchedulePatternType extends Omit<HistoricalSchedulePatternType, '_id' | 'lastAnalyzed' | 'historicalData'> {
  _id: string;
  lastAnalyzed: string;
  historicalData: {
    scheduleId: string;
    startDateTime: string;
    actualDuration: number;
    assignedTechnicians: string[];
    completionNotes: string;
  }[];
}

// Serialized optimization result types
export interface SerializedOptimizedJob {
  jobId: string;
  originalJob: SerializedJobOptimizationData;
  scheduledTime: string;
  estimatedDuration: number;
  driveTimeToPrevious: number;
  driveTimeToNext: number;
  orderInRoute: number;
  confidence: number;
  historicalPattern?: SerializedHistoricalSchedulePatternType;
}

export interface SerializedOptimizedScheduleGroup {
  clusterId: string;
  clusterName: string;
  date: string;
  jobs: SerializedOptimizedJob[];
  totalDriveTime: number;
  totalWorkTime: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  assignedTechnicians: string[];
  routeOptimized: boolean;
}

export interface SerializedOptimizationResult {
  strategy: SchedulingStrategy;
  totalJobs: number;
  scheduledGroups: SerializedOptimizedScheduleGroup[];
  unscheduledJobs: SerializedJobOptimizationData[];
  metrics: {
    totalDriveTime: number;
    averageJobsPerDay: number;
    utilizationRate: number;
    conflictsResolved: number;
  };
  generatedAt: string;
}

// Original types for optimization results - CLIENT SAFE (no database imports)
export interface OptimizedScheduleGroup {
  clusterId: string;
  clusterName: string;
  date: Date;
  jobs: OptimizedJob[];
  totalDriveTime: number;
  totalWorkTime: number;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  assignedTechnicians: string[];
  routeOptimized: boolean;
}

export interface OptimizedJob {
  jobId: string;
  originalJob: JobOptimizationData;
  scheduledTime: Date;
  estimatedDuration: number;
  driveTimeToPrevious: number;
  driveTimeToNext: number;
  orderInRoute: number;
  confidence: number;
  historicalPattern?: HistoricalSchedulePatternType;
}

export interface OptimizationResult {
  strategy: SchedulingStrategy;
  totalJobs: number;
  scheduledGroups: OptimizedScheduleGroup[];
  unscheduledJobs: JobOptimizationData[];
  metrics: {
    totalDriveTime: number;
    averageJobsPerDay: number;
    utilizationRate: number;
    conflictsResolved: number;
  };
  generatedAt: Date;
}

export enum SchedulingStrategy {
  HYBRID_HISTORICAL_EFFICIENCY = "hybrid_historical_efficiency",
} 
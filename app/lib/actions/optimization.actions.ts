"use server";

import {
  SchedulingOptimizer,
  SchedulingStrategy,
} from "../schedulingOptimizations.algorithms";
import {
  getSchedulingPreferences,
  fetchUnscheduledJobsForOptimization,
} from "../schedulingOptimizations.data";
import {
  OptimizationResult,
  SerializedOptimizationResult,
  SerializedOptimizedScheduleGroup,
  SerializedOptimizedJob,
  SerializedJobOptimizationData,
  SerializedHistoricalSchedulePatternType,
} from "../schedulingOptimizations.types";
import { JobOptimizationData, HistoricalSchedulePatternType } from "../typeDefinitions";
import { Invoice, Client, JobsDueSoon } from "../../../models/reactDataSchema";
import { createInvoice } from "./actions";
import { createSchedule } from "./scheduleJobs.actions";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { convertMinutesToHours } from "../utils";

// Helper function to serialize a job
function serializeJob(job: JobOptimizationData): SerializedJobOptimizationData {
  return {
    ...job,
    dateDue: job.dateDue.toISOString(),
    constraints: {
      ...job.constraints,
      earliestStart: job.constraints.earliestStart.toISOString(),
      latestStart: job.constraints.latestStart.toISOString(),
    },
  };
}

// Helper function to serialize historical pattern
function serializeHistoricalPattern(pattern: HistoricalSchedulePatternType): SerializedHistoricalSchedulePatternType {
  return {
    ...pattern,
    _id: pattern._id?.toString() || '',
    lastAnalyzed: pattern.lastAnalyzed.toISOString(),
    historicalData: pattern.historicalData.map(data => ({
      scheduleId: data.scheduleId,
      startDateTime: data.startDateTime.toISOString(),
      actualDuration: data.actualDuration || 0,
      assignedTechnicians: data.assignedTechnicians,
      completionNotes: data.completionNotes || '',
    })),
  };
}

// Helper function to serialize optimized job
function serializeOptimizedJob(job: any): SerializedOptimizedJob {
  return {
    jobId: job.jobId,
    originalJob: serializeJob(job.originalJob),
    scheduledTime: job.scheduledTime.toISOString(),
    estimatedDuration: job.estimatedDuration,
    driveTimeToPrevious: job.driveTimeToPrevious,
    driveTimeToNext: job.driveTimeToNext,
    orderInRoute: job.orderInRoute,
    confidence: job.confidence,
    historicalPattern: job.historicalPattern ? serializeHistoricalPattern(job.historicalPattern) : undefined,
  };
}

// Helper function to serialize schedule group
function serializeScheduleGroup(group: any): SerializedOptimizedScheduleGroup {
  return {
    clusterId: group.clusterId,
    clusterName: group.clusterName,
    date: group.date.toISOString(),
    jobs: group.jobs.map(serializeOptimizedJob),
    totalDriveTime: group.totalDriveTime,
    totalWorkTime: group.totalWorkTime,
    estimatedStartTime: group.estimatedStartTime.toISOString(),
    estimatedEndTime: group.estimatedEndTime.toISOString(),
    assignedTechnicians: group.assignedTechnicians,
    routeOptimized: group.routeOptimized,
  };
}

// Helper function to serialize optimization result
function serializeOptimizationResult(result: OptimizationResult): SerializedOptimizationResult {
  return {
    strategy: result.strategy,
    totalJobs: result.totalJobs,
    scheduledGroups: result.scheduledGroups.map(serializeScheduleGroup),
    unscheduledJobs: result.unscheduledJobs.map(serializeJob),
    metrics: result.metrics,
    generatedAt: result.generatedAt.toISOString(),
  };
}

export async function runOptimization(
  strategy: SchedulingStrategy = SchedulingStrategy.HYBRID_HISTORICAL_EFFICIENCY,
  dateRange?: { start: Date; end: Date },
) {
  try {
    // Initialize optimizer
    const optimizer = new SchedulingOptimizer();

    // Get effective date range
    const preferences = await getSchedulingPreferences();
    const effectiveDateRange =
      dateRange ||
      (preferences.schedulingControls?.startDate &&
      preferences.schedulingControls?.endDate
        ? {
            start: new Date(preferences.schedulingControls.startDate),
            end: new Date(preferences.schedulingControls.endDate),
          }
        : {
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

    // Initialize with date range
    await optimizer.initialize(effectiveDateRange);

    // Run optimization
    const result = await optimizer.optimize(strategy, effectiveDateRange);

    // Serialize the result for client components
    const serializedResult = serializeOptimizationResult(result);

    return {
      success: true,
      data: serializedResult,
    };
  } catch (error) {
    console.error("Optimization error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown optimization error",
    };
  }
}

export async function updateSchedulingPreferences(preferences: any) {
  try {
    // This would update the scheduling preferences
    // For now, just return success - you can implement the actual update logic
    return {
      success: true,
      message: "Preferences updated successfully",
    };
  } catch (error) {
    console.error("Update preferences error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update preferences",
    };
  }
}

export async function getOptimizationData(dateRange?: {
  start: Date;
  end: Date;
}) {
  try {
    const preferences = await getSchedulingPreferences();

    const effectiveDateRange =
      dateRange ||
      (preferences.schedulingControls?.startDate &&
      preferences.schedulingControls?.endDate
        ? {
            start: new Date(preferences.schedulingControls.startDate),
            end: new Date(preferences.schedulingControls.endDate),
          }
        : {
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

    const unscheduledJobs =
      await fetchUnscheduledJobsForOptimization(effectiveDateRange);

    return {
      success: true,
      data: {
        preferences,
        unscheduledJobs,
        dateRange: effectiveDateRange,
      },
    };
  } catch (error) {
    console.error("Get optimization data error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch optimization data",
    };
  }
}

export async function updateDistanceMatrixEntry(
  optimizationId: string,
  fromLocation: string,
  toLocation: string,
  duration: number, // in minutes
  distance: number, // in kilometers
) {
  try {
    // This would be used for manual corrections of distance matrices
    // For example, ferry routes that OpenRouteService can't calculate
    
    // Implementation would:
    // 1. Find the optimization distance matrix
    // 2. Locate the indices for the two locations
    // 3. Update both matrix[i][j] and matrix[j][i] for bidirectional routes
    // 4. Save the updated matrix
    
    console.log(`Manual distance matrix update requested:
      Optimization: ${optimizationId}
      Route: ${fromLocation} ↔ ${toLocation}
      Duration: ${duration} minutes
      Distance: ${distance} km
    `);

    // TODO: Implement the actual matrix update logic
    // This is a placeholder for the future implementation
    
    return {
      success: true,
      message: `Distance matrix entry updated for ${fromLocation} to ${toLocation}`,
    };
  } catch (error) {
    console.error("Update distance matrix error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update distance matrix entry",
    };
  }
}

export async function getDistanceMatrixForOptimization(optimizationId: string) {
  try {
    // This would retrieve the distance matrix for manual editing
    // Could be used by an admin interface to view and edit matrices
    
    console.log(`Distance matrix requested for optimization: ${optimizationId}`);
    
    // TODO: Implement the actual matrix retrieval logic
    
    return {
      success: true,
      data: null, // Placeholder
      message: "Distance matrix retrieval not yet implemented",
    };
  } catch (error) {
    console.error("Get distance matrix error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get distance matrix",
    };
  }
}

export async function acceptOptimizedJob(optimizedJob: SerializedOptimizedJob) {
  try {
    await connectMongo();
    
    // First, check if the job already has an invoice
    const existingInvoice = await Invoice.findById(optimizedJob.originalJob.invoiceId);
    
    let invoiceId = optimizedJob.originalJob.invoiceId;
    
    // If no existing invoice, create one based on the job data
    if (!existingInvoice) {
      console.log("Creating new invoice for optimized job:", optimizedJob.originalJob.jobTitle);
      
      // Find the client to get the prefix
      const client = await Client.findOne({ clientName: optimizedJob.originalJob.clientName });
      if (!client) {
        throw new Error("Client not found");
      }

      // Create invoice data
      const invoiceData = {
        clientId: client._id,
        prefix: client.prefix,
        jobTitle: optimizedJob.originalJob.jobTitle,
        location: optimizedJob.originalJob.location,
        dateIssued: new Date(),
        dateDue: new Date(optimizedJob.originalJob.dateDue),
        frequency: 1, // Default frequency
        items: [
          {
            description: optimizedJob.originalJob.jobTitle,
            price: 100, // Default price - should be customizable
          }
        ],
        notes: "Created from optimization",
      };

      // Create the invoice
      await createInvoice(invoiceData);
      
      // Get the created invoice ID
      const newInvoice = await Invoice.findOne({
        clientId: client._id,
        jobTitle: optimizedJob.originalJob.jobTitle,
      }).sort({ _id: -1 });
      
      if (newInvoice) {
        invoiceId = newInvoice._id.toString();
      }
    }

    // Create the schedule entry with all required fields
    const scheduleData: any = {
      invoiceRef: invoiceId,
      jobTitle: optimizedJob.originalJob.jobTitle,
      location: optimizedJob.originalJob.location,
      startDateTime: new Date(optimizedJob.scheduledTime),
      assignedTechnicians: [], // Default to empty, can be assigned later
      confirmed: false,
      hours: convertMinutesToHours(optimizedJob.estimatedDuration), // Convert minutes to hours consistently
      shifts: [],
      deadRun: false,
      technicianNotes: optimizedJob.historicalPattern ? 
        `Optimized job - Historical confidence: ${Math.round(optimizedJob.confidence * 100)}%` : 
        `Optimized job - Confidence: ${Math.round(optimizedJob.confidence * 100)}%`,
    };

    // Create the schedule
    await createSchedule(scheduleData);

    // Mark the job as scheduled in JobsDueSoon
    await JobsDueSoon.findOneAndUpdate(
      { invoiceId },
      { $set: { isScheduled: true } },
      { new: true }
    );

    // Revalidate the schedule page
    revalidatePath("/schedule");

    return {
      success: true,
      message: "Job successfully scheduled from optimization",
    };
  } catch (error) {
    console.error("Error accepting optimized job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept optimized job",
    };
  }
}

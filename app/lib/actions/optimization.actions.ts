"use server";

import {
  CloudRunOptimizer,
} from "../schedulingOptimizations.algorithms";
import {
  fetchUnscheduledJobsForOptimization,
} from "../schedulingOptimizations.data";
import {
  CloudRunOptimizationResponse,
  CloudRunScheduledJob,
} from "../schedulingOptimizations.types";
import { Invoice, Client, JobsDueSoon } from "../../../models/reactDataSchema";
import { createInvoice } from "./actions";
import { createSchedule } from "./scheduleJobs.actions";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { convertMinutesToHours, calculateDueDate } from "../utils";

/**
 * Run optimization using Cloud Run OR Tools service
 */
export async function runOptimization(
  dateRange?: { start: Date; end: Date },
  optimizationSettings?: {
    maxJobsPerDay?: number;
    allowedDays?: number[];
    startingPointAddress?: string;
  },
) {
  try {
    // Get effective date range
    const effectiveDateRange =
      dateRange || {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

    // Fetch unscheduled jobs
    const unscheduledJobs = await fetchUnscheduledJobsForOptimization(effectiveDateRange);
    
    if (unscheduledJobs.length === 0) {
      return {
        success: true,
        data: {
          scheduledJobs: [],
          unscheduledJobs: [],
          metrics: {
            totalJobs: 0,
            scheduledJobs: 0,
            unscheduledJobs: 0,
            averageJobsPerDay: 0,
          },
        },
      };
    }

    // Initialize Cloud Run optimizer
    const optimizer = new CloudRunOptimizer();

    // Run optimization (geocoding happens inside optimize function)
    const result: CloudRunOptimizationResponse = await optimizer.optimize(
      unscheduledJobs,
      effectiveDateRange,
      optimizationSettings
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Cloud Run optimization failed",
      };
    }

    console.log(`✅ Cloud Run completed: ${result.scheduledJobs.length} jobs scheduled`);

    return {
      success: true,
              data: {
          scheduledJobs: result.scheduledJobs,
          unscheduledJobs: result.unscheduledJobs,
          metrics: result.metrics || {
          totalJobs: unscheduledJobs.length,
          scheduledJobs: result.scheduledJobs.length,
          unscheduledJobs: result.unscheduledJobs.length,
          averageJobsPerDay: result.scheduledJobs.length > 0 ? result.scheduledJobs.length / Math.max(1, new Set(result.scheduledJobs.map(job => new Date(job.scheduledDateTime).toISOString().split('T')[0])).size) : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error running optimization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to run optimization",
    };
  }
}

/**
 * Accept and schedule an optimized job from Cloud Run results
 */
export async function acceptOptimizedJob(optimizedJob: CloudRunScheduledJob) {
  try {
    await connectMongo();
    
    // Find the original invoice to copy its data
    const originalInvoice = await Invoice.findById(optimizedJob.originalJob.invoiceId);
    
    if (!originalInvoice) {
      throw new Error("Original invoice not found");
    }

    // Find the client
    const client = await Client.findById(originalInvoice.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Calculate new dates using the same logic as AddInvoice.tsx
    const jobScheduledDate = new Date(optimizedJob.scheduledDateTime).toISOString().split('T')[0];
    const calculatedDateDue = calculateDueDate(jobScheduledDate, originalInvoice.frequency);

    if (!calculatedDateDue) {
      throw new Error("Failed to calculate due date");
    }

    // Ensure calculatedDateDue is a string at this point
    const newDateDue = calculatedDateDue as string;

    // Create new invoice with all data from original except dates
    const invoiceData = {
      clientId: originalInvoice.clientId,
      prefix: client.prefix,
      jobTitle: originalInvoice.jobTitle,
      location: originalInvoice.location,
      dateIssued: new Date(jobScheduledDate || ""),
      dateDue: new Date(newDateDue),
      frequency: originalInvoice.frequency,
      items: originalInvoice.items,
      notes: originalInvoice.notes || "Created from Cloud Run optimization",
      status: "pending",
    };

    // Create the invoice (this function doesn't return anything)
    await createInvoice(invoiceData);

    // Get the created invoice ID
    const createdInvoice = await Invoice.findOne({
      clientId: originalInvoice.clientId,
      jobTitle: originalInvoice.jobTitle,
      dateIssued: new Date(jobScheduledDate || ""),
    }).sort({ _id: -1 });
    
    if (!createdInvoice) {
      throw new Error("Failed to retrieve created invoice");
    }

    const newInvoiceId = createdInvoice._id.toString();

    // Create the schedule entry
    const scheduleData: any = {
      invoiceRef: newInvoiceId,
      jobTitle: optimizedJob.originalJob.jobTitle,
      location: optimizedJob.originalJob.location,
      startDateTime: new Date(optimizedJob.scheduledDateTime),
      assignedTechnicians: [], // Default to empty, can be assigned later
      confirmed: false,
      hours: convertMinutesToHours(optimizedJob.estimatedDuration),
      shifts: [],
      deadRun: false,
      technicianNotes: `Optimized by Cloud Run OR Tools - Day ${optimizedJob.dayOfWeek}, Order ${optimizedJob.orderInRoute}`,
    };

    // Create the schedule
    await createSchedule(scheduleData);

    // Mark the original job as scheduled
    await JobsDueSoon.findOneAndUpdate(
      { invoiceId: optimizedJob.originalJob.invoiceId },
      { $set: { isScheduled: true } },
      { new: true }
    );

    // Revalidate the schedule page
    revalidatePath("/schedule");

    return {
      success: true,
      message: "Job successfully scheduled from Cloud Run optimization",
      newInvoiceId,
    };
  } catch (error) {
    console.error("Error accepting optimized job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept optimized job",
    };
  }
}

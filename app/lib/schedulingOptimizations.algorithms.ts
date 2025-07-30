import {
  CloudRunOptimizationRequest,
  CloudRunOptimizationResponse,
  CloudRunJobData,
  PythonOptimizationResponse,
  CloudRunScheduledJob,
} from "./schedulingOptimizations.types";
import {
  JobOptimizationData,
} from "./typeDefinitions";
import { batchGeocodeJobLocations, calculateDistanceMatrixForCloudRun } from "./schedulingOptimizations.data";

/**
 * Simple Cloud Run API client for OR Tools optimization
 */
export class CloudRunOptimizer {
  private cloudRunUrl: string;

  constructor() {
    // Get Cloud Run URL from environment variable
    this.cloudRunUrl = process.env.CLOUD_RUN_OPTIMIZATION_URL || '';
    
    if (!this.cloudRunUrl) {
      console.warn('CLOUD_RUN_OPTIMIZATION_URL environment variable not set');
    }
  }

  /**
   * Convert JobOptimizationData to CloudRunJobData format
   */
  private convertJobToCloudRunFormat(job: JobOptimizationData): CloudRunJobData {
    return {
      jobId: job.jobId,
      invoiceId: job.invoiceId,
      jobTitle: job.jobTitle,
      location: job.location,
      clientName: job.clientName,
      dateDue: job.dateDue.toISOString(),
      estimatedDuration: job.estimatedDuration,
      // coordinates will be added during geocoding if available
      // Time window constraints for OR Tools optimization (based on historical data)
      timeWindows: {
        earliestStart: job.constraints.earliestStart.toISOString(),
        latestStart: job.constraints.latestStart.toISOString(),
      },
    };
  }

  /**
   * Convert Python API response to CloudRunOptimizationResponse format
   */
  private convertPythonResponseToCloudRun(
    pythonResponse: PythonOptimizationResponse,
    originalJobs: JobOptimizationData[]
  ): CloudRunOptimizationResponse {
    // Create a map of original jobs for easy lookup
    const jobsMap = new Map(originalJobs.map(job => [job.jobId, job]));
    
    // Convert scheduled jobs
    const scheduledJobs: CloudRunScheduledJob[] = [];
    
    pythonResponse.schedule.forEach(scheduleDay => {
      scheduleDay.jobs.forEach(pythonJob => {
        const originalJob = jobsMap.get(pythonJob.job_id);
        if (originalJob) {
          // Convert "HH:MM" time to full ISO datetime
          const scheduledDateTime = new Date(`${scheduleDay.date}T${pythonJob.scheduled_time}:00.000Z`);
          
          scheduledJobs.push({
            jobId: pythonJob.job_id,
            originalJob: this.convertJobToCloudRunFormat(originalJob),
            scheduledDateTime: scheduledDateTime.toISOString(),
            estimatedDuration: originalJob.estimatedDuration,
            orderInRoute: pythonJob.route_order,
            dayOfWeek: scheduledDateTime.getUTCDay() || 7, // Convert 0=Sunday to 7
            driveTimeToPrevious: pythonJob.drive_time_from_previous,
            driveTimeToNext: pythonJob.drive_time_to_next,
            returnTripTime: pythonJob.return_trip_time,
          });
        }
      });
    });

    // Convert unscheduled jobs
    const unscheduledJobs: CloudRunJobData[] = pythonResponse.unscheduled_jobs
      .map(jobId => {
        const originalJob = jobsMap.get(jobId);
        return originalJob ? this.convertJobToCloudRunFormat(originalJob) : null;
      })
      .filter(Boolean) as CloudRunJobData[];

    return {
      success: pythonResponse.success,
      scheduledJobs,
      unscheduledJobs,
      console_logs: pythonResponse.console_logs,
      metrics: {
        totalJobs: pythonResponse.summary.total_jobs,
        scheduledJobs: pythonResponse.summary.scheduled_jobs,
        unscheduledJobs: pythonResponse.summary.unscheduled_jobs,
        averageJobsPerDay: pythonResponse.summary.days_used > 0 
          ? pythonResponse.summary.scheduled_jobs / pythonResponse.summary.days_used 
          : 0,
        totalDriveTime: pythonResponse.schedule.reduce((sum, day) => sum + day.total_travel_time, 0),
        totalWorkTime: pythonResponse.schedule.reduce((sum, day) => sum + day.total_work_time, 0),
      },
    };
  }

  /**
   * Send optimization request to Cloud Run service
   */
  async optimize(
    jobs: JobOptimizationData[],
    dateRange: { start: Date; end: Date },
    settings: {
      maxJobsPerDay?: number;
      allowedDays?: number[];
      startingPointAddress?: string;
    } = {}
  ): Promise<CloudRunOptimizationResponse> {
    try {
      if (!this.cloudRunUrl) {
        throw new Error('Cloud Run optimization URL not configured');
      }

      // Do geocoding once here
      console.log(`🗺️ Geocoding ${jobs.length} job locations...`);
      const geocodeMap = await batchGeocodeJobLocations(jobs);

      // Convert jobs to Cloud Run format with coordinates
      const cloudRunJobs = jobs.map(job => ({
        ...this.convertJobToCloudRunFormat(job),
        coordinates: geocodeMap.has(job.location) 
          ? [geocodeMap.get(job.location)!.lng, geocodeMap.get(job.location)!.lat] as [number, number]
          : undefined
      }));

      // Calculate distance matrix for OR Tools VRP
      console.log(`🗺️ Calculating distance matrix for OR Tools...`);
      const distanceMatrix = await calculateDistanceMatrixForCloudRun(
        jobs,
        settings.startingPointAddress,
        geocodeMap
      );

      // Prepare request payload with distance matrix for OR Tools
      const request: CloudRunOptimizationRequest = {
        jobs: cloudRunJobs,
        settings: {
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
          maxJobsPerDay: settings.maxJobsPerDay || 4,
          startingPointAddress: settings.startingPointAddress || "11020 Williams Rd Richmond, BC V7A 1X8",
          allowedDays: settings.allowedDays || [1, 2, 3, 4, 5], // Monday to Friday
        },
        // Include distance matrix for OR Tools VRP optimization
        distanceMatrix: distanceMatrix ? {
          locations: distanceMatrix.locations,
          coordinates: distanceMatrix.coordinates,
          distanceMatrix: distanceMatrix.distanceMatrix,
          durationMatrix: distanceMatrix.durationMatrix,
        } : undefined,
      };

      console.log(`🚀 Sending ${cloudRunJobs.length} jobs to Cloud Run for OR Tools optimization...`);
      if (distanceMatrix) {
        console.log(`📊 Including distance matrix (${distanceMatrix.locations.length} locations)`);
      }
      


      // Send request to Cloud Run
      const response = await fetch(`${this.cloudRunUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Run API error: ${response.status} - ${errorText}`);
      }

      const pythonResult: PythonOptimizationResponse = await response.json();

      console.log(`✅ Cloud Run optimization completed: ${pythonResult.summary.scheduled_jobs} jobs scheduled`);

      // Convert Python response to CloudRun format
      const result = this.convertPythonResponseToCloudRun(pythonResult, jobs);

      return result;
    } catch (error) {
      console.error('Cloud Run optimization error:', error);
      
      // Return error response
      return {
        success: false,
        scheduledJobs: [],
        unscheduledJobs: jobs.map(job => this.convertJobToCloudRunFormat(job)),
        error: error instanceof Error ? error.message : 'Unknown optimization error',
      };
    }
  }

  /**
   * Health check for Cloud Run service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.cloudRunUrl) {
        return false;
      }

      const response = await fetch(`${this.cloudRunUrl}/health`, {
        method: 'GET',
        headers: {
          ...(process.env.CLOUD_RUN_API_KEY && {
            'Authorization': `Bearer ${process.env.CLOUD_RUN_API_KEY}`
          }),
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Cloud Run health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const cloudRunOptimizer = new CloudRunOptimizer();
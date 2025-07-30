"use client";

import { useState } from "react";
import { CloudRunOptimizationResponse, CloudRunScheduledJob } from "../../../app/lib/schedulingOptimizations.types";
import { acceptOptimizedJob } from "../../../app/lib/actions/optimization.actions";
import { formatDateStringUTC } from "../../../app/lib/utils";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface OptimizationScheduleCompactProps {
  optimizationResult: CloudRunOptimizationResponse;
  appliedJobs: string[];
  onJobApplied: (jobId: string, results: any) => void;
}

// Utility function to format UTC time as 12-hour format
function formatUTCTime(date: Date): string {
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''}${period}`;
}

export default function OptimizationScheduleCompact({
  optimizationResult,
  appliedJobs,
  onJobApplied
}: OptimizationScheduleCompactProps) {
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set());
  
  // Group jobs by date using the scheduledDateTime
  const jobsByDate = new Map<string, CloudRunScheduledJob[]>();
  optimizationResult.scheduledJobs.forEach(job => {
    const dateKey = new Date(job.scheduledDateTime).toISOString().split('T')[0];
    if (dateKey) {
      if (!jobsByDate.has(dateKey)) {
        jobsByDate.set(dateKey, []);
      }
      jobsByDate.get(dateKey)!.push(job);
    }
  });

  const sortedDates = Array.from(jobsByDate.keys()).sort();
  const appliedJobsSet = new Set(appliedJobs);

  // Calculate totals from Python API data
  const totalDriveTime = optimizationResult.metrics?.totalDriveTime || 0;
  const totalWorkTime = optimizationResult.metrics?.totalWorkTime || 0;

  const handleIndividualJobApply = async (job: CloudRunScheduledJob) => {
    setApplyingJobs(prev => new Set([...prev, job.jobId]));
    
    try {
      const result = await acceptOptimizedJob(job);
      
      if (result.success) {
        onJobApplied(job.jobId, result);
        toast.success(`Applied job: ${job.originalJob.jobTitle}`);
      } else {
        toast.error(`Failed to apply job: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to apply job');
    } finally {
      setApplyingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.jobId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-gray-900">Scheduled Jobs by Date</h4>
        <div className="text-sm text-gray-600">
          {appliedJobs.length}/{optimizationResult.scheduledJobs.length} jobs applied
        </div>
      </div>

      {/* Total Metrics */}
      <div className="flex justify-center items-center space-x-6 text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-100">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Total Work:</span>
          <span className="text-green-600 font-semibold">{Math.round(totalWorkTime)}m</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">Total Drive:</span>
          <span className="text-orange-600 font-semibold">{Math.round(totalDriveTime)}m</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto">
        {sortedDates.map((dateKey) => {
          const jobs = jobsByDate.get(dateKey)!;
          // Sort by orderInRoute to maintain the optimized route order
          const sortedJobs = jobs.sort((a, b) => a.orderInRoute - b.orderInRoute);
          
          // Calculate metrics for this date using Python API data
          const dayWorkTime = jobs.reduce((sum, job) => sum + job.estimatedDuration, 0);
          
          // Calculate drive time for this day from individual jobs
          // Sum all driveTimeToPrevious (from depot/previous job to this job) + returnTripTime from last job
          const dayDriveTime = jobs.reduce((sum, job, index) => {
            // Add drive time to this job from previous location
            let driveTime = job.driveTimeToPrevious;
            // If this is the last job in the route, add return trip time to depot
            if (index === sortedJobs.length - 1) {
              driveTime += job.returnTripTime;
            }
            return sum + driveTime;
          }, 0);
          
          return (
            <div key={dateKey} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow min-h-[180px]">
              {/* Date Header */}
              <div className="mb-3 pb-2 border-b border-gray-100">
                <h5 className="font-semibold text-gray-900 text-sm">
                  {formatDateStringUTC(dateKey)}
                </h5>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex space-x-2 text-xs">
                    <span className="text-green-600 font-medium">{Math.round(dayWorkTime)}m</span>
                    <span className="text-orange-600 font-medium">{Math.round(dayDriveTime)}m</span>
                  </div>
                </div>
              </div>

              {/* Route Visualization */}
              <div className="space-y-1.5">
                {/* Starting Depot */}
                <div className="text-xs p-2 rounded-md border bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-blue-900">🏢 Depot</div>
                      <div className="text-blue-600 text-xs">Start</div>
                    </div>
                    <div className="text-right text-blue-500">
                      <div className="font-medium text-xs">→</div>
                    </div>
                  </div>
                </div>

                {/* Jobs with Drive Times */}
                {sortedJobs.map((job, index) => {
                  const isApplied = appliedJobsSet.has(job.jobId);
                  const isApplying = applyingJobs.has(job.jobId);
                  
                  return (
                    <div key={job.jobId}>
                      {/* Drive Time to Job */}
                      {job.driveTimeToPrevious > 0 && (
                        <div className="text-xs p-1.5 rounded-md border bg-orange-50 border-orange-200 mb-1">
                          <div className="flex items-center justify-center text-orange-700">
                            <span className="font-medium">🚗</span>
                            <span className="ml-1">{job.driveTimeToPrevious}m</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Job Card */}
                      <div className={`text-xs p-2.5 rounded-md border transition-colors ${
                        isApplied 
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{job.originalJob.jobTitle}</div>
                            <div className="text-gray-600 truncate text-xs">{job.originalJob.clientName}</div>
                            <div className="text-gray-500 text-xs truncate">{job.originalJob.location}</div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-2">
                            <div className="text-right text-gray-500">
                              <div className="font-semibold text-xs">{formatUTCTime(new Date(job.scheduledDateTime))}</div>
                              <div className="text-xs">{job.estimatedDuration}m</div>
                              <div className="text-xs text-gray-400">#{job.orderInRoute}</div>
                            </div>
                            
                            {/* Individual Apply Button */}
                            <button
                              onClick={() => handleIndividualJobApply(job)}
                              disabled={isApplying || isApplied}
                              className={`px-2 py-1 text-xs rounded-md transition-all ${
                                isApplied 
                                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                  : isApplying
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm'
                              }`}
                            >
                              {isApplying ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              ) : isApplied ? (
                                <CheckIcon className="w-3 h-3" />
                              ) : (
                                <PlusIcon className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Drive Time Back to Depot */}
                {sortedJobs.length > 0 && (() => {
                  const lastJob = sortedJobs[sortedJobs.length - 1];
                  return lastJob && lastJob.returnTripTime > 0 ? (
                    <div className="text-xs p-1.5 rounded-md border bg-blue-50 border-blue-200 mt-1">
                      <div className="flex items-center justify-center text-blue-700">
                        <span className="font-medium">🏢</span>
                        <span className="ml-1">{lastJob.returnTripTime}m</span>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Ending Depot */}
                <div className="text-xs p-2 rounded-md border bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-blue-900">🏢 Depot</div>
                      <div className="text-blue-600 text-xs">End</div>
                    </div>
                    <div className="text-right text-blue-500">
                      <div className="font-medium text-xs">✓</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

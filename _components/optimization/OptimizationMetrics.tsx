"use client";

import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface OptimizationMetricsProps {
  result: SerializedOptimizationResult;
}

export default function OptimizationMetrics({
  result,
}: OptimizationMetricsProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    return format(toZonedTime(new Date(dateString), "UTC"), "MMMM do, yyyy");
  };

  const utilizationPercentage = (result.metrics.utilizationRate * 100).toFixed(
    1,
  );
  const avgJobsPerDay = result.metrics.averageJobsPerDay.toFixed(1);

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Optimization Results
        </h3>
        <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          {result.strategy.replace(/_/g, " ").toUpperCase()}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-600">Total Jobs</div>
          <div className="text-2xl font-bold text-blue-900">
            {result.scheduledGroups.reduce(
              (sum, group) => sum + group.jobs.length,
              0,
            )}
            <span className="text-sm font-normal text-blue-600">
              /{result.totalJobs}
            </span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            {result.unscheduledJobs.length} unscheduled
          </div>
        </div>

        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-sm font-medium text-green-600">
            Utilization Rate
          </div>
          <div className="text-2xl font-bold text-green-900">
            {utilizationPercentage}%
          </div>
          <div className="mt-1 text-xs text-green-600">
            Jobs successfully scheduled
          </div>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <div className="text-sm font-medium text-orange-600">
            Total Drive Time
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {formatDuration(result.metrics.totalDriveTime)}
          </div>
          <div className="mt-1 text-xs text-orange-600">
            Including depot travel
          </div>
        </div>

        <div className="rounded-lg bg-purple-50 p-4">
          <div className="text-sm font-medium text-purple-600">
            Jobs per Day
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {avgJobsPerDay}
          </div>
          <div className="mt-1 text-xs text-purple-600">
            Average distribution
          </div>
        </div>
      </div>

      {/* Schedule Groups Summary */}
      <div className="border-t pt-6">
        <h4 className="mb-4 text-lg font-medium text-gray-900">
          Schedule Groups ({result.scheduledGroups.length} days)
        </h4>

        <div className="space-y-3">
          {result.scheduledGroups.map((group, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {group.clusterName}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(group.date)} • {group.jobs.length} jobs
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatDuration(group.totalDriveTime)} drive
                </div>
                <div className="text-sm text-gray-600">
                  {formatDuration(group.totalWorkTime)} work
                </div>
              </div>

              <div className="ml-4">
                {group.routeOptimized ? (
                  <span
                    className="inline-block h-3 w-3 rounded-full bg-green-500"
                    title="Route optimized"
                  ></span>
                ) : (
                  <span
                    className="inline-block h-3 w-3 rounded-full bg-yellow-500"
                    title="Not optimized"
                  ></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unscheduled Jobs */}
      {result.unscheduledJobs.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h4 className="mb-4 text-lg font-medium text-red-600">
            Unscheduled Jobs ({result.unscheduledJobs.length})
          </h4>

          <div className="space-y-2">
            {result.unscheduledJobs.slice(0, 5).map((job, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded bg-red-50 p-2"
              >
                <div>
                  <div className="font-medium text-red-900">{job.jobTitle}</div>
                  <div className="text-sm text-red-600">{job.location}</div>
                </div>
                <div className="text-sm text-red-600">
                  Due: {formatDate(job.dateDue)}
                </div>
              </div>
            ))}
            {result.unscheduledJobs.length > 5 && (
              <div className="py-2 text-center text-sm text-gray-500">
                And {result.unscheduledJobs.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

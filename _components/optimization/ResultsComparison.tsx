"use client";

import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface ResultsComparisonProps {
  results: SerializedOptimizationResult[];
}

export default function ResultsComparison({ results }: ResultsComparisonProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTime = (dateString: string): string => {
    return format(toZonedTime(new Date(dateString), "UTC"), "HH:mm:ss");
  };

  const getBestValue = (
    values: number[],
    isHigherBetter: boolean = false,
  ): number => {
    return isHigherBetter ? Math.max(...values) : Math.min(...values);
  };

  const isBestValue = (
    value: number,
    values: number[],
    isHigherBetter: boolean = false,
  ): boolean => {
    const bestValue = getBestValue(values, isHigherBetter);
    return Math.abs(value - bestValue) < 0.001; // Account for floating point precision
  };

  const utilizationRates = results.map((r) => r.metrics.utilizationRate);
  const driveTimes = results.map((r) => r.metrics.totalDriveTime);
  const avgJobsPerDay = results.map((r) => r.metrics.averageJobsPerDay);
  const scheduledCounts = results.map((r) =>
    r.scheduledGroups.reduce((sum, group) => sum + group.jobs.length, 0),
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-6 text-xl font-semibold text-gray-900">
        Algorithm Comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                Algorithm
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                Jobs Scheduled
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                Utilization Rate
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                Total Drive Time
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                Avg Jobs/Day
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                Groups Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {/* Algorithm Name */}
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {result.strategy
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                  <div className="text-xs text-gray-500">
                    Generated: {formatTime(result.generatedAt)} UTC
                  </div>
                </td>

                {/* Jobs Scheduled */}
                <td className="px-4 py-3 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isBestValue(
                        scheduledCounts[index]!,
                        scheduledCounts,
                        true,
                      )
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {scheduledCounts[index]}
                    <span className="text-gray-500">/{result.totalJobs}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {result.unscheduledJobs.length} unscheduled
                  </div>
                </td>

                {/* Utilization Rate */}
                <td className="px-4 py-3 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isBestValue(
                        result.metrics.utilizationRate,
                        utilizationRates,
                        true,
                      )
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {(result.metrics.utilizationRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">efficiency</div>
                </td>

                {/* Drive Time */}
                <td className="px-4 py-3 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isBestValue(
                        result.metrics.totalDriveTime,
                        driveTimes,
                        false,
                      )
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatDuration(result.metrics.totalDriveTime)}
                  </div>
                  <div className="text-xs text-gray-500">including depot</div>
                </td>

                {/* Avg Jobs per Day */}
                <td className="px-4 py-3 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isBestValue(
                        result.metrics.averageJobsPerDay,
                        avgJobsPerDay,
                        true,
                      )
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {result.metrics.averageJobsPerDay.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">distribution</div>
                </td>

                {/* Groups Created */}
                <td className="px-4 py-3 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {result.scheduledGroups.length}
                  </div>
                  <div className="text-xs text-gray-500">work days</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Analysis */}
      <div className="mt-6 border-t pt-6">
        <h4 className="mb-4 text-lg font-medium text-gray-900">
          Performance Analysis
        </h4>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Drive Time Efficiency */}
          <div className="rounded-lg bg-orange-50 p-4">
            <h5 className="mb-2 font-medium text-orange-900">
              🚗 Drive Time Efficiency
            </h5>
            <div className="space-y-2">
              {results.map((result, index) => {
                const totalWorkTime = result.scheduledGroups.reduce(
                  (sum, group) => sum + group.totalWorkTime,
                  0,
                );
                const efficiency =
                  totalWorkTime /
                  (totalWorkTime + result.metrics.totalDriveTime);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-orange-800">
                      {result.strategy.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {(efficiency * 100).toFixed(1)}% work vs drive
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Density */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h5 className="mb-2 font-medium text-blue-900">
              📊 Schedule Density
            </h5>
            <div className="space-y-2">
              {results.map((result, index) => {
                const jobsPerGroup =
                  scheduledCounts[index]! / result.scheduledGroups.length;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-blue-800">
                      {result.strategy.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-blue-900">
                      {jobsPerGroup.toFixed(1)} jobs/group
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Declaration */}
      {results.length > 1 && (
        <div className="mt-6 rounded-lg border-t bg-green-50 p-4 pt-6">
          <h4 className="mb-2 text-lg font-medium text-green-900">
            🏆 Best Performing Algorithm
          </h4>
          <p className="text-sm text-green-800">
            Based on utilization rate, drive time efficiency, and job
            distribution.
            {/* You could add more sophisticated scoring logic here */}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded bg-green-600"></div>
            <span>Best value</span>
          </div>
          <span>Higher utilization rate and lower drive time are better</span>
        </div>
      </div>
    </div>
  );
}

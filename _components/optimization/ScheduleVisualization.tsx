"use client";

import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface ScheduleVisualizationProps {
  result: SerializedOptimizationResult;
}

export default function ScheduleVisualization({
  result,
}: ScheduleVisualizationProps) {
  const formatTime = (dateString: string): string => {
    return format(toZonedTime(new Date(dateString), "UTC"), "HH:mm");
  };

  const formatDate = (dateString: string): string => {
    return format(toZonedTime(new Date(dateString), "UTC"), "EEEE, MMMM do, yyyy");
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getClusterColor = (clusterName: string): string => {
    const colors = {
      "Bowen Island": "bg-blue-100 border-blue-300 text-blue-800",
      "Vancouver Core": "bg-green-100 border-green-300 text-green-800",
      "North Vancouver": "bg-purple-100 border-purple-300 text-purple-800",
      "Burnaby/New Westminster":
        "bg-orange-100 border-orange-300 text-orange-800",
      Richmond: "bg-pink-100 border-pink-300 text-pink-800",
      "Surrey/Langley": "bg-indigo-100 border-indigo-300 text-indigo-800",
      "Whistler Area": "bg-teal-100 border-teal-300 text-teal-800",
      "Fraser Valley": "bg-yellow-100 border-yellow-300 text-yellow-800",
      Unassigned: "bg-gray-100 border-gray-300 text-gray-800",
    };

    return (
      colors[clusterName as keyof typeof colors] ||
      "bg-gray-100 border-gray-300 text-gray-800"
    );
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-6 text-xl font-semibold text-gray-900">
        Schedule Visualization
      </h3>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {result.scheduledGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={`rounded-lg border-2 p-3 ${getClusterColor(group.clusterName)} transition-all hover:shadow-lg`}
          >
            {/* Group Header */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold">{group.clusterName}</h4>
                <p className="text-xs opacity-75">
                  {formatDate(group.date)}
                </p>
              </div>

              <div className="text-right text-xs">
                <div className="font-medium">
                  👷 {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
                </div>
                <div className="opacity-75">
                  🚗 {formatDuration(group.totalDriveTime)} • ⏱️ {formatDuration(group.totalWorkTime)}
                </div>
              </div>
            </div>

            {/* Jobs Timeline - Compact */}
            <div className="space-y-2">
              {group.jobs.map((job, jobIndex) => (
                <div
                  key={jobIndex}
                  className="group relative rounded border border-gray-200 bg-white bg-opacity-80 p-2 transition-all hover:shadow-md hover:bg-opacity-100"
                  title={`${job.originalJob.jobTitle} at ${job.originalJob.location}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white flex-shrink-0">
                        {job.orderInRoute}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-medium text-gray-900 truncate">
                          {job.originalJob.jobTitle}
                        </h5>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>🕐 {formatTime(job.scheduledTime)} UTC</span>
                          <span>⏱️ {formatDuration(job.estimatedDuration)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Indicator */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <div
                        className={`h-2 w-2 rounded-full ${getConfidenceColor(job.confidence)}`}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {(job.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute z-10 left-0 top-full mt-1 w-80 rounded-lg border bg-white p-3 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                    <div className="space-y-2">
                      <div>
                        <h6 className="font-medium text-gray-900">{job.originalJob.jobTitle}</h6>
                        <p className="text-sm text-gray-600">{job.originalJob.location}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>⏰ Start: {formatTime(job.scheduledTime)} UTC</div>
                        <div>⏱️ Duration: {formatDuration(job.estimatedDuration)}</div>
                        <div>📅 Due: {format(toZonedTime(new Date(job.originalJob.dateDue), "UTC"), "MMM dd")}</div>
                        <div>🎯 Confidence: {(job.confidence * 100).toFixed(0)}%</div>
                        {job.driveTimeToPrevious > 0 && (
                          <div>🚗 From prev: {job.driveTimeToPrevious}m</div>
                        )}
                        {job.driveTimeToNext > 0 && (
                          <div>🚗 To next: {job.driveTimeToNext}m</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Route Summary */}
            <div className="mt-4 border-t border-gray-200 border-opacity-50 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Route: Depot →{" "}
                  {group.jobs
                    .map((job) => job.originalJob.jobTitle.split(" ")[0])
                    .join(" → ")}{" "}
                  → Depot
                </span>
                {group.routeOptimized && (
                  <span className="rounded bg-green-600 px-2 py-1 text-xs text-white">
                    ✓ TSP Optimized
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 border-t pt-6">
        <h4 className="mb-3 text-sm font-medium text-gray-900">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>High confidence (80%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <span>Medium confidence (50-79%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span>Low confidence (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

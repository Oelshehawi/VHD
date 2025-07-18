"use client";

import { useState, useTransition } from "react";
import { runOptimization } from "../../app/lib/actions/optimization.actions";
import {
  SchedulingStrategy,
  SerializedOptimizationResult,
  SerializedJobOptimizationData,
  SerializedSchedulingPreferencesType,
  SerializedDateRange,
} from "../../app/lib/schedulingOptimizations.types";
import OptimizationMetrics from "./OptimizationMetrics";
import AlgorithmSelector from "./AlgorithmSelector";
import ScheduleVisualization from "./ScheduleVisualization";
import ResultsComparison from "./ResultsComparison";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface OptimizationDashboardProps {
  initialPreferences: SerializedSchedulingPreferencesType;
  initialUnscheduledJobs: SerializedJobOptimizationData[];
  initialDateRange: SerializedDateRange;
}

export default function OptimizationDashboard({
  initialPreferences,
  initialUnscheduledJobs,
  initialDateRange,
}: OptimizationDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [currentResult, setCurrentResult] = useState<SerializedOptimizationResult | null>(
    null,
  );
  const [comparisonResults, setComparisonResults] = useState<
    SerializedOptimizationResult[]
  >([]);
  const [selectedStrategy, setSelectedStrategy] = useState<SchedulingStrategy>(
    SchedulingStrategy.HYBRID_HISTORICAL_EFFICIENCY,
  );

  // Helper function to convert serialized date range back to Date objects
  const deserializeDateRange = (range: SerializedDateRange) => ({
    start: new Date(range.start),
    end: new Date(range.end),
  });

  const handleRunOptimization = () => {
    startTransition(async () => {
      try {
        const result = await runOptimization(
          selectedStrategy,
          deserializeDateRange(initialDateRange),
        );

        if (result.success && result.data) {
          setCurrentResult(result.data);

          // Add to comparison if not already there
          setComparisonResults((prev) => {
            const existing = prev.find(
              (r) => r.strategy === result.data!.strategy,
            );
            if (existing) {
              return prev.map((r) =>
                r.strategy === result.data!.strategy ? result.data! : r,
              );
            }
            return [...prev, result.data!];
          });
        } else {
          console.error("Optimization failed:", result.error);
        }
      } catch (error) {
        console.error("Error running optimization:", error);
      }
    });
  };

  const handleClearComparison = () => {
    setComparisonResults([]);
    setCurrentResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Algorithm Selection */}
          <div className="lg:col-span-1">
            <AlgorithmSelector
              selectedStrategy={selectedStrategy}
              onStrategyChange={setSelectedStrategy}
              disabled={isPending}
            />
          </div>

          {/* Job Overview */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Unscheduled Jobs
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Jobs:</span>
                  <span className="text-sm font-medium">
                    {initialUnscheduledJobs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date Range:</span>
                  <span className="text-sm font-medium">
                    {format(toZonedTime(new Date(initialDateRange.start), "UTC"), "MMMM do, yyyy")} -{" "}
                    {format(toZonedTime(new Date(initialDateRange.end), "UTC"), "MMMM do, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Depot:</span>
                  <span className="text-sm font-medium text-green-600">
                    {initialPreferences.globalSettings.startingPointAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-end space-y-3 lg:col-span-1">
            <button
              onClick={handleRunOptimization}
              disabled={isPending}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isPending ? "Optimizing..." : "Run Optimization"}
            </button>

            {comparisonResults.length > 0 && (
              <button
                onClick={handleClearComparison}
                className="w-full rounded-lg bg-gray-500 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-gray-600"
              >
                Clear Results
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {currentResult && (
        <>
          {/* Current Result Metrics */}
          <OptimizationMetrics result={currentResult} />

          {/* Visualization */}
          <ScheduleVisualization result={currentResult} />
        </>
      )}

      {/* Comparison Section */}
      {comparisonResults.length > 1 && (
        <ResultsComparison results={comparisonResults} />
      )}

      {/* Loading Overlay */}
      {isPending && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="mx-4 max-w-sm rounded-lg bg-white p-6">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="font-medium text-gray-900">
                Running optimization...
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              This may take a few moments while we calculate optimal routes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

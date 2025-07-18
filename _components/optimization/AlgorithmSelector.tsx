"use client";

import { SchedulingStrategy } from "../../app/lib/schedulingOptimizations.types";

interface AlgorithmSelectorProps {
  selectedStrategy: SchedulingStrategy;
  onStrategyChange: (strategy: SchedulingStrategy) => void;
  disabled?: boolean;
}

const strategyInfo = {
  [SchedulingStrategy.HYBRID_HISTORICAL_EFFICIENCY]: {
    name: "Custom Hybrid Algorithm",
    description:
      "Combines historical patterns with drive time minimization using nearest neighbor TSP",
    features: [
      "Historical pattern analysis",
      "Geographic clustering",
      "Nearest neighbor TSP",
      "Depot travel calculation",
      "Real distance matrix",
    ],
  },
};

export default function AlgorithmSelector({
  selectedStrategy,
  onStrategyChange,
  disabled = false,
}: AlgorithmSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Algorithm Selection
      </h3>

      <div className="space-y-3">
        {Object.entries(strategyInfo).map(([strategy, info]) => (
          <div key={strategy} className="rounded-lg border p-4">
            <label className="flex cursor-pointer items-start space-x-3">
              <input
                type="radio"
                name="strategy"
                value={strategy}
                checked={selectedStrategy === strategy}
                onChange={(e) =>
                  onStrategyChange(e.target.value as SchedulingStrategy)
                }
                disabled={disabled}
                className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{info.name}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {info.description}
                </div>
                <div className="mt-2">
                  <div className="mb-1 text-xs text-gray-500">Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {info.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
        <div className="mb-1 font-medium">Note:</div>
        OpenRouteService optimization will be added next for comparison.
      </div>
    </div>
  );
}

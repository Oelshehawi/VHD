"use client";

import { CalendarIcon, MapPinIcon, BeakerIcon } from "@heroicons/react/24/outline";

interface OptimizationSetupProps {
  startDate: string;
  endDate: string;
  startingAddress: string;
  unscheduledJobsCount: number | undefined;
  maxJobsPerDay: number;
  isLoadingSetup: boolean;
  setupError: any;
  isPending: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onStartingAddressChange: (address: string) => void;
  onRunOptimization: () => void;
}

export default function OptimizationSetup({
  startDate,
  endDate,
  startingAddress,
  unscheduledJobsCount,
  maxJobsPerDay,
  isLoadingSetup,
  setupError,
  isPending,
  onStartDateChange,
  onEndDateChange,
  onStartingAddressChange,
  onRunOptimization,
}: OptimizationSetupProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Setup Optimization</h3>
        <p className="text-gray-600">Configure your optimization preferences and run the algorithm</p>
      </div>

      {isLoadingSetup ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Loading setup data...</span>
        </div>
      ) : setupError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Error loading setup data. Please try refreshing the page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Algorithm Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-900 mb-3">Algorithm Selection</h4>
                <div className="bg-white border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <input type="radio" checked readOnly className="text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Hybrid Historical Efficiency</div>
                      <div className="text-sm text-gray-600">Combines historical patterns with route optimization</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range Configuration */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Optimization Date Range
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Starting Address Configuration */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  Starting Point (Depot)
                </h4>
                <input
                  type="text"
                  value={startingAddress}
                  onChange={(e) => onStartingAddressChange(e.target.value)}
                  placeholder="Enter starting address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">This is where technicians start and end their routes</p>
              </div>

              {/* Job Overview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-green-900 mb-3">Job Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Unscheduled Jobs:</span>
                    <span className="font-medium text-green-900">{unscheduledJobsCount || 0} jobs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Date Range:</span>
                    <span className="font-medium text-green-900 text-xs">
                      {startDate && endDate ? `${startDate} to ${endDate}` : "Select dates"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Max Jobs/Day:</span>
                    <span className="font-medium text-green-900">{maxJobsPerDay || 4}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={onRunOptimization}
              disabled={isPending || !startDate || !endDate || !startingAddress || unscheduledJobsCount === 0 || unscheduledJobsCount === undefined}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Running Optimization...</span>
                </>
              ) : (
                <>
                  <BeakerIcon className="w-5 h-5" />
                  <span>
                    {unscheduledJobsCount === undefined
                      ? "Loading Jobs..." 
                      : unscheduledJobsCount === 0 
                      ? "No Jobs to Optimize" 
                      : "Run Optimization"
                    }
                  </span>
                </>
              )}
            </button>
            
            {unscheduledJobsCount === 0 && (
              <p className="mt-2 text-sm text-orange-600">
                No unscheduled jobs found for the selected date range. Try adjusting the dates.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
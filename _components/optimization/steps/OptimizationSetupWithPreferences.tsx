"use client";

import { useState } from "react";
import { CalendarIcon, MapPinIcon, BeakerIcon, CogIcon } from "@heroicons/react/24/outline";

interface OptimizationSetupWithPreferencesProps {
  isPending: boolean;
  onRunOptimization: (config: {
    dateRange: { start: Date; end: Date };
    preferences: {
      maxJobsPerDay: number;
      allowedDays: number[];
      startingPointAddress: string;
    };
  }) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
];

export default function OptimizationSetupWithPreferences({
  isPending,
  onRunOptimization,
}: OptimizationSetupWithPreferencesProps) {
  // Internal form state
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [startingAddress, setStartingAddress] = useState("11020 Williams Rd Richmond, BC V7A 1X8");
  const [allowedDays, setAllowedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday-Friday default
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(4);

  const handleDayToggle = (dayValue: number) => {
    if (allowedDays.includes(dayValue)) {
      setAllowedDays(allowedDays.filter(day => day !== dayValue));
    } else {
      setAllowedDays([...allowedDays, dayValue].sort());
    }
  };

  const canRunOptimization = 
    startDate && 
    endDate && 
    startingAddress && 
    allowedDays.length > 0 && 
    maxJobsPerDay > 0;

  const handleRunOptimization = () => {
    if (!canRunOptimization) return;

    onRunOptimization({
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate),
      },
      preferences: {
        maxJobsPerDay,
        allowedDays,
        startingPointAddress: startingAddress,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Setup Cloud Run Optimization</h3>
        <p className="text-gray-600">Configure your preferences for Google OR Tools optimization</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - All Inputs */}
        <div className="space-y-6">
          {/* Date Range */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Date Range
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Starting Address */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2" />
              Starting Point
            </h4>
            <input
              type="text"
              value={startingAddress}
              onChange={(e) => setStartingAddress(e.target.value)}
              placeholder="Enter starting address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">Where technicians start and end their routes</p>
          </div>

          {/* Work Settings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <CogIcon className="w-5 h-5 mr-2" />
              Work Settings
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Jobs Per Day
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxJobsPerDay}
                onChange={(e) => setMaxJobsPerDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Allowed Days */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-blue-900 mb-3">Allowed Scheduling Days</h4>
            <p className="text-sm text-blue-700 mb-3">Select which days jobs can be scheduled</p>
            
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: allowedDays.includes(day.value) ? '#dbeafe' : 'white',
                    borderColor: allowedDays.includes(day.value) ? '#3b82f6' : '#d1d5db',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allowedDays.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{day.short}</div>
                    <div className="text-xs text-gray-500">{day.label}</div>
                  </div>
                </label>
              ))}
            </div>

            {allowedDays.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                Please select at least one day for scheduling
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Run Button */}
      <div className="mt-8">
        <button
          onClick={handleRunOptimization}
          disabled={isPending || !canRunOptimization}
          className="w-full inline-flex items-center justify-center space-x-3 px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
        >
          {isPending ? (
            <>
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Sending to Cloud Run...</span>
            </>
          ) : (
            <>
              <BeakerIcon className="w-5 h-5" />
              <span>
                {!canRunOptimization
                  ? "Complete Setup to Continue"
                  : "Run Cloud Optimization"
                }
              </span>
            </>
          )}
        </button>
        
        {!canRunOptimization && (
          <p className="mt-2 text-sm text-orange-600 text-center">
            Please complete all required fields before running optimization.
          </p>
        )}
      </div>
    </div>
  );
} 
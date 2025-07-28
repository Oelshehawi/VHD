"use client";

import { useState } from "react";
import { CalendarIcon, MapPinIcon, BeakerIcon, ClockIcon, CogIcon } from "@heroicons/react/24/outline";

interface OptimizationSetupWithPreferencesProps {
  startDate: string;
  endDate: string;
  startingAddress: string;
  allowedDays: number[];
  maxJobsPerDay: number;
  workDayStart: string;
  workDayEnd: string;
  unscheduledJobsCount: number | undefined;
  isLoadingSetup: boolean;
  setupError: any;
  isPending: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onStartingAddressChange: (address: string) => void;
  onAllowedDaysChange: (days: number[]) => void;
  onMaxJobsPerDayChange: (count: number) => void;
  onWorkDayStartChange: (time: string) => void;
  onWorkDayEndChange: (time: string) => void;
  onRunOptimization: () => void;
}

type SetupTab = "basic" | "preferences";

const SETUP_TABS = [
  { id: "basic", label: "Basic Setup", icon: BeakerIcon },
  { id: "preferences", label: "Schedule Preferences", icon: CogIcon },
] as const;

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
  startDate,
  endDate,
  startingAddress,
  allowedDays,
  maxJobsPerDay,
  workDayStart,
  workDayEnd,
  unscheduledJobsCount,
  isLoadingSetup,
  setupError,
  isPending,
  onStartDateChange,
  onEndDateChange,
  onStartingAddressChange,
  onAllowedDaysChange,
  onMaxJobsPerDayChange,
  onWorkDayStartChange,
  onWorkDayEndChange,
  onRunOptimization,
}: OptimizationSetupWithPreferencesProps) {
  const [activeTab, setActiveTab] = useState<SetupTab>("basic");

  const handleDayToggle = (dayValue: number) => {
    if (allowedDays.includes(dayValue)) {
      onAllowedDaysChange(allowedDays.filter(day => day !== dayValue));
    } else {
      onAllowedDaysChange([...allowedDays, dayValue].sort());
    }
  };

  const canRunOptimization = 
    startDate && 
    endDate && 
    startingAddress && 
    allowedDays.length > 0 && 
    maxJobsPerDay > 0 && 
    unscheduledJobsCount !== undefined && 
    unscheduledJobsCount > 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="space-y-6">
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
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Allowed Days */}
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-blue-900 mb-4">Allowed Scheduling Days</h4>
                  <p className="text-sm text-blue-700 mb-4">Select which days jobs can be scheduled</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors"
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

              {/* Right Column - Work Settings */}
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CogIcon className="w-5 h-5 mr-2" />
                    Work Settings
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Jobs Per Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={maxJobsPerDay}
                        onChange={(e) => onMaxJobsPerDayChange(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work Day Start
                        </label>
                        <input
                          type="time"
                          value={workDayStart}
                          onChange={(e) => onWorkDayStartChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work Day End
                        </label>
                        <input
                          type="time"
                          value={workDayEnd}
                          onChange={(e) => onWorkDayEndChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>


                  </div>
                </div>

                {/* Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">Summary</h5>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Scheduling:</strong> {allowedDays.length} days selected
                      {allowedDays.length > 0 && (
                        <span className="ml-1">
                          ({DAYS_OF_WEEK.filter(d => allowedDays.includes(d.value)).map(d => d.short).join(", ")})
                        </span>
                      )}
                    </p>
                                         <p><strong>Capacity:</strong> {maxJobsPerDay} jobs per day</p>
                     <p><strong>Hours:</strong> {workDayStart} - {workDayEnd}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
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
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {SETUP_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SetupTab)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {renderTabContent()}
          </div>

          {/* Run Optimization Button */}
          <div className="text-center mt-8">
            <button
              onClick={onRunOptimization}
              disabled={isPending || !canRunOptimization}
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

            {!canRunOptimization && unscheduledJobsCount !== undefined && unscheduledJobsCount > 0 && (
              <p className="mt-2 text-sm text-orange-600">
                Please complete all required fields in both tabs before running optimization.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
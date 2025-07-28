"use client";

import { ClockIcon, CogIcon } from "@heroicons/react/24/outline";

interface SchedulePreferencesProps {
  allowedDays: number[];
  maxJobsPerDay: number;
  workDayStart: string;
  workDayEnd: string;
  onAllowedDaysChange: (days: number[]) => void;
  onMaxJobsPerDayChange: (count: number) => void;
  onWorkDayStartChange: (time: string) => void;
  onWorkDayEndChange: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
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

export default function SchedulePreferences({
  allowedDays,
  maxJobsPerDay,
  workDayStart,
  workDayEnd,
  onAllowedDaysChange,
  onMaxJobsPerDayChange,
  onWorkDayStartChange,
  onWorkDayEndChange,
  onNext,
  onBack,
}: SchedulePreferencesProps) {
  const handleDayToggle = (dayValue: number) => {
    if (allowedDays.includes(dayValue)) {
      onAllowedDaysChange(allowedDays.filter(day => day !== dayValue));
    } else {
      onAllowedDaysChange([...allowedDays, dayValue].sort());
    }
  };

  const canProceed = allowedDays.length > 0 && maxJobsPerDay > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Schedule Preferences</h3>
        <p className="text-gray-600">Configure when and how jobs should be scheduled</p>
      </div>

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

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Setup
        </button>
        
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Results →
        </button>
      </div>
    </div>
  );
} 
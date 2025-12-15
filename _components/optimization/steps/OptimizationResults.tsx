"use client";

import { useState } from "react";
import { CalendarIcon, ListBulletIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { CloudRunOptimizationResponse } from "../../../app/lib/schedulingOptimizations.types";
import OptimizationScheduleCompact from "../tabs/OptimizationScheduleCompact";
import OptimizationUnscheduled from "../tabs/OptimizationUnscheduled";

interface OptimizationResultsProps {
  optimizationResult: CloudRunOptimizationResponse;
  onBack: () => void;
  appliedJobs?: string[];
  onJobApplied?: (jobId: string, results: any) => void;
}

type ResultTab = "schedule" | "unscheduled";

const RESULT_TABS = [
  { id: "schedule", label: "Schedule", icon: CalendarIcon },
  { id: "unscheduled", label: "Unscheduled", icon: ListBulletIcon },
] as const;

export default function OptimizationResults({
  optimizationResult,
  onBack,
  appliedJobs = [],
  onJobApplied,
}: OptimizationResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("schedule");

  // Calculate key metrics from Python API data
  const totalJobs = optimizationResult.metrics?.totalJobs || 0;
  const scheduledJobs = optimizationResult.metrics?.scheduledJobs || 0;
  const unscheduledJobs = optimizationResult.metrics?.unscheduledJobs || 0;
  const totalDriveTime = optimizationResult.metrics?.totalDriveTime || 0;
  const totalWorkTime = optimizationResult.metrics?.totalWorkTime || 0;
  
  // Calculate days used from scheduled jobs
  const daysUsed = new Set(optimizationResult.scheduledJobs.map(job => new Date(job.scheduledDateTime).toISOString().split('T')[0])).size;
  
  const driveWorkRatio = totalWorkTime > 0 ? (totalDriveTime / totalWorkTime).toFixed(2) : '0.00';
  const averageDriveTimePerDay = daysUsed > 0 ? Math.round(totalDriveTime / daysUsed) : 0;

  // Show error state if optimization failed
  if (!optimizationResult.success) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Optimization Failed</h3>
        <p className="text-gray-600 mb-6">{optimizationResult.error || "Unknown error occurred"}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Setup
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "schedule":
        return (
          <OptimizationScheduleCompact 
            optimizationResult={optimizationResult}
            appliedJobs={appliedJobs}
            onJobApplied={onJobApplied!}
          />
        );
      
      case "unscheduled":
        return <OptimizationUnscheduled optimizationResult={optimizationResult} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Cloud Run Optimization Results</h3>
        <p className="text-gray-600 mb-4">Review the optimized schedule and apply jobs as needed</p>
        
        {/* Key Metrics */}
        <div className="flex justify-center items-center space-x-6 text-sm text-gray-600 bg-linear-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Drive/Work Ratio:</span>
            <span className="text-blue-600 font-semibold">{driveWorkRatio}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Avg Drive/Day:</span>
            <span className="text-orange-600 font-semibold">{averageDriveTimePerDay}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Jobs:</span>
            <span className="text-green-600 font-semibold">{scheduledJobs}/{totalJobs}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Days:</span>
            <span className="text-purple-600 font-semibold">{daysUsed}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {RESULT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ResultTab)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === "unscheduled" && optimizationResult.unscheduledJobs.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 text-xs rounded-full px-2 py-0.5">
                    {optimizationResult.unscheduledJobs.length}
                  </span>
                )}
                {tab.id === "schedule" && appliedJobs.length > 0 && (
                  <span className="bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5">
                    {appliedJobs.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Setup
        </button>
      </div>
    </div>
  );
} 
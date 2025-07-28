"use client";

import { useState } from "react";
import { ChartBarIcon, CalendarIcon, ListBulletIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { SerializedOptimizationResult } from "../../../app/lib/schedulingOptimizations.types";

interface OptimizationResultsProps {
  optimizationResult: SerializedOptimizationResult;
  onPreviewInCalendar: () => void;
  onBack: () => void;
}

type ResultTab = "overview" | "schedule" | "metrics" | "unscheduled";

const RESULT_TABS = [
  { id: "overview", label: "Overview", icon: ChartBarIcon },
  { id: "schedule", label: "Schedule", icon: CalendarIcon },
  { id: "metrics", label: "Metrics", icon: ListBulletIcon },
  { id: "unscheduled", label: "Unscheduled", icon: ListBulletIcon },
] as const;

export default function OptimizationResults({
  optimizationResult,
  onPreviewInCalendar,
  onBack,
}: OptimizationResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("overview");

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {optimizationResult.scheduledGroups.reduce((sum, group) => sum + group.jobs.length, 0)}
                  <span className="text-sm font-normal">/{optimizationResult.totalJobs}</span>
                </div>
                <div className="text-sm text-green-600">Jobs Scheduled</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(optimizationResult.metrics.utilizationRate * 100)}%
                </div>
                <div className="text-sm text-blue-600">Efficiency</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {Math.round(optimizationResult.metrics.totalDriveTime / 60)}h
                </div>
                <div className="text-sm text-orange-600">Drive Time</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {optimizationResult.metrics.averageJobsPerDay.toFixed(1)}
                </div>
                <div className="text-sm text-purple-600">Jobs/Day</div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Optimization Summary</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Schedule Overview</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Total Days: {optimizationResult.scheduledGroups.length}</p>
                    <p>Jobs Scheduled: {optimizationResult.scheduledGroups.reduce((sum, group) => sum + group.jobs.length, 0)}</p>
                    <p>Jobs Unscheduled: {optimizationResult.unscheduledJobs.length}</p>
                    <p>Strategy: {optimizationResult.strategy}</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Performance</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Total Drive Time: {Math.round(optimizationResult.metrics.totalDriveTime)} minutes</p>
                    <p>Utilization Rate: {Math.round(optimizationResult.metrics.utilizationRate * 100)}%</p>
                    <p>Conflicts Resolved: {optimizationResult.metrics.conflictsResolved || 0}</p>
                    <p>Generated: {new Date(optimizationResult.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Optimized Schedule</h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {optimizationResult.scheduledGroups.map((group, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {new Date(group.date).toLocaleDateString()} - {group.clusterName}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {group.jobs.length} jobs • {Math.round(group.totalDriveTime)} min drive time
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(group.estimatedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(group.estimatedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.jobs.map((job, jobIndex) => (
                      <div key={job.jobId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-medium text-gray-500">#{jobIndex + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{job.originalJob.jobTitle}</p>
                            <p className="text-xs text-gray-600">{job.originalJob.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">
                            {new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-500">{job.estimatedDuration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "metrics":
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Detailed Metrics</h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Efficiency Metrics</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization Rate:</span>
                    <span className="font-medium">{Math.round(optimizationResult.metrics.utilizationRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Jobs/Day:</span>
                    <span className="font-medium">{optimizationResult.metrics.averageJobsPerDay.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Drive Time:</span>
                    <span className="font-medium">{Math.round(optimizationResult.metrics.totalDriveTime)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conflicts Resolved:</span>
                    <span className="font-medium">{optimizationResult.metrics.conflictsResolved || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Schedule Distribution</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Jobs:</span>
                    <span className="font-medium">{optimizationResult.totalJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jobs Scheduled:</span>
                    <span className="font-medium text-green-600">
                      {optimizationResult.scheduledGroups.reduce((sum, group) => sum + group.jobs.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jobs Unscheduled:</span>
                    <span className="font-medium text-orange-600">{optimizationResult.unscheduledJobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Used:</span>
                    <span className="font-medium">{optimizationResult.scheduledGroups.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Efficiency by Cluster */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Route Efficiency by Area</h5>
              <div className="space-y-3">
                {optimizationResult.scheduledGroups.map((group, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-900">{group.clusterName}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({new Date(group.date).toLocaleDateString()})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{group.jobs.length} jobs</div>
                      <div className="text-xs text-gray-600">{Math.round(group.totalDriveTime)} min drive</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "unscheduled":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Unscheduled Jobs</h4>
              <span className="text-sm text-gray-600">{optimizationResult.unscheduledJobs.length} jobs</span>
            </div>
            
            {optimizationResult.unscheduledJobs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">All jobs were successfully scheduled!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {optimizationResult.unscheduledJobs.map((job) => (
                  <div key={job.jobId} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{job.jobTitle}</h5>
                        <p className="text-sm text-gray-600">{job.location}</p>
                        <p className="text-xs text-gray-500">Client: {job.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-700">
                          Due: {new Date(job.dateDue).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">Priority: {job.priority}/10</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Optimization Results</h3>
        <p className="text-gray-600">Review the optimized schedule and metrics</p>
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
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Preferences
        </button>
        
        <button
          onClick={onPreviewInCalendar}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          👁️ Preview in Calendar
        </button>
      </div>
    </div>
  );
} 
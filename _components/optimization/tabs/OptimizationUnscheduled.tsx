"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CloudRunOptimizationResponse } from "../../../app/lib/schedulingOptimizations.types";

interface OptimizationUnscheduledProps {
  optimizationResult: CloudRunOptimizationResponse;
}

export default function OptimizationUnscheduled({
  optimizationResult
}: OptimizationUnscheduledProps) {
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
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{job.jobTitle || 'Untitled Job'}</h5>
                  <p className="text-sm text-gray-600">{job.location || 'No location'}</p>
                  <p className="text-xs text-gray-500">Client: {job.clientName || 'Unknown Client'}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Estimated Duration: {job.estimatedDuration}min • Priority: {job.priority || 1}/10
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-700">
                    Due: {new Date(job.dateDue || new Date()).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {job.coordinates ? 'Coordinates available' : 'No coordinates'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {optimizationResult.unscheduledJobs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h5 className="font-medium text-orange-900 mb-2">Why jobs might be unscheduled:</h5>
          <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
            <li>Due date conflicts with available scheduling days</li>
            <li>Daily job capacity limits reached</li>
            <li>Working hours constraints</li>
            <li>Geographic optimization decisions</li>
          </ul>
        </div>
      )}
    </div>
  );
}

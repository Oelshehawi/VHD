"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { SerializedOptimizedJob } from "../../app/lib/schedulingOptimizations.types";
import { acceptOptimizedJob } from "../../app/lib/actions/optimization.actions";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon 
} from "@heroicons/react/24/outline";

interface OptimizedJobPreviewProps {
  optimizedJob: SerializedOptimizedJob;
  technicians: { id: string; name: string }[];
  onAccept?: (optimizedJob: SerializedOptimizedJob) => void;
}

export default function OptimizedJobPreview({
  optimizedJob,
  technicians,
  onAccept,
}: OptimizedJobPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAcceptJob = () => {
    startTransition(async () => {
      try {
        const result = await acceptOptimizedJob(optimizedJob);
        
        if (result.success) {
          toast.success(result.message || "Job successfully scheduled!");
          onAccept?.(optimizedJob);
        } else {
          toast.error(result.error || "Failed to schedule job");
        }
      } catch (error) {
        console.error("Error accepting job:", error);
        toast.error("Failed to schedule job");
      }
    });
  };

  const formatTime = (timeString: string): string => {
    return format(new Date(timeString), "h:mm a");
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-blue-600 bg-blue-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return "High confidence";
    if (confidence >= 0.6) return "Medium confidence";
    return "Low confidence";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <div className="relative rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/80 p-2 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-100/80 hover:shadow-md">
        {/* Optimization indicator */}
        <div className="absolute -top-1 -right-1 z-10">
          <SparklesIcon className="h-4 w-4 text-blue-500" />
        </div>

        {/* Job header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {optimizedJob.originalJob.jobTitle}
            </h4>
            <p className="text-xs text-gray-600 truncate">
              {optimizedJob.originalJob.clientName}
            </p>
          </div>

          {/* Confidence badge */}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getConfidenceColor(optimizedJob.confidence)}`}>
            {Math.round(optimizedJob.confidence * 100)}%
          </span>
        </div>

        {/* Job details */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>{formatTime(optimizedJob.scheduledTime)}</span>
            <span className="mx-1">•</span>
            <span>{formatDuration(optimizedJob.estimatedDuration)}</span>
          </div>

          <div className="flex items-center text-xs text-gray-600">
            <MapPinIcon className="h-3 w-3 mr-1" />
            <span className="truncate">{optimizedJob.originalJob.location}</span>
          </div>

          {optimizedJob.driveTimeToPrevious > 0 && (
            <div className="text-xs text-blue-600">
              Drive: {Math.round(optimizedJob.driveTimeToPrevious)}min
            </div>
          )}
        </div>

        {/* Accept button - shows on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            y: isHovered ? 0 : 10 
          }}
          className="mt-2"
        >
          <button
            onClick={handleAcceptJob}
            disabled={isPending}
            className={`w-full flex items-center justify-center space-x-1 px-2 py-1 text-xs font-medium text-white rounded transition-colors ${
              isPending 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-3 w-3" />
                <span>Accept Job</span>
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Tooltip on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-50 left-full ml-2 top-0 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="space-y-2">
            <div>
              <h5 className="font-medium text-gray-900">Optimization Details</h5>
              <p className="text-sm text-gray-600">{getConfidenceText(optimizedJob.confidence)}</p>
            </div>

            <div className="border-t pt-2">
              <p className="text-xs text-gray-600 mb-1">Historical Pattern:</p>
              {optimizedJob.historicalPattern ? (
                <div className="text-xs space-y-1">
                  <div>Preferred time: {optimizedJob.historicalPattern.patterns.preferredHour}:00</div>
                  <div>Avg duration: {formatDuration(optimizedJob.historicalPattern.patterns.averageDuration)}</div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No historical data</p>
              )}
            </div>

            <div className="border-t pt-2">
              <p className="text-xs text-gray-600">
                Due: {format(new Date(optimizedJob.originalJob.dateDue), "MMM d, yyyy")}
              </p>
              <p className="text-xs text-gray-600">
                Priority: {optimizedJob.originalJob.priority}/10
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 
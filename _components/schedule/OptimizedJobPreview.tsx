"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { SerializedOptimizedJob } from "../../app/lib/schedulingOptimizations.types";
import { acceptOptimizedJob } from "../../app/lib/actions/optimization.actions";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  MapPinIcon,
  SparklesIcon,
  TruckIcon,
  StarIcon,
  InformationCircleIcon
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
  const [showTooltip, setShowTooltip] = useState(false);

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
    if (confidence >= 0.8) return "text-emerald-700 bg-emerald-100 border-emerald-200";
    if (confidence >= 0.6) return "text-blue-700 bg-blue-100 border-blue-200";
    return "text-amber-700 bg-amber-100 border-amber-200";
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return "High confidence";
    if (confidence >= 0.6) return "Medium confidence";
    return "Low confidence";
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative overflow-hidden"
      >
        <div className="relative rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md backdrop-blur-sm">
          {/* Optimization Sparkle Indicator */}
          <div className="absolute -top-1 -right-1 z-10">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="h-4 w-4 text-blue-500" />
            </motion.div>
          </div>

          {/* Job Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {optimizedJob.originalJob.jobTitle}
              </h4>
              <p className="text-xs text-gray-600 truncate">
                {optimizedJob.originalJob.clientName}
              </p>
            </div>

            {/* Confidence Badge */}
            <div className="relative">
              <motion.span 
                className={`text-xs px-2 py-1 rounded-full font-medium border ${getConfidenceColor(optimizedJob.confidence)}`}
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setShowTooltip(true)}
                onHoverEnd={() => setShowTooltip(false)}
              >
                {Math.round(optimizedJob.confidence * 100)}%
              </motion.span>
              
              {/* Confidence Tooltip */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 top-full mt-1 z-50 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap"
                  >
                    {getConfidenceText(optimizedJob.confidence)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center text-xs text-gray-700">
              <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="font-medium">{formatTime(optimizedJob.scheduledTime)}</span>
              <span className="mx-1.5 text-gray-400">•</span>
              <span>{formatDuration(optimizedJob.estimatedDuration)}</span>
            </div>

            <div className="flex items-center text-xs text-gray-700">
              <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{optimizedJob.originalJob.location}</span>
            </div>

            {optimizedJob.driveTimeToPrevious > 0 && (
              <div className="flex items-center text-xs text-blue-700">
                <TruckIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{Math.round(optimizedJob.driveTimeToPrevious)}min drive time</span>
              </div>
            )}

            {optimizedJob.historicalPattern && (
              <div className="flex items-center text-xs text-purple-700">
                <StarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Historical pattern match</span>
              </div>
            )}
          </div>

          {/* Accept Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0.6, 
              y: isHovered ? 0 : 5 
            }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleAcceptJob}
              disabled={isPending}
              className={`w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                isPending 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow'
              }`}
            >
              {isPending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white"></div>
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-3 w-3" />
                  <span>Accept & Schedule</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Tooltip on Extended Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 10 }}
            transition={{ delay: 0.5, duration: 0.2 }}
            className="absolute z-50 left-full ml-2 top-0 w-72 p-4 bg-white border border-gray-200 rounded-xl shadow-xl"
          >
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  Optimization Details
                </h5>
                <p className="text-sm text-gray-600 mt-1">{getConfidenceText(optimizedJob.confidence)} based on AI analysis</p>
              </div>

              <div className="border-t pt-3">
                <h6 className="text-xs font-medium text-gray-700 mb-2">Historical Pattern</h6>
                {optimizedJob.historicalPattern ? (
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>• Preferred time: {optimizedJob.historicalPattern.patterns.preferredHour}:00</div>
                    <div>• Average duration: {formatDuration(optimizedJob.historicalPattern.patterns.averageDuration)}</div>
                    <div>• Pattern confidence: {Math.round(optimizedJob.historicalPattern.patterns.hourConfidence * 100)}%</div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No historical data available</p>
                )}
              </div>

              <div className="border-t pt-3">
                <h6 className="text-xs font-medium text-gray-700 mb-2">Job Priority</h6>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Due date:</span>
                  <span className="font-medium">{format(new Date(optimizedJob.originalJob.dateDue), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-600">Priority score:</span>
                  <span className="font-medium">{optimizedJob.originalJob.priority}/10</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Route order:</span>
                  <span className="font-medium">#{optimizedJob.orderInRoute}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
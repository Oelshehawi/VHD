"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runOptimization } from "../../app/lib/actions/optimization.actions";
import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { 
  SparklesIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BoltIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

interface OptimizationControlsProps {
  showOptimization: boolean;
  setShowOptimization: (show: boolean) => void;
  optimizationResult: SerializedOptimizationResult | null;
  setOptimizationResult: (result: SerializedOptimizationResult | null) => void;
  canManage: boolean;
}

export default function OptimizationControls({
  showOptimization,
  setShowOptimization,
  optimizationResult,
  setOptimizationResult,
  canManage,
}: OptimizationControlsProps) {
  const [isPending, startTransition] = useTransition();

  const handleRunOptimization = () => {
    if (!canManage) return;
    
    startTransition(async () => {
      try {
        const result = await runOptimization();
        
        if (result.success && result.data) {
          setOptimizationResult(result.data);
          setShowOptimization(true);
        } else {
          console.error("Optimization failed:", result.error);
        }
      } catch (error) {
        console.error("Error running optimization:", error);
      }
    });
  };

  const handleClearOptimization = () => {
    setOptimizationResult(null);
    setShowOptimization(false);
  };

  if (!canManage) return null;

  return (
    <div className="flex items-center space-x-3">
      {/* Optimization Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={showOptimization ? handleClearOptimization : handleRunOptimization}
        disabled={isPending}
        className={`
          flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
          ${showOptimization 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span>Optimizing...</span>
          </>
        ) : showOptimization ? (
          <>
            <XMarkIcon className="h-4 w-4" />
            <span>Hide</span>
          </>
        ) : (
          <>
            <BeakerIcon className="h-4 w-4" />
            <span>Optimize</span>
          </>
        )}
      </motion.button>

      {/* Optimization Status */}
      <AnimatePresence>
        {optimizationResult && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center space-x-3 text-sm"
          >
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              <span>{optimizationResult.totalJobs} jobs</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-600">
              <ClockIcon className="h-4 w-4" />
              <span>{Math.round(optimizationResult.metrics.totalDriveTime / 60)}h drive</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
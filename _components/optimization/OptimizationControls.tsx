"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { 
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

interface OptimizationControlsProps {
  showOptimization: boolean;
  setShowOptimization: (show: boolean) => void;
  optimizationResult: SerializedOptimizationResult | null;
  setOptimizationResult: (result: SerializedOptimizationResult | null) => void;
  canManage: boolean;
  onOpenOptimizationModal: () => void;
}

export default function OptimizationControls({
  showOptimization,
  setShowOptimization,
  optimizationResult,
  setOptimizationResult,
  canManage,
  onOpenOptimizationModal,
}: OptimizationControlsProps) {
  if (!canManage) return null;

  const handleClearOptimization = () => {
    setOptimizationResult(null);
    setShowOptimization(false);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Optimization Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={showOptimization ? handleClearOptimization : onOpenOptimizationModal}
        className={`
          flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
          ${showOptimization 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }
        `}
      >
        {showOptimization ? (
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
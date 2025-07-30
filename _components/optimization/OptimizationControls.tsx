"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

interface OptimizationControlsProps {
  showOptimization: boolean;
  setShowOptimization: (show: boolean) => void;
  canManage: boolean;
  onOpenOptimizationModal: () => void;
}

export default function OptimizationControls({
  canManage,
  onOpenOptimizationModal,
}: OptimizationControlsProps) {
  if (!canManage) return null;


  return (
    <div className="flex items-center space-x-3">
      {/* Optimization Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenOptimizationModal}
        className={`
          flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
          bg-blue-100 text-blue-700 hover:bg-blue-200
        `}
      >

            <BeakerIcon className="h-4 w-4" />
            <span>Optimize</span>
      </motion.button>

    </div>
  );
} 
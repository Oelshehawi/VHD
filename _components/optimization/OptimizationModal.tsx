"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, BeakerIcon, ChartBarIcon, CogIcon } from "@heroicons/react/24/outline";
import { CloudRunOptimizationResponse } from "../../app/lib/schedulingOptimizations.types";
import { runOptimization } from "../../app/lib/actions/optimization.actions";

// Import step components
import OptimizationSetupWithPreferences from "./steps/OptimizationSetupWithPreferences";
import OptimizationResults from "./steps/OptimizationResults";

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
}

type OptimizationStep = "setup" | "results";

export default function OptimizationModal({
  isOpen,
  onClose,
  canManage,
}: OptimizationModalProps) {
  const [currentStep, setCurrentStep] = useState<OptimizationStep>("setup");
  const [optimizationResult, setOptimizationResult] = useState<CloudRunOptimizationResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  if (!canManage || !isOpen) return null;

  const handleRunOptimization = (config: {
    dateRange: { start: Date; end: Date };
    preferences: {
      maxJobsPerDay: number;
      allowedDays: number[];
      startingPointAddress: string;
    };
  }) => {
    startTransition(async () => {
      try {
        const result = await runOptimization(
          config.dateRange,
          config.preferences
        );
        
        if (result.success && result.data) {
          const cloudRunResult: CloudRunOptimizationResponse = {
            success: true,
            scheduledJobs: result.data.scheduledJobs || [],
            unscheduledJobs: result.data.unscheduledJobs || [],
            metrics: result.data.metrics ? {
              totalJobs: result.data.metrics.totalJobs,
              scheduledJobs: result.data.metrics.scheduledJobs,
              unscheduledJobs: result.data.metrics.unscheduledJobs,
              averageJobsPerDay: result.data.metrics.averageJobsPerDay,
              totalDriveTime: (result.data.metrics as any).totalDriveTime || 0,
              totalWorkTime: (result.data.metrics as any).totalWorkTime || 0,
            } : undefined,
          };
          
          setOptimizationResult(cloudRunResult);
          setCurrentStep("results");
        } else {
          console.error("Optimization failed:", result.error);
          const errorResult: CloudRunOptimizationResponse = {
            success: false,
            scheduledJobs: [],
            unscheduledJobs: [],
            error: result.error,
          };
          setOptimizationResult(errorResult);
          setCurrentStep("results");
        }
      } catch (error) {
        console.error("Error running optimization:", error);
        const errorResult: CloudRunOptimizationResponse = {
          success: false,
          scheduledJobs: [],
          unscheduledJobs: [],
          error: "Failed to connect to optimization service",
        };
        setOptimizationResult(errorResult);
        setCurrentStep("results");
      }
    });
  };

  const handleJobApplied = (jobId: string, results: any) => {
    setAppliedJobs(prev => [...prev, jobId]);
  };

  const handleCloseModal = () => {
    setCurrentStep("setup");
    setOptimizationResult(null);
    setAppliedJobs([]);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-[90vw] h-[90vh] max-w-6xl bg-white overflow-y-auto rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <BeakerIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">OR Tools Optimization</h2>
                <p className="text-sm text-gray-600">Intelligent job scheduling powered by Google OR Tools</p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Step Navigation */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <nav className="flex items-center justify-center space-x-8">
              <button
                onClick={() => setCurrentStep("setup")}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                  currentStep === "setup"
                    ? "bg-blue-100 text-blue-700"
                    : currentStep === "results"
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === "setup"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : currentStep === "results"
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white text-gray-400"
                }`}>
                  <CogIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Setup & Preferences</span>
              </button>

              <div className={`w-16 h-0.5 ${currentStep === "results" ? "bg-green-300" : "bg-gray-200"}`} />

              <button
                onClick={() => optimizationResult && setCurrentStep("results")}
                disabled={!optimizationResult}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                  currentStep === "results"
                    ? "bg-blue-100 text-blue-700"
                    : optimizationResult
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === "results"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : optimizationResult
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white text-gray-400"
                }`}>
                  <ChartBarIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Results & Application</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Setup Step */}
              {currentStep === "setup" && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 h-full"
                >
                  <OptimizationSetupWithPreferences
                    isPending={isPending}
                    onRunOptimization={handleRunOptimization}
                  />
                </motion.div>
              )}

              {/* Results Step */}
              {currentStep === "results" && optimizationResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 h-full"
                >
                  <OptimizationResults
                    optimizationResult={optimizationResult}
                    onBack={() => setCurrentStep("setup")}
                    appliedJobs={appliedJobs}
                    onJobApplied={handleJobApplied}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 
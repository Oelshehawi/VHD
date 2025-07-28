"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, BeakerIcon, ChartBarIcon, CheckCircleIcon, CogIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import { SerializedOptimizationResult } from "../../app/lib/schedulingOptimizations.types";
import { runOptimization, getOptimizationSetupData } from "../../app/lib/actions/optimization.actions";

// Import step components
import OptimizationSetupWithPreferences from "./steps/OptimizationSetupWithPreferences";
import OptimizationResults from "./steps/OptimizationResults";
import ApplyOptimization from "./steps/ApplyOptimization";

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimizationResult: (result: SerializedOptimizationResult) => void;
  onPreviewToggle: (active: boolean) => void;
  canManage: boolean;
}

type OptimizationStep = 1 | 2 | 3;

/**
 * SWR fetcher functions for optimization data
 */
const setupDataFetcher = () => getOptimizationSetupData();

const jobsCountFetcher = async ([_, startDate, endDate]: [string, string, string]) => {
  if (!startDate || !endDate) return null;
  const result = await getOptimizationSetupData({
    start: new Date(startDate),
    end: new Date(endDate),
  });
  return result.success ? result.data?.unscheduledJobsCount : 0;
};

export default function OptimizationModal({
  isOpen,
  onClose,
  onOptimizationResult,
  onPreviewToggle,
  canManage,
}: OptimizationModalProps) {
  const [currentStep, setCurrentStep] = useState<OptimizationStep>(1);
  const [optimizationResult, setOptimizationResult] = useState<SerializedOptimizationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  
  // Step 1: Basic Setup
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startingAddress, setStartingAddress] = useState("");

  // Step 1: Schedule Preferences
  const [allowedDays, setAllowedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday-Friday default
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(4);
  const [workDayStart, setWorkDayStart] = useState("09:00");
  const [workDayEnd, setWorkDayEnd] = useState("17:00");

  // SWR hooks
  const { 
    data: setupData, 
    error: setupError, 
    isLoading: isLoadingSetup 
  } = useSWR(
    isOpen ? 'optimization-setup' : null,
    setupDataFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { 
    data: unscheduledJobsCount, 
    error: jobsCountError 
  } = useSWR(
    startDate && endDate ? ['jobs-count', startDate, endDate] : null,
    jobsCountFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Initialize form state when setup data loads
  useEffect(() => {
    if (setupData?.success && setupData.data) {
      setStartDate(setupData.data.dateRange.start || "");
      setEndDate(setupData.data.dateRange.end || "");
      // Set default starting address if not already set
      if (!startingAddress) {
        setStartingAddress("11020 Williams Rd Richmond, BC V7A 1X8"); // Default depot
      }
    }
  }, [setupData, startingAddress]);

  if (!canManage || !isOpen) return null;

  const handleRunOptimization = () => {
    startTransition(async () => {
      try {
        // Run optimization with the configured settings
        const result = await runOptimization(
          undefined, // Use default strategy
          {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        );
        
        if (result.success && result.data) {
          setOptimizationResult(result.data);
          onOptimizationResult(result.data);
          setCurrentStep(2); // Move to results step
        } else {
          console.error("Optimization failed:", result.error);
        }
      } catch (error) {
        console.error("Error running optimization:", error);
      }
    });
  };

  const handlePreviewInCalendar = () => {
    setIsPreviewActive(true);
    onPreviewToggle(true);
    setCurrentStep(3); // Move to apply step
  };

  const handleCloseModal = () => {
    setCurrentStep(1);
    setOptimizationResult(null);
    setIsPreviewActive(false);
    onPreviewToggle(false);
    onClose();
  };

  const handleBackToResults = () => {
    setIsPreviewActive(false);
    onPreviewToggle(false);
    setCurrentStep(2);
  };

  const handleAcceptAll = () => {
    // TODO: Implement accept all optimization logic
    console.log("Accept all optimizations");
    handleCloseModal();
  };

  const handleAcceptSelected = () => {
    // TODO: Implement accept selected logic
    console.log("Accept selected optimizations");
    handleCloseModal();
  };

  const handleRejectAll = () => {
    // TODO: Implement reject all logic
    console.log("Reject all optimizations");
    handleCloseModal();
  };

  const steps = [
    { number: 1, title: "Setup & Preferences", icon: CogIcon },
    { number: 2, title: "Results", icon: ChartBarIcon },
    { number: 3, title: "Apply", icon: CheckCircleIcon },
  ];

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
          className="relative w-[80vw] h-[90vh] max-w-6xl bg-white overflow-y-auto rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <BeakerIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Schedule Optimization</h2>
                <p className="text-sm text-gray-600">Intelligent job scheduling with route optimization</p>
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
              {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const isAccessible = step.number <= currentStep || isCompleted;
                const StepIcon = step.icon;

                return (
                  <div key={step.number} className="flex items-center">
                    <motion.button
                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : isCompleted
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => isAccessible && setCurrentStep(step.number as OptimizationStep)}
                      disabled={!isAccessible}
                      whileHover={isAccessible ? { scale: 1.02 } : {}}
                      whileTap={isAccessible ? { scale: 0.98 } : {}}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          isActive
                            ? "border-blue-500 bg-blue-500 text-white"
                            : isCompleted
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 bg-white text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{step.number}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                    </motion.button>

                    {/* Connector */}
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-0.5 mx-4 ${
                          currentStep > step.number ? "bg-green-300" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Setup & Preferences */}
              {currentStep === 1 && (
                <motion.div
                  key="setup-preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 h-full"
                >
                  <OptimizationSetupWithPreferences
                    startDate={startDate}
                    endDate={endDate}
                    startingAddress={startingAddress}
                    allowedDays={allowedDays}
                    maxJobsPerDay={maxJobsPerDay}
                    workDayStart={workDayStart}
                    workDayEnd={workDayEnd}
                    unscheduledJobsCount={unscheduledJobsCount || undefined}
                    isLoadingSetup={isLoadingSetup}
                    setupError={setupError}
                    isPending={isPending}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onStartingAddressChange={setStartingAddress}
                    onAllowedDaysChange={setAllowedDays}
                    onMaxJobsPerDayChange={setMaxJobsPerDay}
                    onWorkDayStartChange={setWorkDayStart}
                    onWorkDayEndChange={setWorkDayEnd}
                    onRunOptimization={handleRunOptimization}
                  />
                </motion.div>
              )}

              {/* Step 2: Results */}
              {currentStep === 2 && optimizationResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 h-full"
                >
                  <OptimizationResults
                    optimizationResult={optimizationResult}
                    onPreviewInCalendar={handlePreviewInCalendar}
                    onBack={() => setCurrentStep(1)}
                  />
                </motion.div>
              )}

              {/* Step 3: Apply */}
              {currentStep === 3 && optimizationResult && (
                <motion.div
                  key="apply"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 h-full"
                >
                  <ApplyOptimization
                    isPreviewActive={isPreviewActive}
                    onAcceptAll={handleAcceptAll}
                    onAcceptSelected={handleAcceptSelected}
                    onRejectAll={handleRejectAll}
                    onBackToResults={handleBackToResults}
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
"use client";

import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ApplyOptimizationProps {
  isPreviewActive: boolean;
  onAcceptAll: () => void;
  onAcceptSelected: () => void;
  onRejectAll: () => void;
  onBackToResults: () => void;
}

export default function ApplyOptimization({
  isPreviewActive,
  onAcceptAll,
  onAcceptSelected,
  onRejectAll,
  onBackToResults,
}: ApplyOptimizationProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Apply Optimization</h3>
        <p className="text-gray-600">
          {isPreviewActive 
            ? "Preview is active. Regular jobs are dimmed and optimized jobs are highlighted."
            : "Choose how to apply the optimization results to your calendar."
          }
        </p>
      </div>

      {isPreviewActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Preview Active</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Click on individual optimized jobs in the calendar to accept or reject them, or use the bulk actions below.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <button 
          onClick={onAcceptAll}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>✅ Accept All Optimizations</span>
        </button>

        <button 
          onClick={onAcceptSelected}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>✅ Accept Selected Jobs</span>
        </button>

        <button 
          onClick={onRejectAll}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
          <span>❌ Reject All</span>
        </button>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onBackToResults}
            className="w-full px-6 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            🔄 Back to Results
          </button>
        </div>
      </div>
    </div>
  );
} 
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";

interface ReportSelectionModalProps {
  reports: any[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (report: any) => void;
}

const ReportSelectionModal = ({
  reports,
  isOpen,
  onClose,
  onSelect,
}: ReportSelectionModalProps) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch {
      return "Unknown Date";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl max-h-[80vh] overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Auto-fill from Previous Reports
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Select a previous report to copy its settings and equipment details
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No Previous Reports Found</p>
              <p className="text-gray-500">This client doesn't have any previous reports to auto-fill from.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, index) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  onClick={() => onSelect(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {report.jobTitle || "Service Report"}
                        </h4>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {formatDate(report.dateCompleted)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        📍 {report.location || "Location not specified"}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Fuel Type:</span>{" "}
                          {report.fuelType || "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium">Cooking Volume:</span>{" "}
                          {report.cookingVolume || "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium">Hood Type:</span>{" "}
                          {report.equipmentDetails?.hoodType || "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium">Filter Type:</span>{" "}
                          {report.equipmentDetails?.filterType || "Not specified"}
                        </div>
                      </div>

                      {report.recommendedCleaningFrequency && (
                        <div className="mt-2 text-xs text-green-600">
                          <span className="font-medium">Cleaning Frequency:</span>{" "}
                          {report.recommendedCleaningFrequency}x per year
                        </div>
                      )}
                    </div>

                    <div className="ml-4 shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <p className="text-xs text-gray-500 flex items-center">
              💡 Selected report data will auto-fill the form fields
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportSelectionModal;
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ReportType } from "../../../app/lib/typeDefinitions";
import { formatDateFns } from "../../../app/lib/utils";

interface ReportModalProps {
  report: ReportType;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to format inspection items for display
const formatInspectionValue = (value: string | undefined) => {
  if (!value) return "N/A";
  return value;
};

// Helper function to format boolean values for display
const formatBooleanValue = (value: boolean | undefined) => {
  if (value === undefined) return "No";
  return value ? "Yes" : "No";
};

const ReportModal: React.FC<ReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "equipment" | "inspection" | "cleaning" | "recommendations"
  >("overview");

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format cleaning details
  const cleaningItems = [];
  if (report.cleaningDetails?.hoodCleaned) cleaningItems.push("Hood");
  if (report.cleaningDetails?.filtersCleaned) cleaningItems.push("Filters");
  if (report.cleaningDetails?.ductworkCleaned) cleaningItems.push("Ductwork");
  if (report.cleaningDetails?.fanCleaned) cleaningItems.push("Fan");

  // Format cooking equipment
  const cookingItems = [];
  if (report.cookingEquipment?.griddles) cookingItems.push("Griddles");
  if (report.cookingEquipment?.deepFatFryers)
    cookingItems.push("Deep Fat Fryers");
  if (report.cookingEquipment?.woks) cookingItems.push("Woks");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "equipment", label: "Equipment" },
    { id: "cleaning", label: "Cleaning" },
    { id: "inspection", label: "Inspection" },
    { id: "recommendations", label: "Notes" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-black/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-900 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Service Report
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-white transition-colors hover:bg-green-800/70"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex w-full overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`whitespace-nowrap px-3 py-2 text-sm font-medium ${
                      activeTab === tab.id
                        ? "border-b-2 border-green-600 text-green-800"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {activeTab === "overview" && (
                <div>
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">
                        Report Details
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Date Completed:</span>{" "}
                          {formatDateFns(report.dateCompleted)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Last Service:</span>{" "}
                          {report.lastServiceDate
                            ? formatDateFns(report.lastServiceDate)
                            : "N/A"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">
                            Recommended Frequency:
                          </span>{" "}
                          {report.recommendedCleaningFrequency
                            ? `${report.recommendedCleaningFrequency} times per year`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">
                        System Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Hood Type:</span>{" "}
                          {report.equipmentDetails?.hoodType || "Standard Hood"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Fuel Type:</span>{" "}
                          {report.fuelType || "N/A"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Cooking Volume:</span>{" "}
                          {report.cookingVolume || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Services Performed
                    </h3>
                    <div className="space-y-1">
                      {cleaningItems.length > 0 ? (
                        <p className="text-sm">
                          The following were cleaned: {cleaningItems.join(", ")}
                        </p>
                      ) : (
                        <p className="text-sm">
                          Inspection only, no cleaning was performed.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "equipment" && (
                <div>
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Equipment Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Hood Type:</span>{" "}
                          {report.equipmentDetails?.hoodType || "Not specified"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Filter Type:</span>{" "}
                          {report.equipmentDetails?.filterType ||
                            "Not specified"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Ductwork Type:</span>{" "}
                          {report.equipmentDetails?.ductworkType ||
                            "Not specified"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Fan Type:</span>{" "}
                          {report.equipmentDetails?.fanType || "Not specified"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Fuel Type:</span>{" "}
                          {report.fuelType || "Not specified"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Cooking Volume:</span>{" "}
                          {report.cookingVolume || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Cooking Equipment
                    </h3>
                    {cookingItems.length > 0 ? (
                      <p className="text-sm">
                        Present: {cookingItems.join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm">
                        No cooking equipment details provided.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "cleaning" && (
                <div>
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Cleaning Details
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm font-medium">
                          Hood Cleaned
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            report.cleaningDetails?.hoodCleaned
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.hoodCleaned,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm font-medium">
                          Filters Cleaned
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            report.cleaningDetails?.filtersCleaned
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.filtersCleaned,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm font-medium">
                          Ductwork Cleaned
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            report.cleaningDetails?.ductworkCleaned
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.ductworkCleaned,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm font-medium">Fan Cleaned</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            report.cleaningDetails?.fanCleaned
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {formatBooleanValue(
                            report.cleaningDetails?.fanCleaned,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "inspection" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Inspection Items
                    </h3>
                    {report.inspectionItems ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {Object.entries(report.inspectionItems).map(
                          ([key, value]) => {
                            // Convert camelCase to readable format
                            const label = key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())
                              .replace(/([A-Z])\s/g, "$1"); // Fix spaces before capitals

                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                              >
                                <span className="text-xs font-medium sm:text-sm">
                                  {label}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    value === "Yes"
                                      ? "bg-green-100 text-green-800"
                                      : value === "No"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {formatInspectionValue(value)}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">
                        No inspection details available.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "recommendations" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Recommendations
                    </h3>
                    <p className="whitespace-pre-wrap text-sm">
                      {report.recommendations || "No recommendations provided."}
                    </p>
                  </div>

                  {report.comments && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">
                        Comments
                      </h3>
                      <p className="whitespace-pre-wrap text-sm">
                        {report.comments}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex justify-between">
                <a
                  href={`/client-portal/reports/${report._id}/pdf`}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download PDF
                </a>
                <button
                  onClick={onClose}
                  className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;

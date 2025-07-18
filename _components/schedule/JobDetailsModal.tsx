"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ScheduleType, ReportType } from "../../app/lib/typeDefinitions";
import Link from "next/link";
import toast from "react-hot-toast";
import { updateSchedule } from "../../app/lib/actions/scheduleJobs.actions";
import DeleteModal from "../DeleteModal";
import EditJobModal from "./EditJobModal";
import ReportModal from "./ReportModal";
import GeneratePDF, { type PDFData } from "../pdf/GeneratePDF";
import MediaDisplay from "../invoices/MediaDisplay";
import { getReportByScheduleId } from "../../app/lib/actions/scheduleJobs.actions";
import {
  XMarkIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CameraIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns-tz";

interface JobDetailsModalProps {
  job: ScheduleType | null;
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  technicians: { id: string; name: string }[];
}

type ModalView = "details" | "media" | "report" | "edit";

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
  canManage,
  technicians,
}: JobDetailsModalProps) {
  const [activeView, setActiveView] = useState<ModalView>("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(false);
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const [existingReportData, setExistingReportData] = useState<ReportType | null>(null);
  const [isCheckingReport, setIsCheckingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Update state when job changes
  useEffect(() => {
    if (job) {
      setConfirmed(job.confirmed);
      setActiveView("details"); // Always start with details view
      setHasExistingReport(false);
      setExistingReportData(null);
      setIsCheckingReport(false);
      setShowReportModal(false); // Reset report modal state
    }
  }, [job]);

  // Check for existing report when switching to report view
  useEffect(() => {
    const checkForExistingReport = async () => {
      if (!job || activeView !== "report") return;
      
      setIsCheckingReport(true);
      
      // Add minimum loading time to prevent flickering
      const [report] = await Promise.all([
        getReportByScheduleId(job._id.toString()).catch(error => {
          console.error("Error checking for existing report:", error);
          return null;
        }),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading
      ]);
      
      setHasExistingReport(!!report);
      setExistingReportData(report);
      setIsCheckingReport(false);
    };

    if (activeView === "report" && job) {
      checkForExistingReport();
    }
  }, [job, activeView]);

  const toggleConfirmedStatus = async () => {
    if (!job || isLoading || !canManage) {
      if (!canManage) {
        toast.error("You do not have permission to perform this action");
      }
      return;
    }

    setIsLoading(true);
    const newStatus = !isConfirmed;

    try {
      await updateSchedule({
        scheduleId: job._id.toString(),
        confirmed: newStatus,
      });

      toast.success(
        `Job ${newStatus ? "confirmed" : "unconfirmed"} successfully`,
      );
      setConfirmed(newStatus);
    } catch (error) {
      console.error("Failed to update the job:", error);
      toast.error("Failed to update the job status");
    } finally {
      setIsLoading(false);
    }
  };

  const assignedTechnicians = technicians.filter((tech) =>
    job?.assignedTechnicians.includes(tech.id),
  );

  const hasBeforePhotos = job?.photos?.some((photo) => photo.type === "before");
  const hasAfterPhotos = job?.photos?.some((photo) => photo.type === "after");
  const hasSignature = !!job?.signature;
  const hasMedia = hasBeforePhotos || hasAfterPhotos || hasSignature;

  const createReportPDFData = (report: ReportType): PDFData | undefined => {
    if (!job) return undefined;
    
    try {
      const reportData = {
        _id: typeof report._id === "string" ? report._id : report._id?.toString() || "",
        scheduleId: typeof report.scheduleId === "string" ? report.scheduleId : report.scheduleId.toString(),
        dateCompleted: report.dateCompleted,
        technicianId: report.technicianId,
        lastServiceDate: report.lastServiceDate,
        fuelType: report.fuelType,
        cookingVolume: report.cookingVolume,
        equipmentDetails: report.equipmentDetails,
        cleaningDetails: report.cleaningDetails,
        cookingEquipment: report.cookingEquipment,
        recommendations: report.recommendations,
        comments: report.comments,
        recommendedCleaningFrequency: report.recommendedCleaningFrequency,
        inspectionItems: report.inspectionItems,
      };

      const assignedTech = technicians.find((tech) => tech.id === report.technicianId);
      const technicianData = {
        id: report.technicianId,
        firstName: assignedTech?.name.split(" ")[0] || "Technician",
        lastName: assignedTech?.name.split(" ")[1] || "Name",
        fullName: assignedTech?.name || "Technician Name",
        email: "technician@company.com",
      };

      return {
        type: "report",
        data: { report: reportData, technician: technicianData },
      };
    } catch (error) {
      console.error("Error creating report PDF data:", error);
      return undefined;
    }
  };

  if (!isOpen || !job) return null;

  // Cleanup function when modal closes
  const handleModalClose = () => {
    setShowReportModal(false);
    setIsCheckingReport(false);
    setActiveView("details");
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key={`job-modal-${job._id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleModalClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/invoices/${job.invoiceRef}`}
                  className="group block"
                >
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {job.jobTitle}
                  </h2>
                </Link>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>
              
              <button
                onClick={handleModalClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex mt-4 border-b border-gray-200">
              <button
                onClick={() => setActiveView("details")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeView === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              
              {hasMedia && (
                <button
                  onClick={() => setActiveView("media")}
                  className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeView === "media"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CameraIcon className="h-4 w-4 mr-1" />
                  Media
                </button>
              )}
              
              <button
                onClick={() => setActiveView("report")}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeView === "report"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                Report
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeView === "details" && (
              <div className="p-6 space-y-6">
                {/* Job Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>
                      {format(job.startDateTime, "EEEE, MMM d, yyyy 'at' h:mm a", {
                        timeZone: "PST",
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span>
                      {job.assignedTechnicians.length > 0
                        ? job.assignedTechnicians
                            .map((techId) => technicians.find((tech) => tech.id === techId)?.name)
                            .filter(Boolean)
                            .join(", ")
                        : "No technicians assigned"}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Status</span>
                    <div className="flex items-center mt-1">
                      <div
                        className={`h-2 w-2 rounded-full mr-2 ${
                          isConfirmed ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span className="text-sm text-gray-600">
                        {isConfirmed ? "Confirmed" : "Unconfirmed"}
                      </span>
                    </div>
                  </div>
                  
                  {canManage && (
                    <button
                      onClick={toggleConfirmedStatus}
                      disabled={isLoading}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isConfirmed
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      }`}
                    >
                      {isLoading ? "Updating..." : isConfirmed ? "Unconfirm" : "Confirm"}
                    </button>
                  )}
                </div>

                {/* Technician Notes */}
                {job.technicianNotes && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Technician Notes</h4>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {job.technicianNotes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {canManage && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setActiveView("edit")}
                      className="flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Job
                    </button>
                    
                    <DeleteModal
                      deleteText="Are you sure you want to delete this job?"
                      deleteDesc="This action cannot be undone."
                      deletionId={job._id as string}
                      deletingValue="job"
                    />
                  </div>
                )}
              </div>
            )}

            {activeView === "media" && hasMedia && (
              <div className="p-6">
                <MediaDisplay
                  photos={job.photos || []}
                  signature={job.signature || null}
                />
              </div>
            )}

            {activeView === "report" && (
              <div className="p-6 space-y-4">
                {isCheckingReport ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Checking for existing report...</p>
                  </div>
                ) : hasExistingReport && existingReportData ? (
                  // Show existing report details
                  <div className="space-y-4">
                    <div className="text-center">
                      <DocumentTextIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Kitchen Exhaust Cleaning Report
                      </h3>
                      <p className="text-sm text-gray-600">
                        Report completed on {new Date(existingReportData.dateCompleted).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Report Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-gray-900">Report Summary</h4>
                      
                      {existingReportData.fuelType && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Fuel Type:</span> {existingReportData.fuelType}
                        </div>
                      )}
                      
                      {existingReportData.cookingVolume && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Cooking Volume:</span> {existingReportData.cookingVolume}
                        </div>
                      )}
                      
                      {existingReportData.recommendedCleaningFrequency && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Recommended Frequency:</span> {existingReportData.recommendedCleaningFrequency} times per year
                        </div>
                      )}

                      {existingReportData.recommendations && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Recommendations:</span>
                          <p className="mt-1 text-gray-600">{existingReportData.recommendations}</p>
                        </div>
                      )}

                      {existingReportData.comments && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Comments:</span>
                          <p className="mt-1 text-gray-600">{existingReportData.comments}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Edit Report
                      </button>

                      <GeneratePDF
                        pdfData={createReportPDFData(existingReportData)}
                        fileName={`Report - ${job.jobTitle}.pdf`}
                        buttonText="Download Report PDF"
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  // Show create new report interface
                  <div className="space-y-4">
                    <div className="text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Kitchen Exhaust Cleaning Report
                      </h3>
                      <p className="text-sm text-gray-600">
                        Create a detailed cleaning report for this job.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New Report
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeView === "edit" && (
              <div className="p-6">
                <EditJobModal
                  job={job}
                  onClose={() => setActiveView("details")}
                  technicians={technicians}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ReportModal - shown conditionally */}
      {showReportModal && (
        <ReportModal
          key={`report-modal-${job._id}`}
          schedule={job}
          onClose={() => {
            setShowReportModal(false);
            // Refresh the report data after closing if we're on the report tab
            if (activeView === "report") {
              // Reset the report state to force a fresh check
              setHasExistingReport(false);
              setExistingReportData(null);
              setIsCheckingReport(true);
              
              // Trigger a re-check of the report
              setTimeout(() => {
                const checkForExistingReport = async () => {
                  const [report] = await Promise.all([
                    getReportByScheduleId(job._id.toString()).catch(() => null),
                    new Promise(resolve => setTimeout(resolve, 200))
                  ]);
                  
                  setHasExistingReport(!!report);
                  setExistingReportData(report);
                  setIsCheckingReport(false);
                };
                checkForExistingReport();
              }, 100);
            }
          }}
          technicians={technicians}
        />
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
} 
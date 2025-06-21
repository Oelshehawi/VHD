"use client";
import { useState, useCallback, useEffect } from "react";
import { ScheduleType, ReportType } from "../../app/lib/typeDefinitions";
import Link from "next/link";
import DeleteModal from "../DeleteModal";
import EditJobModal from "./EditJobModal";
import ReportModal from "./ReportModal";
import GeneratePDF, { type PDFData } from "../pdf/GeneratePDF";
import toast from "react-hot-toast";
import {
  updateDeadRun,
  updateSchedule,
} from "../../app/lib/actions/scheduleJobs.actions";
import TechnicianPill from "./TechnicianPill";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBan,
  FaCamera,
  FaSignature,
  FaClipboardList,
  FaDownload,
} from "react-icons/fa";
import { format } from "date-fns-tz";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import MediaDisplay from "../invoices/MediaDisplay";
import { getReportByScheduleId } from "../../app/lib/actions/scheduleJobs.actions";

const JobItem = ({
  job,
  canManage,
  technicians,
}: {
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(() => job.confirmed);
  const [isDeadRun, setIsDeadRun] = useState(() => job.deadRun || false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReportMode, setIsReportMode] = useState(false);
  const [activeView, setActiveView] = useState<"details" | "media" | "report">(
    "details",
  );
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const [existingReportData, setExistingReportData] =
    useState<ReportType | null>(null);

  const toggleConfirmedStatus = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      setIsLoading(false);
      return;
    }
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
      setModalOpen(false);
    }
  }, [canManage, isConfirmed, isLoading, job._id]);

  const toggleDeadRun = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      setIsLoading(false);
      return;
    }
    const newDeadRun = !isDeadRun;
    try {
      await updateDeadRun({
        scheduleId: job._id.toString(),
        deadRun: newDeadRun,
      });

      toast.success(
        `Dead run ${newDeadRun ? "enabled" : "disabled"} successfully`,
      );
      setIsDeadRun(newDeadRun);
    } catch (error) {
      console.error("Failed to update deadRun:", error);
      toast.error("Failed to update dead run status");
    } finally {
      setIsLoading(false);
    }
  }, [canManage, isDeadRun, isLoading, job._id]);

  const techNames = job.assignedTechnicians.map(
    (techId) =>
      technicians.find((tech) => tech.id === techId)?.name.split(" ")[0] ||
      "Unknown",
  );

  // Filter technicians to only include those assigned to this job
  const assignedTechnicians = technicians.filter((tech) =>
    job.assignedTechnicians.includes(tech.id),
  );

  // Check if a report already exists for this job
  useEffect(() => {
    const checkForExistingReport = async () => {
      try {
        const report = await getReportByScheduleId(job._id.toString());
        setHasExistingReport(!!report);
        setExistingReportData(report);
      } catch (error) {
        console.error("Error checking for existing report:", error);
      }
    };

    if (activeView === "report") {
      checkForExistingReport();
    }
  }, [job._id, activeView]);

  // Close modal handler
  const closeModal = () => {
    setModalOpen(false);
    setIsEditMode(false);
    setIsReportMode(false);
    setActiveView("details");
  };

  // Check if job has photos or signatures
  const hasBeforePhotos = job.photos?.some((photo) => photo.type === "before");
  const hasAfterPhotos = job.photos?.some((photo) => photo.type === "after");
  const hasSignature = !!job.signature;
  const hasMedia = hasBeforePhotos || hasAfterPhotos || hasSignature;

  // Helper function to create report PDF data
  const createReportPDFData = (report: ReportType): PDFData | undefined => {
    try {
      const reportData = {
        _id:
          typeof report._id === "string"
            ? report._id
            : report._id?.toString() || "",
        scheduleId:
          typeof report.scheduleId === "string"
            ? report.scheduleId
            : report.scheduleId.toString(),
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

      // Get technician data from the assigned technicians
      const assignedTech = technicians.find(
        (tech) => tech.id === report.technicianId,
      );
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

  return (
    <>
      <li
        className={`group relative z-0 flex items-center justify-between rounded-xl border-l-4 bg-white/90 px-4 py-2 shadow-custom backdrop-blur-sm ${
          isConfirmed ? "border-green-500" : "border-red-500"
        } cursor-pointer transition-all hover:bg-gray-100 hover:shadow-lg`}
      >
        {/* DeadRun Toggle Button */}
        <AnimatePresence>
          {isDeadRun && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 3 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <FaBan className="text-2xl text-red-600/80" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photos/Signatures Indicator */}
        {hasMedia && (
          <div className="absolute right-9 top-1 flex space-x-1">
            {(hasBeforePhotos || hasAfterPhotos) && (
              <FaCamera className="text-xs text-blue-500" />
            )}
            {hasSignature && <FaSignature className="text-xs text-blue-500" />}
          </div>
        )}

        {/* List Item Content */}
        <div
          className="z-0 flex w-full flex-col overflow-hidden"
          onClick={() => !isModalOpen && setModalOpen(true)}
        >
          <span className="flex w-full justify-center gap-1 rounded bg-blue-600 p-1 text-center text-white shadow-sm">
            {techNames.map((tech, index) => (
              <TechnicianPill key={index} name={tech} />
            ))}
          </span>
          <span className="mt-1 font-semibold text-gray-800">
            {job.jobTitle}
          </span>
          <span className="text-sm text-gray-500">
            {format(job.startDateTime, "h:mm a", { timeZone: "PST" })}
          </span>
        </div>

        {/* DeadRun Toggle Button on List Item */}
        {canManage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDeadRun();
            }}
            className={`absolute bottom-1 right-2 rounded-full p-2 shadow-sm ${
              isDeadRun ? "bg-red-600" : "bg-gray-300"
            } transition-all duration-200 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isLoading}
            aria-label="Toggle Dead Run"
          >
            <FaBan
              className={`text-white transition-all duration-200 ${
                isDeadRun ? "text-xl" : "text-lg"
              } ${isDeadRun ? "rotate-0" : "rotate-45"}`}
            />
          </button>
        )}
      </li>

      {/* Portal the modal to document.body */}
      {isModalOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="bg-black/60 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md overflow-hidden rounded-xl bg-gradient-to-br from-darkGreen to-darkBlue p-6 shadow-xl`}
              >
                {isReportMode ? (
                  <ReportModal
                    schedule={job}
                    onClose={closeModal}
                    technicians={assignedTechnicians}
                  />
                ) : isEditMode ? (
                  <EditJobModal
                    job={job}
                    onClose={closeModal}
                    technicians={technicians}
                  />
                ) : (
                  <>
                    {/* View Mode */}
                    <div className="mb-6 flex items-start justify-between">
                      <Link
                        href={`/invoices/${job.invoiceRef}`}
                        className="group"
                      >
                        <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-green-400">
                          {job.jobTitle}
                        </h2>
                      </Link>
                      <button
                        onClick={closeModal}
                        className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Tab navigation */}
                    <div className="mb-4 flex border-b border-white/20">
                      <button
                        onClick={() => setActiveView("details")}
                        className={`px-4 py-2 ${activeView === "details" ? "border-b-2 border-white font-semibold text-white" : "text-white/70"}`}
                      >
                        Details
                      </button>
                      {hasMedia && (
                        <button
                          onClick={() => setActiveView("media")}
                          className={`flex items-center px-4 py-2 ${activeView === "media" ? "border-b-2 border-white font-semibold text-white" : "text-white/70"}`}
                        >
                          Media
                        </button>
                      )}
                      <button
                        onClick={() => setActiveView("report")}
                        className={`flex items-center px-4 py-2 ${activeView === "report" ? "border-b-2 border-white font-semibold text-white" : "text-white/70"}`}
                      >
                        <FaClipboardList className="mr-1" /> Report
                      </button>
                    </div>

                    {activeView === "details" ? (
                      <div className="space-y-4">
                        <p className="text-white/80">
                          Scheduled at{" "}
                          {format(job.startDateTime, "h:mm a", {
                            timeZone: "UTC",
                          })}
                        </p>

                        {job.technicianNotes && (
                          <div className="rounded bg-white/10 p-3">
                            <h4 className="mb-1 font-medium text-white">
                              Technician Notes:
                            </h4>
                            <p className="text-sm text-white/90">
                              {job.technicianNotes}
                            </p>
                          </div>
                        )}

                        {canManage && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <button
                                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                                  isConfirmed
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-green-500 hover:bg-green-600"
                                } text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
                                onClick={toggleConfirmedStatus}
                                disabled={isLoading}
                              >
                                {isLoading
                                  ? "Loading..."
                                  : isConfirmed
                                    ? "Unconfirm Job"
                                    : "Confirm Job"}
                              </button>
                              <DeleteModal
                                deleteText={
                                  "Are you sure you want to delete this Job?"
                                }
                                deleteDesc={""}
                                deletionId={job._id as string}
                                deletingValue="job"
                              />
                            </div>
                            <button
                              className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                              onClick={() => setIsEditMode(true)}
                            >
                              Edit Job
                            </button>
                          </div>
                        )}

                        <button
                          className="mt-2 w-full rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      </div>
                    ) : activeView === "media" ? (
                      <div className="max-h-[60vh] overflow-y-auto rounded bg-white p-4">
                        <MediaDisplay
                          photos={job.photos || []}
                          signature={job.signature || null}
                        />
                        <button
                          className="mt-4 w-full rounded-lg bg-darkGreen px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
                          onClick={() => setActiveView("details")}
                        >
                          Back to Details
                        </button>
                      </div>
                    ) : (
                      activeView === "report" && (
                        <div className="space-y-4">
                          <p className="text-white/80">
                            Complete a kitchen exhaust cleaning report for this
                            job.
                          </p>

                          <div className="flex flex-col gap-3">
                            <button
                              className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                              onClick={() => setIsReportMode(true)}
                            >
                              {hasExistingReport
                                ? "Edit Report"
                                : "Create Report"}
                            </button>

                            {hasExistingReport && existingReportData && (
                              <GeneratePDF
                                pdfData={createReportPDFData(
                                  existingReportData,
                                )}
                                fileName={`Report - ${job.jobTitle}.pdf`}
                                buttonText="Download Report"
                                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                              />
                            )}
                          </div>

                          <button
                            className="mt-2 w-full rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                            onClick={() => setActiveView("details")}
                          >
                            Back to Details
                          </button>
                        </div>
                      )
                    )}
                  </>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default JobItem;

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
  X,
  Clock,
  MapPin,
  Users,
  Camera,
  FileText,
  Pencil,
  Trash,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
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
  const { user } = useUser();
  const [activeView, setActiveView] = useState<ModalView>("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(false);
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const [existingReportData, setExistingReportData] =
    useState<ReportType | null>(null);
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
        getReportByScheduleId(job._id.toString()).catch((error) => {
          console.error("Error checking for existing report:", error);
          return null;
        }),
        new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms loading
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
      const performedBy = user?.fullName || user?.firstName || "user";

      await updateSchedule({
        scheduleId: job._id.toString(),
        confirmed: newStatus,
        performedBy,
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
        _id:
          typeof report._id === "string"
            ? report._id
            : report._id?.toString() || "",
        scheduleId:
          typeof report.scheduleId === "string"
            ? report.scheduleId
            : report.scheduleId.toString(),
        jobTitle: job.jobTitle,
        location: job.location,
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

  if (!isOpen || !job) return null;

  // Cleanup function when modal closes
  const handleModalClose = () => {
    setShowReportModal(false);
    setIsCheckingReport(false);
    setActiveView("details");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={`/invoices/${job.invoiceRef}`}
                className="group block"
              >
                <DialogTitle className="group-hover:text-primary truncate transition-colors">
                  {job.jobTitle}
                </DialogTitle>
              </Link>
              <div className="text-muted-foreground mt-1 flex items-center text-sm">
                <MapPin className="mr-1 h-4 w-4" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as ModalView)}
        >
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {hasMedia && (
              <TabsTrigger value="media">
                <Camera className="mr-1 h-4 w-4" />
                Media
              </TabsTrigger>
            )}
            <TabsTrigger value="report">
              <FileText className="mr-1 h-4 w-4" />
              Report
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
            <TabsContent value="details" className="space-y-6 p-6">
              {/* Job Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="text-muted-foreground flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>
                    {format(
                      job.startDateTime,
                      "EEEE, MMM d, yyyy 'at' h:mm a",
                      {
                        timeZone: "PST",
                      },
                    )}
                  </span>
                </div>

                <div className="text-muted-foreground flex items-center text-sm">
                  <Users className="mr-2 h-4 w-4" />
                  <span>
                    {job.assignedTechnicians.length > 0
                      ? job.assignedTechnicians
                          .map(
                            (techId) =>
                              technicians.find((tech) => tech.id === techId)
                                ?.name,
                          )
                          .filter(Boolean)
                          .join(", ")
                      : "No technicians assigned"}
                  </span>
                </div>
              </div>

              {/* Status */}
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="text-foreground text-sm font-medium">
                      Status
                    </span>
                    <div className="mt-1 flex items-center">
                      <div
                        className={`mr-2 h-2 w-2 rounded-full ${
                          isConfirmed ? "bg-emerald-500" : "bg-destructive"
                        }`}
                      />
                      <span className="text-muted-foreground text-sm">
                        {isConfirmed ? "Confirmed" : "Unconfirmed"}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <Button
                      onClick={toggleConfirmedStatus}
                      disabled={isLoading}
                      variant={isConfirmed ? "destructive" : "default"}
                      size="sm"
                    >
                      {isLoading
                        ? "Updating..."
                        : isConfirmed
                          ? "Unconfirm"
                          : "Confirm"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Technician Notes */}
              {job.technicianNotes && (
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="text-primary mb-2 font-medium">
                      Technician Notes
                    </h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {job.technicianNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {canManage && (
                <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row">
                  <Button
                    onClick={() => setActiveView("edit")}
                    variant="outline"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Job
                  </Button>

                  <DeleteModal
                    deleteText="Are you sure you want to delete this job?"
                    deleteDesc="This action cannot be undone."
                    deletionId={job._id as string}
                    deletingValue="job"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="media" className="p-6">
              {hasMedia && (
                <MediaDisplay
                  photos={job.photos || []}
                  signature={job.signature || null}
                />
              )}
            </TabsContent>

            <TabsContent value="report" className="space-y-4 p-6">
              {isCheckingReport ? (
                <div className="py-8 text-center">
                  <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                  <p className="text-muted-foreground text-sm">
                    Checking for existing report...
                  </p>
                </div>
              ) : hasExistingReport && existingReportData ? (
                // Show existing report details
                <div className="space-y-4">
                  <div className="text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                    <h3 className="text-foreground mb-2 text-lg font-medium">
                      Kitchen Exhaust Cleaning Report
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Report completed on{" "}
                      {new Date(
                        existingReportData.dateCompleted,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Report Summary */}
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <h4 className="text-foreground font-medium">
                        Report Summary
                      </h4>

                      {existingReportData.fuelType && (
                        <div className="text-sm">
                          <span className="text-foreground font-medium">
                            Fuel Type:
                          </span>{" "}
                          {existingReportData.fuelType}
                        </div>
                      )}

                      {existingReportData.cookingVolume && (
                        <div className="text-sm">
                          <span className="text-foreground font-medium">
                            Cooking Volume:
                          </span>{" "}
                          {existingReportData.cookingVolume}
                        </div>
                      )}

                      {existingReportData.recommendedCleaningFrequency && (
                        <div className="text-sm">
                          <span className="text-foreground font-medium">
                            Recommended Frequency:
                          </span>{" "}
                          {existingReportData.recommendedCleaningFrequency}{" "}
                          times per year
                        </div>
                      )}

                      {existingReportData.recommendations && (
                        <div className="text-sm">
                          <span className="text-foreground font-medium">
                            Recommendations:
                          </span>
                          <p className="text-muted-foreground mt-1">
                            {existingReportData.recommendations}
                          </p>
                        </div>
                      )}

                      {existingReportData.comments && (
                        <div className="text-sm">
                          <span className="text-foreground font-medium">
                            Comments:
                          </span>
                          <p className="text-muted-foreground mt-1">
                            {existingReportData.comments}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => setShowReportModal(true)}
                      variant="outline"
                    >
                      Edit Report
                    </Button>

                    <GeneratePDF
                      pdfData={createReportPDFData(existingReportData)}
                      fileName={`Report - ${job.jobTitle}.pdf`}
                      buttonText="Download Report PDF"
                      className="w-full"
                      showScaleSelector
                    />
                  </div>
                </div>
              ) : (
                // Show create new report interface
                <div className="space-y-4">
                  <div className="text-center">
                    <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <h3 className="text-foreground mb-2 text-lg font-medium">
                      Kitchen Exhaust Cleaning Report
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Create a detailed cleaning report for this job.
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowReportModal(true)}
                    className="w-full"
                  >
                    Create New Report
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="edit" className="p-6">
              <EditJobModal
                job={job}
                onClose={() => setActiveView("details")}
                technicians={technicians}
              />
            </TabsContent>
          </div>
        </Tabs>

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
                      getReportByScheduleId(job._id.toString()).catch(
                        () => null,
                      ),
                      new Promise((resolve) => setTimeout(resolve, 200)),
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
      </DialogContent>
    </Dialog>
  );
}

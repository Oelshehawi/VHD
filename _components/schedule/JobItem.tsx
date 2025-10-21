"use client";
import { useState, useCallback, useMemo } from "react";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  updateDeadRun,
  updateSchedule,
} from "../../app/lib/actions/scheduleJobs.actions";
import TechnicianPill from "./TechnicianPill";
import { motion } from "framer-motion";
import {
  FaBan,
  FaCamera,
  FaSignature,
} from "react-icons/fa";
import { format } from "date-fns-tz";
import { calculateJobDurationFromPrice, convertMinutesToHours } from "../../app/lib/utils";

// Function to calculate height based on actual job hours


interface JobItemProps {
  invoices: InvoiceType[];
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
  onJobClick?: (job: ScheduleType) => void;
}

const JobItem = ({
  invoices,
  job,
  canManage,
  technicians,
  onJobClick,
}: JobItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setConfirmed] = useState(() => job.confirmed);
  const [isDeadRun, setIsDeadRun] = useState(() => job.deadRun || false);

  // Calculate duration from invoice price
  const calculatedDuration = useMemo(() => {
    // Find the invoice for this job
    const invoice = invoices.find(inv => 
      inv._id.toString() === job.invoiceRef.toString()
    );
    
    if (invoice && invoice.items) {
      const totalPrice = invoice.items.reduce(
        (sum, item) => sum + (item.price || 0),
        0
      );
      const durationInMinutes = calculateJobDurationFromPrice(totalPrice);
      return convertMinutesToHours(durationInMinutes);
    }
    
    // Fallback to job.hours if no invoice found
    return job.hours || 2.5;
  }, [invoices, job.invoiceRef, job.hours]);

  // Height is now controlled by parent container, so we use h-full
  const jobHeight = "h-full";

  const toggleConfirmedStatus = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || !canManage) {
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
  }, [canManage, isConfirmed, isLoading, job._id]);

  const toggleDeadRun = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || !canManage) {
      if (!canManage) {
        toast.error("You do not have permission to perform this action");
      }
      return;
    }
    
    setIsLoading(true);
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

  // Check if job has media
  const hasBeforePhotos = job.photos?.some((photo) => photo.type === "before");
  const hasAfterPhotos = job.photos?.some((photo) => photo.type === "after");
  const hasSignature = !!job.signature;
  const hasMedia = hasBeforePhotos || hasAfterPhotos || hasSignature;

  const handleJobClick = () => {
    if (onJobClick) {
      onJobClick(job);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${jobHeight} ${
        isConfirmed 
          ? "border-emerald-200 bg-emerald-50/50" 
          : "border-rose-200 bg-rose-50/50"
      } cursor-pointer`}
      onClick={handleJobClick}
    >
      {/* Dead Run Overlay - Enhanced visibility */}
      {isDeadRun && (
        <div className="absolute inset-0 bg-red-600/30 pointer-events-none z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 to-red-700/40"></div>
        </div>
      )}

      {/* Status Indicator Bar */}
      <div 
        className={`h-1 w-full ${
          isConfirmed ? "bg-emerald-500" : "bg-rose-500"
        }`} 
      />

      <div className="p-2 h-full flex flex-col justify-between">
        {/* Header Row - Improved text sizes */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors leading-tight cursor-pointer"
              onClick={handleJobClick}
            >
              {job.jobTitle}
            </h3>
            <p className="text-xs text-gray-500 truncate leading-tight">{job.location}</p>
          </div>

          {/* Media Indicators - Larger icons */}
          {hasMedia && (
            <div className="flex items-center space-x-1 ml-1">
              {(hasBeforePhotos || hasAfterPhotos) && (
                <FaCamera className="h-3 w-3 text-blue-500" />
              )}
              {hasSignature && (
                <FaSignature className="h-3 w-3 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Middle Content - Better text sizes and responsive spacing */}
        <div className="flex-1 flex flex-col justify-center space-y-1 min-h-0">
          {/* Time Display */}
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              {format(job.startDateTime, "h:mm a", { timeZone: "PST" })}
            </span>
          </div>

          {/* Technician Pills - Compact for small heights */}
          <div className="flex flex-wrap gap-0.5">
            {techNames.map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Job Duration Info - Only show if there's space */}
          <div className="text-xs text-gray-500 leading-tight overflow-hidden">
            <div className="truncate">{calculatedDuration}h duration</div>
          </div>
        </div>

        {/* Action Buttons - Always visible with compact design */}
        {canManage && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-auto flex-shrink-0">
            <button
              onClick={toggleConfirmedStatus}
              disabled={isLoading}
              className={`flex-1 px-1.5 py-0.5 text-xs font-medium rounded transition-colors mr-1 ${
                isConfirmed
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "..." : isConfirmed ? "Unconfirm" : "Confirm"}
            </button>

            <button
              onClick={toggleDeadRun}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isLoading}
              className={`p-1 rounded transition-colors relative z-30 flex-shrink-0 ${
                isDeadRun 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isDeadRun ? "Disable Dead Run" : "Enable Dead Run"}
            >
              <FaBan className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default JobItem;

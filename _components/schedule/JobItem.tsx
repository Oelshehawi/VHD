"use client";
import React, { useMemo } from "react";
import { ScheduleType, InvoiceType } from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { format } from "date-fns-tz";

interface JobItemProps {
  invoices: InvoiceType[];
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
  onJobClick?: (job: ScheduleType) => void;
}

const JobItem = ({
  job,
  technicians,
  onJobClick,
}: JobItemProps) => {
  // Memoize technician names lookup
  const techNames = useMemo(() => {
    return job.assignedTechnicians.map(
      (techId) =>
        technicians.find((tech) => tech.id === techId)?.name.split(" ")[0] ||
        "Unknown"
    );
  }, [job.assignedTechnicians, technicians]);

  // Status-based styling (charlietlamb/calendar pattern)
  const statusClasses = job.confirmed
    ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-l-2 border-emerald-500"
    : "bg-destructive/10 hover:bg-destructive/20 border-l-2 border-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`h-full rounded-md px-2.5 py-1.5 cursor-pointer transition-colors ${statusClasses}`}
      onClick={() => onJobClick?.(job)}
    >
      <div className="flex flex-col gap-0.5 h-full">
        {/* Job Title */}
        <span className="text-sm font-medium text-foreground truncate leading-tight">
          {job.jobTitle}
        </span>

        {/* Location - truncated */}
        <span className="text-xs text-muted-foreground truncate leading-tight">
          {job.location}
        </span>

        {/* Time */}
        <span className="text-xs font-medium text-muted-foreground">
          {format(job.startDateTime, "h:mm a", { timeZone: "PST" })}
        </span>

        {/* Technician Pills */}
        <div className="flex gap-1 flex-wrap mt-auto">
          {techNames.slice(0, 2).map((tech, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {tech}
            </Badge>
          ))}
          {techNames.length > 2 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              +{techNames.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(JobItem, (prevProps, nextProps) => {
  return (
    prevProps.job._id === nextProps.job._id &&
    prevProps.job.confirmed === nextProps.job.confirmed &&
    prevProps.job.jobTitle === nextProps.job.jobTitle &&
    prevProps.job.startDateTime === nextProps.job.startDateTime &&
    prevProps.job.assignedTechnicians.length === nextProps.job.assignedTechnicians.length
  );
});

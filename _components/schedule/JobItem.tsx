"use client";
import React, { useMemo } from "react";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { format } from "date-fns-tz";

interface JobItemProps {
  job: ScheduleType;
  canManage: boolean;
  technicians: { id: string; name: string }[];
  onJobClick?: (job: ScheduleType) => void;
}

const JobItem = ({ job, technicians, onJobClick }: JobItemProps) => {
  // Memoize technician names lookup
  const techNames = useMemo(() => {
    return job.assignedTechnicians.map(
      (techId) =>
        technicians.find((tech) => tech.id === techId)?.name.split(" ")[0] ||
        "Unknown",
    );
  }, [job.assignedTechnicians, technicians]);

  // Status-based styling using theme-aware CSS variables
  const statusClasses = job.confirmed
    ? "bg-job-confirmed-bg hover:bg-job-confirmed-hover border-l-2 border-job-confirmed"
    : "bg-destructive/10 hover:bg-destructive/20 border-l-2 border-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`h-full cursor-pointer rounded-md px-2.5 py-1.5 transition-colors ${statusClasses}`}
      onClick={() => onJobClick?.(job)}
    >
      <div className=".5 flex h-full flex-col">
        {/* Job Title */}
        <span className="text-foreground truncate text-sm leading-tight font-medium">
          {job.jobTitle}
        </span>

        {/* Location - truncated */}
        <span className="text-muted-foreground truncate text-xs leading-tight">
          {job.location}
        </span>

        {/* Time */}
        <span className="text-muted-foreground text-xs font-medium">
          {format(job.startDateTime, "h:mm a", { timeZone: "PST" })}
        </span>

        {/* Technician Pills */}
        <div className="mt-auto flex flex-wrap gap-1">
          {techNames.slice(0, 2).map((tech, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="h-4 px-1.5 text-[10px]"
            >
              {tech}
            </Badge>
          ))}
          {techNames.length > 2 && (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
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
    prevProps.job.assignedTechnicians.length ===
      nextProps.job.assignedTechnicians.length
  );
});

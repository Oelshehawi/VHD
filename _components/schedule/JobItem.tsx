"use client";
import React, { useMemo } from "react";
import { ScheduleType, TravelTimeSegment } from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { format } from "date-fns-tz";
import TravelTimeBadge from "./TravelTimeBadge";

interface JobItemProps {
  job: ScheduleType;
  technicians: { id: string; name: string }[];
  onJobClick?: (job: ScheduleType) => void;
  travelSegment?: TravelTimeSegment;
  isTravelTimeLoading?: boolean;
  compact?: boolean;
  durationMinutes?: number;
}

const JobItem = ({
  job,
  technicians,
  onJobClick,
  travelSegment,
  isTravelTimeLoading,
  compact = false,
  durationMinutes,
}: JobItemProps) => {
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
      className={`h-full min-h-0 cursor-pointer overflow-hidden rounded-md transition-colors ${statusClasses} ${
        compact ? "px-2 py-1" : "px-2.5 py-1.5"
      }`}
      onClick={() => onJobClick?.(job)}
    >
      <div
        className={`flex h-full min-h-0 flex-col ${compact ? "justify-center gap-0.5" : "gap-0.5"}`}
      >
        {compact ? (
          <>
            <span className="text-foreground truncate text-[11px] leading-tight font-semibold">
              {job.jobTitle}
            </span>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-muted-foreground shrink-0 text-[11px] leading-none font-medium">
                {format(job.startDateTime, "h:mm a", {
                  timeZone: "America/Vancouver",
                })}
              </span>
              {Number.isFinite(durationMinutes) && (
                <Badge
                  variant="secondary"
                  className="h-4 shrink-0 px-1.5 text-[10px] leading-none"
                >
                  {Math.max(1, Math.round(durationMinutes || 0))} min
                </Badge>
              )}
              {(travelSegment || isTravelTimeLoading) && (
                <TravelTimeBadge
                  typicalMinutes={travelSegment?.typicalMinutes ?? 0}
                  km={travelSegment?.km}
                  travelNotes={travelSegment?.travelNotes}
                  isLoading={isTravelTimeLoading}
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Job Title */}
            <span className="text-foreground truncate text-sm leading-tight font-medium">
              {job.jobTitle}
            </span>

            {/* Location - truncated */}
            <span className="text-muted-foreground truncate text-xs leading-tight">
              {job.location}
            </span>

            {/* Time + Travel */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                {format(job.startDateTime, "h:mm a", {
                  timeZone: "America/Vancouver",
                })}
              </span>
              {(travelSegment || isTravelTimeLoading) && (
                <TravelTimeBadge
                  typicalMinutes={travelSegment?.typicalMinutes ?? 0}
                  km={travelSegment?.km}
                  travelNotes={travelSegment?.travelNotes}
                  isLoading={isTravelTimeLoading}
                />
              )}
            </div>

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
          </>
        )}
      </div>
    </motion.div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(JobItem);

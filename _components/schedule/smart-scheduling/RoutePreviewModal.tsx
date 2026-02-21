"use client";

import { useMemo } from "react";
import { Car } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import type {
  DaySchedulingOption,
  SerializedTravelSegment,
} from "../../../app/lib/actions/smartScheduling.actions";
import type {
  ScheduleType,
  DayTravelTimeSummary,
} from "../../../app/lib/typeDefinitions";
import dynamic from "next/dynamic";
import { cn } from "../../../app/lib/utils";
import { compareScheduleDisplayOrder } from "../../../app/lib/utils/scheduleDayUtils";

const ScheduleMap = dynamic(() => import("../map/ScheduleMap"), {
  ssr: false,
});

interface RoutePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: DaySchedulingOption;
  technicians: { id: string; name: string; depotAddress?: string | null }[];
  newJobLocation: string;
  newJobTitle: string;
  onSchedule: (date: string) => void;
}

function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getColorClass(minutes: number): string {
  if (minutes < 90) return "text-green-600 dark:text-green-400";
  if (minutes <= 150) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function formatClockFrom24Hour(hour: number, minute: number): string {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const meridiem = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function formatStoredScheduleTime(value: Date | string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return formatClockFrom24Hour(value.getUTCHours(), value.getUTCMinutes());
  }

  const raw = String(value || "").trim();
  if (!raw) return "";

  const localeMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );
  if (localeMatch) {
    const hour = Number.parseInt(localeMatch[4] || "0", 10);
    const minute = Number.parseInt(localeMatch[5] || "0", 10);
    const period = (localeMatch[7] || "").toUpperCase();
    let hour24 = hour % 12;
    if (period === "PM") hour24 += 12;
    return formatClockFrom24Hour(hour24, minute);
  }

  const isoMatch = raw.match(
    /^\d{4}-\d{2}-\d{2}(?:[T\s](\d{2}):(\d{2})(?::\d{2})?)?/,
  );
  if (isoMatch && isoMatch[1] && isoMatch[2]) {
    const hour = Number.parseInt(isoMatch[1], 10);
    const minute = Number.parseInt(isoMatch[2], 10);
    return formatClockFrom24Hour(hour, minute);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return formatClockFrom24Hour(parsed.getHours(), parsed.getMinutes());
}

function segmentsToSummary(
  date: string,
  segments: SerializedTravelSegment[],
  isPartial: boolean,
): DayTravelTimeSummary {
  let totalMinutes = 0;
  let totalKm = 0;
  for (const seg of segments) {
    totalMinutes += seg.typicalMinutes;
    totalKm += seg.km;
  }
  return {
    date,
    totalTravelMinutes: Math.round(totalMinutes),
    totalTravelKm: Math.round(totalKm * 10) / 10,
    segments: segments.map((seg) => ({
      from: seg.from,
      to: seg.to,
      typicalMinutes: seg.typicalMinutes,
      km: seg.km,
      travelNotes: seg.travelNotes,
      routePolyline: seg.routePolyline,
      fromKind: seg.fromKind,
      toKind: seg.toKind,
      fromJobId: seg.fromJobId,
      toJobId: seg.toJobId,
    })),
    isPartial,
  };
}

export default function RoutePreviewModal({
  open,
  onOpenChange,
  option,
  technicians,
  newJobLocation,
  newJobTitle,
  onSchedule,
}: RoutePreviewModalProps) {
  const depotAddress =
    technicians.find((tech) => tech.depotAddress)?.depotAddress ?? null;

  const { mapJobs, mapSummary } = useMemo(() => {
    const jobs: ScheduleType[] = [
      ...option.existingJobs.map((j) => ({
        _id: j._id as any,
        jobTitle: j.jobTitle,
        location: j.location,
        startDateTime: j.startDateTime,
        assignedTechnicians: j.assignedTechnicians,
        confirmed: j.confirmed,
        invoiceRef: "",
        hours: j.hours,
        payrollPeriod: "",
        deadRun: j.deadRun,
      })),
      {
        _id: "new-job-temp" as any,
        jobTitle: `✦ ${newJobTitle}`,
        location: newJobLocation,
        startDateTime: option.proposedStartDateTime,
        assignedTechnicians: [],
        confirmed: false,
        invoiceRef: "",
        hours: Math.max(1, Math.ceil(option.proposedDurationMinutes / 60)),
        payrollPeriod: "",
        deadRun: false,
      },
    ];

    const summary =
      option.projectedSegments.length > 0
        ? segmentsToSummary(
            option.date,
            option.projectedSegments,
            option.isPartial,
          )
        : undefined;

    return { mapJobs: jobs, mapSummary: summary };
  }, [option, newJobLocation, newJobTitle]);

  const timelineJobs = useMemo(() => {
    const allJobs = [
      ...option.existingJobs,
      {
        _id: "new-job-temp",
        jobTitle: `✦ ${newJobTitle}`,
        location: newJobLocation,
        startDateTime: option.proposedStartDateTime,
      },
    ];

    return allJobs.sort((a, b) =>
      compareScheduleDisplayOrder(a.startDateTime, b.startDateTime),
    );
  }, [
    option.existingJobs,
    option.proposedStartDateTime,
    newJobTitle,
    newJobLocation,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Route Preview — {option.dateFormatted}</DialogTitle>
          <DialogDescription>
            {option.existingJobsCount} existing job
            {option.existingJobsCount !== 1 ? "s" : ""} + your new job
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          {/* Map */}
          <div className="h-[420px] overflow-hidden rounded-md border">
            <ScheduleMap
              jobs={mapJobs}
              summary={mapSummary}
              technicians={technicians}
              depotAddress={depotAddress}
            />
          </div>

          {/* Sidebar: breakdown + action */}
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Car className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-semibold">
                  Total:{" "}
                  <span
                    className={getColorClass(
                      option.projectedTotalTravelMinutes,
                    )}
                  >
                    {formatMinutes(option.projectedTotalTravelMinutes)}
                  </span>
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Day Timeline</p>
                {timelineJobs.map((job) => (
                  <div
                    key={String(job._id)}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-foreground truncate">
                      {job.jobTitle}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatStoredScheduleTime(job.startDateTime)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Segment breakdown */}
              {option.projectedSegments.length > 0 && (
                <div className="space-y-1.5">
                  {option.projectedSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="border-border border-b pb-1 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <span className="text-foreground truncate font-medium">
                          {seg.from} → {seg.to}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-medium",
                            getColorClass(seg.typicalMinutes),
                          )}
                        >
                          {formatMinutes(seg.typicalMinutes)}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {Math.round(seg.km)} km
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {option.isPartial && (
                <p className="text-muted-foreground text-[10px] italic">
                  * No depot configured — showing job-to-job travel only
                </p>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => {
                onSchedule(option.date);
                onOpenChange(false);
              }}
            >
              Schedule on {option.dateFormatted}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

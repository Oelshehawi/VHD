"use client";

import { useMemo } from "react";
import { Car } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../app/lib/utils";
import type {
  DayTravelTimeSummary,
  ScheduleType,
} from "../../app/lib/typeDefinitions";
import { getEffectiveServiceDurationMinutes } from "../../app/lib/serviceDurationRules";
import {
  getTravelLoadTextClass,
  TARGET_WORKDAY_MINUTES,
} from "../../app/lib/travelTimeColorRules";

interface TravelTimeDaySummaryProps {
  summary: DayTravelTimeSummary | undefined;
  jobs?: ScheduleType[];
  isLoading?: boolean;
  className?: string;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function TravelTimeDaySummary({
  summary,
  jobs,
  isLoading,
  className,
}: TravelTimeDaySummaryProps) {
  const totalWorkMinutes = useMemo(() => {
    if (!jobs || jobs.length === 0) return null;
    const minutes = jobs.reduce(
      (sum, job) =>
        sum +
        getEffectiveServiceDurationMinutes({
          actualServiceDurationMinutes: job.actualServiceDurationMinutes,
          historicalServiceDurationMinutes:
            job.historicalServiceDurationMinutes,
          scheduleHours: job.hours,
          fallbackHours: 4,
        }),
      0,
    );
    return Number.isFinite(minutes) ? minutes : null;
  }, [jobs]);

  if (isLoading) {
    return (
      <span
        className={cn(
          "bg-muted inline-block h-3.5 w-12 animate-pulse rounded",
          className,
        )}
      />
    );
  }

  if (!summary || summary.segments.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:bg-muted/80 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
            getTravelLoadTextClass({
              travelMinutes: summary.totalTravelMinutes,
              workMinutes: totalWorkMinutes,
            }),
            className,
          )}
        >
          <Car className="h-3 w-3" />
          {formatMinutes(summary.totalTravelMinutes)}
          {summary.isPartial && (
            <span className="text-muted-foreground" title="No depot configured">
              *
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto max-w-[380px] min-w-[280px] p-3"
      >
        <div className="space-y-2">
          <div className="text-foreground text-xs font-semibold">
            Travel Breakdown
          </div>

          <div className="space-y-1">
            {summary.segments.map((seg, i) => (
              <div
                key={i}
                className="border-border flex items-start justify-between gap-3 border-b pb-1 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-[11px] font-medium">
                    {seg.from} → {seg.to}
                  </div>
                  {seg.travelNotes && (
                    <div className="text-muted-foreground truncate text-[10px] italic">
                      {seg.travelNotes}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div
                    className={cn(
                      "text-[11px] font-medium",
                      getTravelLoadTextClass({
                        travelMinutes: seg.typicalMinutes,
                      }),
                    )}
                  >
                    {formatMinutes(seg.typicalMinutes)}
                  </div>
                  <div className="text-muted-foreground text-[9px]">
                    {Math.round(seg.km)} km
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-border border-t pt-1.5">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-[11px] font-semibold">
                Total
              </span>
              <div className="text-right">
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    getTravelLoadTextClass({
                      travelMinutes: summary.totalTravelMinutes,
                      workMinutes: totalWorkMinutes,
                    }),
                  )}
                >
                  {formatMinutes(summary.totalTravelMinutes)}
                </span>
                <div className="text-muted-foreground text-[9px]">
                  {Math.round(summary.totalTravelKm)} km
                </div>
                {totalWorkMinutes != null && (
                  <div className="text-muted-foreground text-[9px]">
                    Work + Drive:{" "}
                    {formatMinutes(
                      totalWorkMinutes + summary.totalTravelMinutes,
                    )}
                    {" / "}
                    {formatMinutes(TARGET_WORKDAY_MINUTES)} target
                  </div>
                )}
              </div>
            </div>
          </div>

          {summary.isPartial && (
            <div className="text-muted-foreground text-[10px] italic">
              * No depot configured — showing job-to-job travel only
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

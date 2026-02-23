"use client";

import { useMemo } from "react";
import { Clock3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../app/lib/utils";
import type {
  DayTravelTimeSummary,
  ScheduleType,
} from "../../app/lib/typeDefinitions";
import {
  getEffectiveServiceDurationMinutes,
  getEffectiveServiceDurationSource,
} from "../../app/lib/serviceDurationRules";

interface WorkTimeDaySummaryProps {
  jobs: ScheduleType[];
  travelSummary?: DayTravelTimeSummary;
  className?: string;
}

type ScheduleWithLegacyActualDuration = ScheduleType & {
  actualDuration?: number;
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function WorkTimeDaySummary({
  jobs,
  travelSummary,
  className,
}: WorkTimeDaySummaryProps) {
  const totals = useMemo(
    () =>
      jobs.reduce(
        (acc, job) => {
          const legacyActualDuration = (job as ScheduleWithLegacyActualDuration)
            .actualDuration;
          const actualServiceDurationMinutes =
            typeof job.actualServiceDurationMinutes === "number"
              ? job.actualServiceDurationMinutes
              : legacyActualDuration;
          const source = getEffectiveServiceDurationSource({
            actualServiceDurationMinutes,
            historicalServiceDurationMinutes:
              job.historicalServiceDurationMinutes,
            scheduleHours: null,
          });

          if (source === "default") {
            acc.missingCount += 1;
            return acc;
          }

          const durationMinutes = getEffectiveServiceDurationMinutes({
            actualServiceDurationMinutes,
            historicalServiceDurationMinutes:
              job.historicalServiceDurationMinutes,
            scheduleHours: null,
            fallbackHours: 0,
          });

          acc.totalWorkMinutes += durationMinutes;
          acc.jobsWithDuration += 1;
          if (source === "actual") acc.actualCount += 1;
          if (source === "historical") acc.historicalCount += 1;
          return acc;
        },
        {
          totalWorkMinutes: 0,
          jobsWithDuration: 0,
          actualCount: 0,
          historicalCount: 0,
          missingCount: 0,
        },
      ),
    [jobs],
  );

  if (jobs.length === 0) return null;

  const hasWorkDuration = totals.jobsWithDuration > 0;
  const travelMinutes = travelSummary?.totalTravelMinutes ?? null;
  const combinedMinutes =
    hasWorkDuration && travelMinutes != null
      ? totals.totalWorkMinutes + travelMinutes
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:bg-muted/80 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
            hasWorkDuration
              ? "text-blue-600 dark:text-blue-400"
              : "text-muted-foreground",
            className,
          )}
        >
          <Clock3 className="h-3 w-3" />
          {hasWorkDuration ? formatMinutes(totals.totalWorkMinutes) : "N/A"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto max-w-[320px] min-w-[260px] p-3"
      >
        <div className="space-y-2">
          <div className="text-foreground text-xs font-semibold">
            Work Time (Actual/Historical)
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Total work</span>
              <span className="font-semibold">
                {hasWorkDuration
                  ? formatMinutes(totals.totalWorkMinutes)
                  : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Using actual</span>
              <span className="font-medium">{totals.actualCount}</span>
            </div>

            {totals.historicalCount > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Using historical</span>
                <span className="font-medium">{totals.historicalCount}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Jobs with duration</span>
              <span className="font-medium">{totals.jobsWithDuration}</span>
            </div>

            {totals.missingCount > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Missing duration</span>
                <span className="font-medium">{totals.missingCount}</span>
              </div>
            )}

            {travelMinutes != null && (
              <>
                <div className="border-border my-1 border-t" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Drive total</span>
                  <span className="font-medium">
                    {formatMinutes(travelMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Work + Drive</span>
                  <span className="font-semibold">
                    {combinedMinutes != null
                      ? formatMinutes(combinedMinutes)
                      : "N/A"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

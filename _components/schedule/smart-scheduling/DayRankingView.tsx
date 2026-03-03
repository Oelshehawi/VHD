"use client";

import { useState, useMemo } from "react";
import { Calendar, Car, Clock } from "lucide-react";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Card, CardContent } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { DaySchedulingOption } from "../../../app/lib/actions/smartScheduling.actions";
import { cn } from "../../../app/lib/utils";
import { getTravelLoadTextClass } from "../../../app/lib/travelTimeColorRules";
import RoutePreviewModal from "./RoutePreviewModal";

interface DayRankingViewProps {
  options: DaySchedulingOption[];
  onSchedule: (date: string) => void;
  technicians: { id: string; name: string; depotAddress?: string | null }[];
  newJobLocation: string;
  newJobTitle: string;
}

function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

type TabValue = "optimal" | "late";
type SortValue = "least_total_drive" | "closest_next_job" | "least_added_drive";

function tieBreakDays(a: DaySchedulingOption, b: DaySchedulingOption): number {
  if (a.existingJobsCount !== b.existingJobsCount) {
    return b.existingJobsCount - a.existingJobsCount;
  }
  return a.date.localeCompare(b.date);
}

function compareDays(
  a: DaySchedulingOption,
  b: DaySchedulingOption,
  sortValue: SortValue,
): number {
  if (sortValue === "closest_next_job") {
    const aHasKnownNext = a.hasNextJob && a.nextJobTravelMinutes != null;
    const bHasKnownNext = b.hasNextJob && b.nextJobTravelMinutes != null;
    if (aHasKnownNext !== bHasKnownNext) return aHasKnownNext ? -1 : 1;

    if (aHasKnownNext && bHasKnownNext) {
      const nextDiff =
        (a.nextJobTravelMinutes || 0) - (b.nextJobTravelMinutes || 0);
      if (nextDiff !== 0) return nextDiff;
    }

    if (a.hasNextJob !== b.hasNextJob) return a.hasNextJob ? -1 : 1;
  } else if (sortValue === "least_added_drive") {
    if (a.extraTravelMinutes !== b.extraTravelMinutes) {
      return a.extraTravelMinutes - b.extraTravelMinutes;
    }
  } else {
    if (a.projectedTotalTravelMinutes !== b.projectedTotalTravelMinutes) {
      return a.projectedTotalTravelMinutes - b.projectedTotalTravelMinutes;
    }
  }

  return tieBreakDays(a, b);
}

export default function DayRankingView({
  options,
  onSchedule,
  technicians,
  newJobLocation,
  newJobTitle,
}: DayRankingViewProps) {
  const [previewOption, setPreviewOption] =
    useState<DaySchedulingOption | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("optimal");
  const [sortBy, setSortBy] = useState<SortValue>("least_total_drive");

  const hasDelayDays = useMemo(
    () => options.some((o) => !o.feasible),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const tabFiltered =
      activeTab === "optimal"
        ? options.filter((o) => o.feasible)
        : options.filter((o) => !o.feasible);

    return [...tabFiltered].sort((a, b) => compareDays(a, b, sortBy));
  }, [options, activeTab, sortBy]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Best Scheduling Options</h3>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Sort by</span>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortValue)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="least_total_drive">
                  Least total drive
                </SelectItem>
                <SelectItem value="closest_next_job">
                  Closest next job
                </SelectItem>
                <SelectItem value="least_added_drive">
                  Least added drive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {activeTab === "optimal"
            ? "Showing feasible days"
            : "Late-arrival days only"}
        </p>

        {hasDelayDays && (
          <div className="flex gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setActiveTab("optimal")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === "optimal"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Optimal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("late")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === "late"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Late Arrival
            </button>
          </div>
        )}

        <ScrollArea className="h-[400px] rounded-md border">
          <div className="space-y-2 p-3">
            {filteredOptions.map((option, index) => {
              const isBest = index === 0 && option.feasible;

              return (
                <Card
                  key={option.date}
                  className="hover:bg-muted/50 cursor-pointer transition-all"
                  onClick={() => setPreviewOption(option)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                          <span className="text-sm font-medium">
                            {option.dateFormatted}
                          </span>
                          {isBest && (
                            <Badge
                              variant="default"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              Best
                            </Badge>
                          )}
                          {option.arrivalDelayMinutes != null &&
                            option.arrivalDelayMinutes > 0 && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-0.5 px-1.5 py-0 text-[10px]",
                                  option.arrivalDelayMinutes >= 30
                                    ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                                    : "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400",
                                )}
                              >
                                <Clock className="h-2.5 w-2.5" />~
                                {option.arrivalDelayMinutes}min late
                              </Badge>
                            )}
                        </div>

                        <div className="text-muted-foreground flex items-center gap-3 text-xs">
                          <span>
                            {option.existingJobsCount} job
                            {option.existingJobsCount !== 1 ? "s" : ""}
                          </span>
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            <span
                              className={getTravelLoadTextClass({
                                travelMinutes:
                                  option.projectedTotalTravelMinutes,
                              })}
                            >
                              {formatMinutes(
                                option.projectedTotalTravelMinutes,
                              )}{" "}
                              total
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span
                              className={cn(
                                option.nextJobTravelMinutes != null
                                  ? getTravelLoadTextClass({
                                      travelMinutes:
                                        option.nextJobTravelMinutes,
                                    })
                                  : "text-muted-foreground",
                              )}
                            >
                              {option.hasNextJob
                                ? option.nextJobTravelMinutes != null
                                  ? `${formatMinutes(option.nextJobTravelMinutes)} next hop`
                                  : "Next hop unknown"
                                : "No next job"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {options.length > 0 && (
        <RoutePreviewModal
          open={previewOption !== null}
          onOpenChange={(open) => {
            if (!open) setPreviewOption(null);
          }}
          option={previewOption ?? options[0]!}
          technicians={technicians}
          newJobLocation={newJobLocation}
          newJobTitle={newJobTitle}
          onSchedule={onSchedule}
        />
      )}
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Calendar, Car, Clock } from "lucide-react";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Card, CardContent } from "../../ui/card";
import type { DaySchedulingOption } from "../../../app/lib/actions/smartScheduling.actions";
import { cn } from "../../../app/lib/utils";
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

function getColorClass(minutes: number): string {
  if (minutes < 90) return "text-green-600 dark:text-green-400";
  if (minutes <= 150) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

type TabValue = "optimal" | "late";

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

  const hasDelayDays = useMemo(
    () => options.some((o) => !o.feasible),
    [options],
  );

  const filteredOptions = useMemo(() => {
    if (activeTab === "optimal") return options.filter((o) => o.feasible);
    return options.filter((o) => !o.feasible);
  }, [options, activeTab]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Best Scheduling Options</h3>
          <p className="text-muted-foreground text-sm">
            {activeTab === "optimal"
              ? "Ranked by least total drive time"
              : "Late-arrival days only"}
          </p>
        </div>

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
                              className={getColorClass(
                                option.projectedTotalTravelMinutes,
                              )}
                            >
                              {formatMinutes(
                                option.projectedTotalTravelMinutes,
                              )}{" "}
                              total
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

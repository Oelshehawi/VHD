"use client";

import { useState } from "react";
import { Calendar, Car } from "lucide-react";
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

export default function DayRankingView({
  options,
  onSchedule,
  technicians,
  newJobLocation,
  newJobTitle,
}: DayRankingViewProps) {
  const [previewOption, setPreviewOption] =
    useState<DaySchedulingOption | null>(null);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Best Scheduling Options</h3>
          <p className="text-muted-foreground text-sm">
            Ranked by least total drive time
          </p>
        </div>

        <ScrollArea className="h-[400px] rounded-md border">
          <div className="space-y-2 p-3">
            {options.map((option, index) => {
              const isBest = index === 0;

              return (
                <Card
                  key={option.date}
                  className="cursor-pointer transition-all hover:bg-muted/50"
                  onClick={() => setPreviewOption(option)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {option.dateFormatted}
                          </span>
                          {isBest && (
                            <Badge
                              variant="default"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Best
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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

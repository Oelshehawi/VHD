"use client";

import { Car } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../app/lib/utils";
import {
  getTravelLoadBgClass,
  getTravelLoadTextClass,
  TARGET_WORKDAY_MINUTES,
} from "../../app/lib/travelTimeColorRules";

interface TravelTimeBadgeProps {
  typicalMinutes: number;
  workMinutes?: number;
  km?: number;
  travelNotes?: string;
  isLoading?: boolean;
  className?: string;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function TravelTimeBadge({
  typicalMinutes,
  workMinutes,
  km,
  travelNotes,
  isLoading,
  className,
}: TravelTimeBadgeProps) {
  if (isLoading) {
    return (
      <span
        className={cn(
          "bg-muted inline-block h-3.5 w-10 animate-pulse rounded",
          className,
        )}
      />
    );
  }

  if (typicalMinutes <= 0) return null;

  const combinedMinutes =
    typeof workMinutes === "number" && Number.isFinite(workMinutes)
      ? Math.max(0, workMinutes) + typicalMinutes
      : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-none font-medium",
            getTravelLoadBgClass({
              travelMinutes: typicalMinutes,
              workMinutes,
            }),
            getTravelLoadTextClass({
              travelMinutes: typicalMinutes,
              workMinutes,
            }),
            className,
          )}
        >
          <Car className="h-2.5 w-2.5 shrink-0" />
          {formatMinutes(typicalMinutes)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1 text-xs">
          <div className="font-semibold">Travel Time</div>
          <div>{formatMinutes(typicalMinutes)}</div>
          {combinedMinutes != null && (
            <div className="text-muted-foreground">
              Work + Drive: {formatMinutes(combinedMinutes)} /{" "}
              {formatMinutes(TARGET_WORKDAY_MINUTES)} target
            </div>
          )}
          {km !== undefined && km > 0 && (
            <div className="text-muted-foreground">{Math.round(km)} km</div>
          )}
          {travelNotes && (
            <div className="text-muted-foreground italic">{travelNotes}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

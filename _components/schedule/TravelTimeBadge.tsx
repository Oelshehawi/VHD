"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../app/lib/utils";

interface TravelTimeBadgeProps {
  typicalMinutes: number;
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

function getColorClass(minutes: number): string {
  if (minutes < 90) return "text-green-600 dark:text-green-400";
  if (minutes <= 150) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getBgClass(minutes: number): string {
  if (minutes < 90) return "bg-green-500/10";
  if (minutes <= 150) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export default function TravelTimeBadge({
  typicalMinutes,
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-none font-medium",
            getBgClass(typicalMinutes),
            getColorClass(typicalMinutes),
            className,
          )}
        >
          {formatMinutes(typicalMinutes)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1 text-xs">
          <div className="font-semibold">Travel Time</div>
          <div>{formatMinutes(typicalMinutes)}</div>
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

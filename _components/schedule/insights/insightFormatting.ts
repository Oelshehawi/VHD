"use client";

import { format } from "date-fns";
import type { ScheduleInsightSlotCandidate } from "../../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../../app/lib/utils";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(dateKey?: string): Date | undefined {
  if (!dateKey) return undefined;
  const parts = dateKey.split("-");
  if (parts.length !== 3) return undefined;

  const year = Number.parseInt(parts[0] || "", 10);
  const month = Number.parseInt(parts[1] || "", 10);
  const day = Number.parseInt(parts[2] || "", 10);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return undefined;
  }

  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function formatDateKeyLong(dateKey?: string): string {
  if (!dateKey) return "Invalid Date";
  return formatDateStringUTC(dateKey);
}

export function scorePriority(score: number): "low" | "medium" | "high" {
  if (score >= 240) return "high";
  if (score >= 120) return "medium";
  return "low";
}

export function scorePriorityBadgeVariant(
  priority: "low" | "medium" | "high",
): "secondary" | "default" | "destructive" {
  if (priority === "high") return "destructive";
  if (priority === "medium") return "default";
  return "secondary";
}

export function candidateTechLabel(candidate: ScheduleInsightSlotCandidate): string {
  if (candidate.technicianNames && candidate.technicianNames.length > 0) {
    return candidate.technicianNames.join(" + ");
  }
  if (candidate.technicianName) return candidate.technicianName;
  if (candidate.technicianIds && candidate.technicianIds.length > 0) {
    return candidate.technicianIds.join(" + ");
  }
  return candidate.technicianId;
}

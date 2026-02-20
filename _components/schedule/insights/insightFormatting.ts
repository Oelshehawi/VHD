"use client";

import { format } from "date-fns";
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

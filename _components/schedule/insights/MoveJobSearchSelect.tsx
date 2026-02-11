"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn, formatDateStringUTC, formatTimeUTC } from "../../../app/lib/utils";
import { Button } from "../../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import type { MoveJobOption } from "./types";

interface MoveJobSearchSelectProps {
  jobs: MoveJobOption[];
  value: string;
  onSelect: (jobId: string) => void;
}

function parseStoredScheduleDateTime(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value || "").trim();
  if (!raw) return null;

  // Backward compatibility: "M/D/YYYY, h:mm:ss AM/PM" values represent UTC.
  const legacyMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );
  if (legacyMatch) {
    const month = Number.parseInt(legacyMatch[1] || "", 10);
    const day = Number.parseInt(legacyMatch[2] || "", 10);
    const year = Number.parseInt(legacyMatch[3] || "", 10);
    const hour12 = Number.parseInt(legacyMatch[4] || "", 10);
    const minute = Number.parseInt(legacyMatch[5] || "", 10);
    const second = Number.parseInt(legacyMatch[6] || "0", 10);
    const meridiem = (legacyMatch[7] || "").toUpperCase();

    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      Number.isFinite(hour12) &&
      Number.isFinite(minute) &&
      Number.isFinite(second)
    ) {
      const normalizedHour = hour12 % 12;
      const hour24 = meridiem === "PM" ? normalizedHour + 12 : normalizedHour;
      const parsed = new Date(
        Date.UTC(year, month - 1, day, hour24, minute, second, 0),
      );
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export default function MoveJobSearchSelect({
  jobs,
  value,
  onSelect,
}: MoveJobSearchSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedJob = jobs.find((job) => String(job._id) === value);
  const selectedJobStart = selectedJob
    ? parseStoredScheduleDateTime(selectedJob.startDateTime)
    : null;

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedJob ? (
            <span className="truncate">
              {selectedJob.jobTitle || "Untitled Job"} •{" "}
              {selectedJobStart
                ? `${formatDateStringUTC(selectedJobStart)} at ${formatTimeUTC(selectedJobStart)}`
                : String(selectedJob.startDateTime)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Search scheduled job to move...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          filter={(itemValue, search) => {
            if (itemValue.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Search jobs..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No job found.</CommandEmpty>
            <CommandGroup>
              {jobs.map((job) => {
                const jobId = String(job._id);
                const parsed = parseStoredScheduleDateTime(job.startDateTime);
                const dateLabel = !parsed
                  ? String(job.startDateTime)
                  : `${formatDateStringUTC(parsed)} at ${formatTimeUTC(parsed)}`;

                return (
                  <CommandItem
                    key={jobId}
                    value={`${job.jobTitle || "Untitled Job"} ${dateLabel}`}
                    onSelect={() => {
                      onSelect(jobId);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === jobId ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {job.jobTitle || "Untitled Job"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {dateLabel}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

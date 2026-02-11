"use client";

import { useState, useEffect } from "react";
import { CheckIcon, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { searchScheduledJobs } from "../../../app/lib/actions/scheduleJobs.actions";
import type { MoveJobOptionWithDetails } from "./types";
import type { ScheduleType } from "../../../app/lib/typeDefinitions";

interface MoveJobSearchSelectProps {
  value: string;
  onSelect: (job: MoveJobOptionWithDetails) => void;
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

function formatJobDate(startDateTime: string | Date): string {
  const parsed = parseStoredScheduleDateTime(startDateTime);
  if (!parsed) return String(startDateTime);
  return `${formatDateStringUTC(parsed)} at ${formatTimeUTC(parsed)}`;
}

export default function MoveJobSearchSelect({
  value,
  onSelect,
}: MoveJobSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScheduleType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<{
    title: string;
    dateLabel: string;
  } | null>(null);

  useEffect(() => {
    let isActive = true;
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const jobs = await searchScheduledJobs(trimmed, 25);
        if (isActive) {
          setResults(jobs as ScheduleType[]);
        }
      } catch (error) {
        console.error("Failed to search jobs:", error);
        if (isActive) setResults([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (job: ScheduleType) => {
    setSelectedDisplay({
      title: job.jobTitle || "Untitled Job",
      dateLabel: formatJobDate(job.startDateTime),
    });
    onSelect({
      _id: job._id,
      jobTitle: job.jobTitle,
      location: job.location,
      startDateTime: job.startDateTime,
      assignedTechnicians: job.assignedTechnicians,
      hours: job.hours,
      technicianNotes: job.technicianNotes,
      onSiteContact: job.onSiteContact,
      accessInstructions: job.accessInstructions,
    });
    setOpen(false);
  };

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
          {selectedDisplay ? (
            <span className="truncate">
              {selectedDisplay.title} • {selectedDisplay.dateLabel}
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
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search jobs..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[300px]">
            {isLoading && (
              <div className="text-muted-foreground flex items-center gap-2 px-4 py-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}
            {!isLoading && query.trim() && results.length === 0 && (
              <CommandEmpty>No job found.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((job) => {
                  const jobId = String(job._id);
                  const dateLabel = formatJobDate(job.startDateTime);

                  return (
                    <CommandItem
                      key={jobId}
                      value={jobId}
                      onSelect={() => handleSelect(job)}
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
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

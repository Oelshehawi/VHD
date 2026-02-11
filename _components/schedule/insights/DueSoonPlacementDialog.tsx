"use client";

import { Loader2, Search, Wand2 } from "lucide-react";
import type {
  DueSoonPlacementSuggestion,
  ScheduleInsightSlotCandidate,
} from "../../../app/lib/typeDefinitions";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { DatePicker } from "../../ui/date-picker";
import { MultiSelect, MultiSelectOption } from "../../ui/multi-select";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  candidateTechLabel,
  formatDateKeyLong,
  parseDateKey,
  scorePriority,
  scorePriorityBadgeVariant,
  toDateKey,
} from "./insightFormatting";
import { formatTimeUTC } from "../../../app/lib/utils";

interface DueSoonPlacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dueSoonDateFrom: string;
  dueSoonDateTo: string;
  onDueSoonDateFromChange: (dateKey: string) => void;
  onDueSoonDateToChange: (dateKey: string) => void;
  // Job loading
  dueSoonJobs: DueSoonPlacementSuggestion[];
  isLoadingJobs: boolean;
  onLoadJobs: () => void;
  // Job selection
  selectedJobIds: string[];
  onSelectedJobIdsChange: (ids: string[]) => void;
  // Technician filter
  technicianOptions: MultiSelectOption[];
  technicianIds: string[];
  onTechnicianIdsChange: (ids: string[]) => void;
  // Due policy
  duePolicy: "hard" | "soft";
  onDuePolicyChange: (policy: "hard" | "soft") => void;
  // Results
  suggestions: DueSoonPlacementSuggestion[];
  isPending: boolean;
  onGenerate: () => void;
}

export default function DueSoonPlacementDialog({
  open,
  onOpenChange,
  dueSoonDateFrom,
  dueSoonDateTo,
  onDueSoonDateFromChange,
  onDueSoonDateToChange,
  dueSoonJobs,
  isLoadingJobs,
  onLoadJobs,
  selectedJobIds,
  onSelectedJobIdsChange,
  technicianOptions,
  technicianIds,
  onTechnicianIdsChange,
  duePolicy,
  onDuePolicyChange,
  suggestions,
  isPending,
  onGenerate,
}: DueSoonPlacementDialogProps) {
  const formatPrevSchedule = (
    prev: NonNullable<DueSoonPlacementSuggestion["previousSchedule"]>,
  ) => {
    const time = formatTimeUTC(prev.startDateTime);
    const names = prev.technicianNames.join(", ");
    return `Last: ${time} by ${names} (${prev.hours}h)`;
  };

  const toggleJob = (id: string) => {
    onSelectedJobIdsChange(
      selectedJobIds.includes(id)
        ? selectedJobIds.filter((j) => j !== id)
        : [...selectedJobIds, id],
    );
  };

  const selectAll = () => {
    onSelectedJobIdsChange(dueSoonJobs.map((j) => j.jobsDueSoonId));
  };

  const deselectAll = () => {
    onSelectedJobIdsChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] !max-w-[1200px] overflow-hidden p-0">
        <div className="flex max-h-[92vh] min-h-0 flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-3">
            <DialogTitle>Place Due Soon Jobs</DialogTitle>
            <DialogDescription>
              Load unscheduled due-soon jobs, select which to analyze, then
              generate placement candidates instantly.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 px-6 pb-4">
              {/* Date range + Load button */}
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <DatePicker
                  date={parseDateKey(dueSoonDateFrom)}
                  onSelect={(selected) => {
                    if (!selected) return;
                    onDueSoonDateFromChange(toDateKey(selected));
                  }}
                  placeholder="From date"
                  displayFormat="MMMM d, yyyy"
                  className="overflow-hidden text-ellipsis whitespace-nowrap"
                />
                <DatePicker
                  date={parseDateKey(dueSoonDateTo)}
                  onSelect={(selected) => {
                    if (!selected) return;
                    onDueSoonDateToChange(toDateKey(selected));
                  }}
                  placeholder="To date"
                  displayFormat="MMMM d, yyyy"
                  className="overflow-hidden text-ellipsis whitespace-nowrap"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLoadJobs}
                  disabled={isLoadingJobs}
                  className="gap-1"
                >
                  {isLoadingJobs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isLoadingJobs ? "Loading..." : "Load Jobs"}
                </Button>
              </div>

              {/* Technician filter */}
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Filter technicians (optional)
                </p>
                <MultiSelect
                  options={technicianOptions}
                  value={technicianIds}
                  onValueChange={onTechnicianIdsChange}
                  placeholder="Filter to specific technicians"
                  searchable={true}
                  maxCount={3}
                />
              </div>

              {/* Due policy */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Due mode</p>
                <div className="max-w-[320px]">
                  <Select
                    value={duePolicy}
                    onValueChange={(value) =>
                      onDuePolicyChange(value === "hard" ? "hard" : "soft")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Due mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">
                        Soft due mode (Recommended)
                      </SelectItem>
                      <SelectItem value="hard">Hard due mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-muted-foreground text-xs">
                  {duePolicy === "soft"
                    ? "Soft mode caps overdue impact so load still influences ranking."
                    : "Hard mode applies strict overdue penalty and prioritizes earliest dates."}
                </p>
              </div>

              {/* Job selection checklist */}
              {dueSoonJobs.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">
                      {dueSoonJobs.length} unscheduled job
                      {dueSoonJobs.length > 1 ? "s" : ""} found
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={selectAll}
                        className="h-7 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                        className="h-7 text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[200px] overflow-y-auto rounded border">
                    <div className="space-y-1 p-2">
                      {dueSoonJobs.map((job) => (
                        <label
                          key={job.jobsDueSoonId}
                          className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded px-2 py-1.5"
                        >
                          <Checkbox
                            checked={selectedJobIds.includes(
                              job.jobsDueSoonId,
                            )}
                            onCheckedChange={() =>
                              toggleJob(job.jobsDueSoonId)
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {job.jobTitle}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {job.location || "No location"}
                            </p>
                            {job.previousSchedule ? (
                              <p className="truncate text-xs text-blue-600 dark:text-blue-400">
                                {formatPrevSchedule(job.previousSchedule)}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              Due {formatDateKeyLong(job.dateDue)}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {job.estimatedHours}h
                            </Badge>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Generate button */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={onGenerate}
                  disabled={isPending || selectedJobIds.length === 0}
                  className="gap-1"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isPending
                    ? "Generating..."
                    : `Generate (${selectedJobIds.length} job${selectedJobIds.length !== 1 ? "s" : ""})`}
                </Button>
                <p className="text-muted-foreground text-xs">
                  Score = Due penalty + Crew load. Lower is better.
                </p>
              </div>

              {/* Results */}
              {(isPending || suggestions.length > 0) && <Separator />}

              {isPending ? (
                <p className="text-muted-foreground text-sm">
                  Generating placement candidates...
                </p>
              ) : suggestions.length > 0 ? (
                <div className="space-y-4 pb-2">
                  {suggestions.map((suggestion) => (
                    <article
                      key={suggestion.jobsDueSoonId}
                      className="rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          Due {formatDateKeyLong(suggestion.dateDue)}
                        </Badge>
                        <Badge variant="secondary">
                          {suggestion.estimatedHours}h est.
                        </Badge>
                        {suggestion.candidates.length === 0 ? (
                          <Badge variant="destructive">No viable slot</Badge>
                        ) : null}
                      </div>

                      <h4 className="mt-2 text-sm font-semibold">
                        {suggestion.jobTitle}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {suggestion.location || "No location found"}
                      </p>
                      {suggestion.previousSchedule ? (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {formatPrevSchedule(suggestion.previousSchedule)}
                        </p>
                      ) : null}

                      {suggestion.candidates.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {suggestion.candidates.map(
                            (
                              candidate: ScheduleInsightSlotCandidate,
                              index: number,
                            ) => {
                              const priority = scorePriority(candidate.score);
                              return (
                                <div
                                  key={`${suggestion.jobsDueSoonId}-${candidate.technicianId}-${candidate.date}-${index}`}
                                  className="bg-muted/30 rounded border p-2"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant={scorePriorityBadgeVariant(
                                        priority,
                                      )}
                                    >
                                      {priority} priority
                                    </Badge>
                                    <Badge variant="outline">
                                      Score {Math.round(candidate.score)}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-sm font-medium">
                                    {formatDateKeyLong(candidate.date)} •{" "}
                                    {candidateTechLabel(candidate)}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {candidate.reason}
                                  </p>
                                  {candidate.scoreBreakdown ? (
                                    <p className="text-muted-foreground mt-1 text-xs">
                                      Due +
                                      {
                                        candidate.scoreBreakdown
                                          .duePenaltyPoints
                                      }{" "}
                                      (
                                      {candidate.scoreBreakdown.duePenaltyDays}
                                      d) • Load +
                                      {candidate.scoreBreakdown.loadPoints} (
                                      {candidate.scoreBreakdown.loadHours.toFixed(
                                        1,
                                      )}
                                      h avg)
                                    </p>
                                  ) : null}
                                </div>
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground mt-2 text-xs">
                          No candidates found. Try expanding the date window or
                          rebalancing existing workload.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

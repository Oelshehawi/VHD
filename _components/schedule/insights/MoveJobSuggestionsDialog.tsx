"use client";

import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { ScheduleInsightSlotCandidate } from "../../../app/lib/typeDefinitions";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
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
import MoveJobSearchSelect from "./MoveJobSearchSelect";
import type { MoveJobOptionWithDetails } from "./types";

interface MoveJobSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moveJobId: string;
  onSelectJob: (job: MoveJobOptionWithDetails) => void;
  moveDateFrom: string;
  moveDateTo: string;
  onMoveDateFromChange: (dateKey: string) => void;
  onMoveDateToChange: (dateKey: string) => void;
  technicianOptions: MultiSelectOption[];
  moveTechnicianIds: string[];
  onMoveTechnicianIdsChange: (ids: string[]) => void;
  moveDuePolicy: "hard" | "soft";
  onMoveDuePolicyChange: (mode: "hard" | "soft") => void;
  moveSelectedJobLabel: string;
  moveCandidates: ScheduleInsightSlotCandidate[];
  isPending: boolean;
  isApplyingSlot?: boolean;
  onGenerate: () => void;
  onUseSlot: (candidate: ScheduleInsightSlotCandidate) => void;
}

export default function MoveJobSuggestionsDialog({
  open,
  onOpenChange,
  moveJobId,
  onSelectJob,
  moveDateFrom,
  moveDateTo,
  onMoveDateFromChange,
  onMoveDateToChange,
  technicianOptions,
  moveTechnicianIds,
  onMoveTechnicianIdsChange,
  moveDuePolicy,
  onMoveDuePolicyChange,
  moveSelectedJobLabel,
  moveCandidates,
  isPending,
  isApplyingSlot = false,
  onGenerate,
  onUseSlot,
}: MoveJobSuggestionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1200px] overflow-hidden p-0">
        <div className="flex max-h-[92vh] min-h-0 flex-col">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle>Move Job Suggestions</DialogTitle>
            <DialogDescription>
              Select an existing scheduled job, generate options, then apply a
              slot to update that job directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-4">
            <div className="space-y-2">
              <p className="text-xs font-medium">Job to move</p>
              <MoveJobSearchSelect
                value={moveJobId}
                onSelect={onSelectJob}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <DatePicker
                date={parseDateKey(moveDateFrom)}
                onSelect={(selected) => {
                  if (!selected) return;
                  onMoveDateFromChange(toDateKey(selected));
                }}
                placeholder="From date"
                displayFormat="MMMM d, yyyy"
                className="overflow-hidden text-ellipsis whitespace-nowrap"
              />
              <DatePicker
                date={parseDateKey(moveDateTo)}
                onSelect={(selected) => {
                  if (!selected) return;
                  onMoveDateToChange(toDateKey(selected));
                }}
                placeholder="To date"
                displayFormat="MMMM d, yyyy"
                className="overflow-hidden text-ellipsis whitespace-nowrap"
              />
              <Button
                type="button"
                onClick={() => {
                  if (!moveJobId) {
                    toast.error("Select a job first.");
                    return;
                  }
                  onGenerate();
                }}
                disabled={isPending || !moveJobId}
                className="gap-1 lg:min-w-[132px]"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isPending ? "Generating..." : "Generate"}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium">
                Filter technicians (optional)
              </p>
              <MultiSelect
                options={technicianOptions}
                value={moveTechnicianIds}
                onValueChange={onMoveTechnicianIdsChange}
                placeholder="Filter to specific technicians"
                searchable={true}
                maxCount={3}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium">Due mode</p>
              <div className="max-w-[320px]">
                <Select
                  value={moveDuePolicy}
                  onValueChange={(value) =>
                    onMoveDuePolicyChange(value === "hard" ? "hard" : "soft")
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
                {moveDuePolicy === "soft"
                  ? "Soft mode caps overdue impact so load and travel still influence ranking."
                  : "Hard mode applies strict overdue penalty and prioritizes earliest dates."}
              </p>
            </div>

            <p className="text-muted-foreground text-xs">
              Score = Due penalty + Crew load + Travel impact. Lower is better.
            </p>
          </div>

          <Separator />

          <div className="min-h-0 flex-1 px-6 py-4">
            {isPending ? (
              <p className="text-muted-foreground text-sm">
                Generating move-job suggestions...
              </p>
            ) : moveCandidates.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No suggestion run yet. Select a job and click Generate.
              </p>
            ) : (
              <ScrollArea className="h-full pr-3">
                <div className="space-y-3 pb-2">
                  <p className="text-sm font-medium">
                    {moveCandidates.length} option
                    {moveCandidates.length > 1 ? "s" : ""} for{" "}
                    {moveSelectedJobLabel || "selected job"}
                  </p>
                  {moveCandidates.map((candidate, idx) => {
                    const priority = scorePriority(candidate.score);
                    return (
                      <article
                        key={`${candidate.date}-${candidate.technicianId}-${idx}`}
                        className="rounded-md border p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={scorePriorityBadgeVariant(priority)}>
                            {priority} priority
                          </Badge>
                          <Badge variant="outline">
                            Score {Math.round(candidate.score)}
                          </Badge>
                        </div>

                        <h4 className="mt-2 text-sm font-semibold">
                          {formatDateKeyLong(candidate.date)} •{" "}
                          {candidateTechLabel(candidate)}
                        </h4>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {candidate.reason}
                        </p>
                        {candidate.scoreBreakdown ? (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Due +{candidate.scoreBreakdown.duePenaltyPoints} (
                            {candidate.scoreBreakdown.duePenaltyDays}d) • Load +
                            {candidate.scoreBreakdown.loadPoints} (
                            {candidate.scoreBreakdown.loadHours.toFixed(1)}h
                            avg) • Travel +
                            {candidate.scoreBreakdown.travelPoints}
                          </p>
                        ) : null}

                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onUseSlot(candidate)}
                            disabled={isApplyingSlot}
                            className="gap-1"
                          >
                            {isApplyingSlot ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              "Use This Slot"
                            )}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Wand2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyzeDueSoonPlacement,
  analyzeMoveJob,
  analyzeScheduleWindow,
  dismissScheduleInsight,
  fetchUnscheduledDueSoonJobs,
  listScheduleInsights,
  resolveScheduleInsight,
} from "../../../app/lib/actions/scheduleInsights.actions";
import { updateJob } from "../../../app/lib/actions/scheduleJobs.actions";
import type {
  DueSoonPlacementSuggestion,
  ScheduleInsightSlotCandidate,
  ScheduleInsightStatus,
} from "../../../app/lib/typeDefinitions";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { DatePicker } from "../../ui/date-picker";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { MultiSelectOption } from "../../ui/multi-select";
import DueSoonPlacementDialog from "./DueSoonPlacementDialog";
import {
  candidateTechLabel,
  formatDateKeyLong,
  parseDateKey,
  toDateKey,
} from "./insightFormatting";
import MoveJobSuggestionsDialog from "./MoveJobSuggestionsDialog";
import type { MoveJobOptionWithDetails } from "./types";

function severityVariant(
  severity: string,
): "secondary" | "destructive" | "default" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "default";
  return "secondary";
}

function statusPill(status: ScheduleInsightStatus) {
  if (status === "resolved") return "Resolved";
  if (status === "dismissed") return "Dismissed";
  return "Open";
}

function parseStoredScheduleDateTime(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value || "").trim();
  if (!raw) return null;

  // Backward compatibility: schedule fetches can return "M/D/YYYY, h:mm:ss AM/PM" UTC strings.
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

interface ScheduleInsightsPanelProps {
  canManage: boolean;
  defaultDateFrom: string;
  defaultDateTo: string;
  technicians?: { id: string; name: string }[];
  moveJobOptions?: MoveJobOptionWithDetails[];
}

export default function ScheduleInsightsPanel({
  canManage,
  defaultDateFrom,
  defaultDateTo,
  technicians = [],
  moveJobOptions = [],
}: ScheduleInsightsPanelProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ScheduleInsightStatus>("open");
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);

  const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
  const [dueSoonDateFrom, setDueSoonDateFrom] = useState(defaultDateFrom);
  const [dueSoonDateTo, setDueSoonDateTo] = useState(defaultDateTo);
  const [dueSoonJobs, setDueSoonJobs] = useState<
    DueSoonPlacementSuggestion[]
  >([]);
  const [selectedDueSoonJobIds, setSelectedDueSoonJobIds] = useState<string[]>(
    [],
  );
  const [dueSoonTechnicianIds, setDueSoonTechnicianIds] = useState<string[]>(
    [],
  );
  const [dueSoonDuePolicy, setDueSoonDuePolicy] = useState<"hard" | "soft">(
    "soft",
  );
  const [dueSoonSuggestions, setDueSoonSuggestions] = useState<
    DueSoonPlacementSuggestion[]
  >([]);

  const [isMoveJobModalOpen, setIsMoveJobModalOpen] = useState(false);
  const [moveDateFrom, setMoveDateFrom] = useState(defaultDateFrom);
  const [moveDateTo, setMoveDateTo] = useState(defaultDateTo);
  const [moveTechnicianIds, setMoveTechnicianIds] = useState<string[]>([]);
  const [moveCandidates, setMoveCandidates] = useState<
    ScheduleInsightSlotCandidate[]
  >([]);
  const [moveSelectedJobLabel, setMoveSelectedJobLabel] = useState("");
  const [moveDuePolicy, setMoveDuePolicy] = useState<"hard" | "soft">("soft");
  const [moveJobId, setMoveJobId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "warning" | "info"
  >("all");

  const technicianOptions = useMemo<MultiSelectOption[]>(() => {
    return technicians.map((tech) => ({
      value: tech.id,
      label: tech.name,
    }));
  }, [technicians]);

  const openCountQuery = useQuery({
    queryKey: ["scheduleInsights", "count", defaultDateFrom, defaultDateTo],
    queryFn: () =>
      listScheduleInsights({
        status: "open",
        dateFrom: defaultDateFrom,
        dateTo: defaultDateTo,
        limit: 200,
      }),
    enabled: canManage,
    staleTime: 30 * 1000,
  });

  const insightsQuery = useQuery({
    queryKey: ["scheduleInsights", status, dateFrom, dateTo],
    queryFn: () =>
      listScheduleInsights({
        status,
        dateFrom,
        dateTo,
        limit: 200,
      }),
    enabled: isOpen && canManage,
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      analyzeScheduleWindow({
        dateFrom,
        dateTo,
        trigger: dateFrom === dateTo ? "manual_day" : "manual_range",
        includeAI: true,
      }),
    onSuccess: (result) => {
      toast.success(
        result.aiUsed
          ? `Analysis complete: ${result.generatedCount} insight(s) updated.`
          : `Analysis complete in rule-only mode: ${result.generatedCount} insight(s) updated.`,
      );
      queryClient.invalidateQueries({ queryKey: ["scheduleInsights"] });
      setStatus("open");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to analyze schedule range.");
    },
  });

  const moveJobMutation = useMutation({
    mutationFn: () => {
      const today = toDateKey(new Date());
      return analyzeMoveJob({
        scheduleId: moveJobId,
        dateFrom: moveDateFrom < today ? today : moveDateFrom,
        dateTo: moveDateTo < today ? today : moveDateTo,
        technicianIds: moveTechnicianIds,
        crewSize: 2,
        duePolicy: moveDuePolicy,
        bufferMinutes: 30,
        includeAI: true,
      });
    },
    onSuccess: (result) => {
      const selectedJob = moveJobOptions.find(
        (job) => String(job._id) === moveJobId,
      );
      setMoveSelectedJobLabel(selectedJob?.jobTitle || "Selected job");
      setMoveCandidates(result.candidates);
      setMoveDuePolicy(result.duePolicy === "hard" ? "hard" : "soft");
      toast.success(
        result.aiUsed
          ? `Move-job analysis complete: ${result.candidates.length} candidate slot(s) generated.`
          : `Move-job analysis complete in rule-only mode: ${result.candidates.length} candidate slot(s) generated.`,
      );
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to analyze move-job options.");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (insightId: string) => resolveScheduleInsight({ insightId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduleInsights"] });
      toast.success("Insight resolved.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to resolve insight.");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (insightId: string) => dismissScheduleInsight({ insightId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduleInsights"] });
      toast.success("Insight dismissed.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to dismiss insight.");
    },
  });

  const fetchDueSoonJobsMutation = useMutation({
    mutationFn: () =>
      fetchUnscheduledDueSoonJobs({
        dateFrom: dueSoonDateFrom,
        dateTo: dueSoonDateTo,
      }),
    onSuccess: (jobs) => {
      setDueSoonJobs(jobs);
      setSelectedDueSoonJobIds(jobs.map((j) => j.jobsDueSoonId));
      setDueSoonSuggestions([]);
      toast.success(
        jobs.length > 0
          ? `Found ${jobs.length} unscheduled due-soon job(s).`
          : "No unscheduled due-soon jobs in this date range.",
      );
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to load due-soon jobs.");
    },
  });

  const dueSoonGenerateMutation = useMutation({
    mutationFn: () =>
      analyzeDueSoonPlacement({
        jobsDueSoonIds: selectedDueSoonJobIds,
        dateFrom: dueSoonDateFrom,
        dateTo: dueSoonDateTo,
        technicianIds: dueSoonTechnicianIds,
        crewSize: 1,
        duePolicy: dueSoonDuePolicy,
      }),
    onSuccess: (result) => {
      setDueSoonSuggestions(result.suggestions);
      toast.success(
        `Generated placement candidates for ${result.suggestions.length} job(s).`,
      );
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to generate due-soon placement suggestions.");
    },
  });

  const applyMoveSlotMutation = useMutation({
    mutationFn: async (candidate: ScheduleInsightSlotCandidate) => {
      const selectedJob = moveJobOptions.find(
        (job) => String(job._id) === moveJobId,
      );
      if (!selectedJob) {
        throw new Error("Selected job not found.");
      }

      const selectedStart = parseStoredScheduleDateTime(
        selectedJob.startDateTime,
      );
      if (!selectedStart) {
        throw new Error("Selected job start time is invalid.");
      }

      const targetSlotStart = parseStoredScheduleDateTime(
        candidate.startDateTime,
      );
      if (!targetSlotStart) {
        throw new Error("Selected slot start time is invalid.");
      }

      const nextTechnicians =
        candidate.technicianIds && candidate.technicianIds.length > 0
          ? candidate.technicianIds
          : candidate.technicianId
            ? [candidate.technicianId]
            : [];

      if (nextTechnicians.length === 0) {
        throw new Error("Selected slot is missing technician assignment.");
      }

      const parts = candidate.date.split("-");
      const parsedYear = Number.parseInt(parts[0] || "", 10);
      const parsedMonth = Number.parseInt(parts[1] || "", 10);
      const parsedDay = Number.parseInt(parts[2] || "", 10);

      const slotYear = Number.isFinite(parsedYear)
        ? parsedYear
        : targetSlotStart.getUTCFullYear();
      const slotMonth = Number.isFinite(parsedMonth)
        ? parsedMonth
        : targetSlotStart.getUTCMonth() + 1;
      const slotDay = Number.isFinite(parsedDay)
        ? parsedDay
        : targetSlotStart.getUTCDate();

      // Keep the original job time-of-day; only move the calendar date.
      const preservedStart = new Date(
        Date.UTC(
          slotYear,
          slotMonth - 1,
          slotDay,
          selectedStart.getUTCHours(),
          selectedStart.getUTCMinutes(),
          selectedStart.getUTCSeconds(),
          selectedStart.getUTCMilliseconds(),
        ),
      );

      await updateJob({
        scheduleId: String(selectedJob._id),
        jobTitle: selectedJob.jobTitle || "Scheduled Job",
        location: selectedJob.location || "",
        startDateTime: preservedStart.toISOString(),
        assignedTechnicians: nextTechnicians,
        technicianNotes: selectedJob.technicianNotes,
        hours: selectedJob.hours,
        onSiteContact: selectedJob.onSiteContact,
        accessInstructions: selectedJob.accessInstructions,
      });
    },
    onSuccess: () => {
      setIsMoveJobModalOpen(false);
      setIsOpen(false);
      setMoveCandidates([]);
      toast.success("Job updated to selected slot.");
      queryClient.invalidateQueries({ queryKey: ["scheduleInsights"] });
      router.refresh();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to apply selected slot.");
    },
  });

  const openCount = (openCountQuery.data || []).length;
  const insights = useMemo(
    () => insightsQuery.data || [],
    [insightsQuery.data],
  );

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      if (severityFilter !== "all" && insight.severity !== severityFilter) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        insight.title.toLowerCase().includes(query) ||
        insight.message.toLowerCase().includes(query) ||
        String(insight.kind || "")
          .toLowerCase()
          .includes(query) ||
        String(insight.dateKey || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [insights, searchQuery, severityFilter]);

  if (!canManage) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1"
        onClick={() => {
          setDateFrom(defaultDateFrom);
          setDateTo(defaultDateTo);
          setDueSoonDateFrom(defaultDateFrom);
          setDueSoonDateTo(defaultDateTo);
          setDueSoonJobs([]);
          setSelectedDueSoonJobIds([]);
          setDueSoonTechnicianIds([]);
          setDueSoonDuePolicy("soft");
          setDueSoonSuggestions([]);
          setMoveDateFrom(defaultDateFrom);
          setMoveDateTo(defaultDateTo);
          setMoveDuePolicy("soft");
          setMoveTechnicianIds([]);
          setMoveCandidates([]);
          setMoveSelectedJobLabel("");
          setMoveJobId("");
          setIsOpen(true);
        }}
      >
        <Brain className="h-4 w-4" />
        Insights
        {openCount > 0 ? (
          <Badge
            variant="destructive"
            className="ml-1 h-5 min-w-5 px-1 text-[10px]"
          >
            {openCount > 99 ? "99+" : openCount}
          </Badge>
        ) : null}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[96vw] max-w-3xl p-0 sm:w-[760px] sm:max-w-3xl">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Schedule Insights
            </SheetTitle>
            <SheetDescription>
              Run AI-assisted checks, review warnings, and manage insight
              resolution.
            </SheetDescription>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
              <DatePicker
                date={parseDateKey(dateFrom)}
                onSelect={(selected) =>
                  selected && setDateFrom(toDateKey(selected))
                }
                placeholder="From date"
                displayFormat="MMMM d, yyyy"
              />
              <DatePicker
                date={parseDateKey(dateTo)}
                onSelect={(selected) =>
                  selected && setDateTo(toDateKey(selected))
                }
                placeholder="To date"
                displayFormat="MMMM d, yyyy"
              />
              <Button
                type="button"
                variant="default"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="gap-1"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDueSoonModalOpen(true)}
                className="gap-1"
              >
                <CalendarClock className="h-4 w-4" />
                Place Due Soon Jobs
              </Button>
            </div>

            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMoveDateFrom(dateFrom);
                  setMoveDateTo(dateTo);
                  setMoveDuePolicy("soft");
                  setMoveCandidates([]);
                  setIsMoveJobModalOpen(true);
                }}
                className="gap-1"
              >
                <Wand2 className="h-4 w-4" />
                Move Job Suggestions
              </Button>
            </div>

            <Tabs
              value={status}
              onValueChange={(next) => setStatus(next as ScheduleInsightStatus)}
            >
              <TabsList className="mt-2 h-8">
                <TabsTrigger value="open" className="text-xs">
                  Open
                </TabsTrigger>
                <TabsTrigger value="resolved" className="text-xs">
                  Resolved
                </TabsTrigger>
                <TabsTrigger value="dismissed" className="text-xs">
                  Dismissed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter insights by text..."
              />

              <Select
                value={severityFilter}
                onValueChange={(value) =>
                  setSeverityFilter(
                    value as "all" | "critical" | "warning" | "info",
                  )
                }
              >
                <SelectTrigger className="h-9 min-w-[170px]">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(95vh-220px)] p-4">
            {insightsQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">
                Loading insights...
              </p>
            ) : filteredInsights.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No insights for this filter range.
              </p>
            ) : (
              <div className="space-y-3 pb-6">
                {filteredInsights.map((insight) => (
                  <article
                    key={String(insight._id)}
                    className="rounded-md border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={severityVariant(insight.severity)}>
                        {insight.severity}
                      </Badge>
                      <Badge variant="secondary">
                        {statusPill(insight.status)}
                      </Badge>
                      {insight.dateKey ? (
                        <Badge variant="outline">
                          {formatDateKeyLong(insight.dateKey)}
                        </Badge>
                      ) : null}
                    </div>

                    <h4 className="mt-2 text-sm font-semibold">
                      {insight.title}
                    </h4>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {insight.message}
                    </p>

                    {insight.suggestionPayload?.candidates &&
                    insight.suggestionPayload.candidates.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-foreground text-xs font-medium">
                          {insight.suggestionPayload.candidates.length}{" "}
                          placement option
                          {insight.suggestionPayload.candidates.length > 1
                            ? "s"
                            : ""}
                        </p>
                        {insight.suggestionPayload.candidates.map(
                          (candidate, idx) => (
                            <div
                              key={`${String(insight._id)}-candidate-${idx}`}
                              className="bg-muted/30 flex flex-col gap-2 rounded border p-2 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {formatDateKeyLong(candidate.date)} •{" "}
                                  {candidateTechLabel(candidate)}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {candidate.reason} • Score{" "}
                                  {Math.round(candidate.score)}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}

                    {insight.status === "open" ? (
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            resolveMutation.mutate(String(insight._id))
                          }
                          disabled={
                            resolveMutation.isPending ||
                            dismissMutation.isPending
                          }
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            dismissMutation.mutate(String(insight._id))
                          }
                          disabled={
                            resolveMutation.isPending ||
                            dismissMutation.isPending
                          }
                          className="gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <MoveJobSuggestionsDialog
        open={isMoveJobModalOpen}
        onOpenChange={setIsMoveJobModalOpen}
        jobs={moveJobOptions}
        moveJobId={moveJobId}
        onMoveJobIdChange={setMoveJobId}
        moveDateFrom={moveDateFrom}
        moveDateTo={moveDateTo}
        onMoveDateFromChange={setMoveDateFrom}
        onMoveDateToChange={setMoveDateTo}
        technicianOptions={technicianOptions}
        moveTechnicianIds={moveTechnicianIds}
        onMoveTechnicianIdsChange={setMoveTechnicianIds}
        moveDuePolicy={moveDuePolicy}
        onMoveDuePolicyChange={setMoveDuePolicy}
        moveSelectedJobLabel={moveSelectedJobLabel}
        moveCandidates={moveCandidates}
        isPending={moveJobMutation.isPending}
        isApplyingSlot={applyMoveSlotMutation.isPending}
        onGenerate={() => {
          setMoveCandidates([]);
          moveJobMutation.mutate();
        }}
        onUseSlot={(candidate) => {
          applyMoveSlotMutation.mutate(candidate);
        }}
      />

      <DueSoonPlacementDialog
        open={isDueSoonModalOpen}
        onOpenChange={setIsDueSoonModalOpen}
        dueSoonDateFrom={dueSoonDateFrom}
        dueSoonDateTo={dueSoonDateTo}
        onDueSoonDateFromChange={setDueSoonDateFrom}
        onDueSoonDateToChange={setDueSoonDateTo}
        dueSoonJobs={dueSoonJobs}
        isLoadingJobs={fetchDueSoonJobsMutation.isPending}
        onLoadJobs={() => fetchDueSoonJobsMutation.mutate()}
        selectedJobIds={selectedDueSoonJobIds}
        onSelectedJobIdsChange={setSelectedDueSoonJobIds}
        technicianOptions={technicianOptions}
        technicianIds={dueSoonTechnicianIds}
        onTechnicianIdsChange={setDueSoonTechnicianIds}
        duePolicy={dueSoonDuePolicy}
        onDuePolicyChange={setDueSoonDuePolicy}
        suggestions={dueSoonSuggestions}
        isPending={dueSoonGenerateMutation.isPending}
        onGenerate={() => dueSoonGenerateMutation.mutate()}
      />
    </>
  );
}

export function defaultInsightWindowFromView(params: {
  currentView: "day" | "week" | "month";
  currentDay: Date;
  currentWeek: Date[];
  currentDate: string | null;
}): { dateFrom: string; dateTo: string } {
  if (params.currentView === "day") {
    const date = toDateKey(params.currentDay);
    return { dateFrom: date, dateTo: date };
  }

  if (params.currentView === "week") {
    const start = params.currentWeek[0] || params.currentDay;
    const end =
      params.currentWeek[params.currentWeek.length - 1] || params.currentDay;
    return {
      dateFrom: toDateKey(start),
      dateTo: toDateKey(end),
    };
  }

  if (params.currentDate) {
    const parsed = new Date(params.currentDate);
    if (!Number.isNaN(parsed.getTime())) {
      const firstDay = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      const lastDay = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);
      return {
        dateFrom: toDateKey(firstDay),
        dateTo: toDateKey(lastDay),
      };
    }
  }

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    dateFrom: toDateKey(thisMonthStart),
    dateTo: toDateKey(thisMonthEnd),
  };
}

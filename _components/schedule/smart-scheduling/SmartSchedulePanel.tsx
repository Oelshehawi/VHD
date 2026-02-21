"use client";

import { useState, useCallback, useMemo } from "react";
import { Wand2, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import JobsDueSoonSearch from "./JobsDueSoonSearch";
import DayRankingView from "./DayRankingView";
import ScheduleWizardModal from "./ScheduleWizardModal";
import {
  searchScheduleJobs,
  analyzeSchedulingOptions,
} from "../../../app/lib/actions/smartScheduling.actions";
import type {
  ScheduleJobSearchResult,
  DaySchedulingOption,
} from "../../../app/lib/actions/smartScheduling.actions";

interface SmartSchedulePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicians: { id: string; name: string; depotAddress?: string | null }[];
  onScheduleCreated?: () => void;
}

function extractTimeFromISO(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function getInitialDurationMinutes(job: ScheduleJobSearchResult): number {
  if (
    Number.isFinite(job.actualServiceDurationMinutes) &&
    (job.actualServiceDurationMinutes as number) > 0
  ) {
    return Math.round(job.actualServiceDurationMinutes as number);
  }
  if (
    Number.isFinite(job.historicalServiceDurationMinutes) &&
    (job.historicalServiceDurationMinutes as number) > 0
  ) {
    return Math.round(job.historicalServiceDurationMinutes as number);
  }
  return 240;
}

export default function SmartSchedulePanel({
  open,
  onOpenChange,
  technicians,
  onScheduleCreated,
}: SmartSchedulePanelProps) {
  const [selectedJob, setSelectedJob] =
    useState<ScheduleJobSearchResult | null>(null);
  const [dayOptions, setDayOptions] = useState<DaySchedulingOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preferredTime, setPreferredTime] = useState("08:00");
  const [analyzedTime, setAnalyzedTime] = useState("08:00");
  const [preferredDurationMinutes, setPreferredDurationMinutes] = useState(240);
  const [analyzedDurationMinutes, setAnalyzedDurationMinutes] = useState(240);
  const [lookaheadDays, setLookaheadDays] = useState(90);
  const [analyzedLookaheadDays, setAnalyzedLookaheadDays] = useState(90);
  const [includeEmptyDays, setIncludeEmptyDays] = useState(false);

  const depotAddress = useMemo(() => {
    return technicians.find((tech) => tech.depotAddress)?.depotAddress ?? null;
  }, [technicians]);

  const runAnalysis = useCallback(
    async (
      job: ScheduleJobSearchResult,
      time: string,
      durationMinutes: number,
      selectedLookaheadDays: number,
    ) => {
      setIsAnalyzing(true);
      setDayOptions([]);

      try {
        const [h, m] = time.split(":").map(Number);

        const options = await analyzeSchedulingOptions({
          scheduleJobId: job._id,
          newJobLocation: job.location,
          newJobTitle: job.jobTitle,
          depotAddress,
          startHour: h ?? 8,
          startMinute: m ?? 0,
          durationMinutes,
          lookaheadDays: selectedLookaheadDays,
        });

        setDayOptions(options);
        setAnalyzedTime(time);
        setAnalyzedDurationMinutes(durationMinutes);
        setAnalyzedLookaheadDays(selectedLookaheadDays);
      } catch (error) {
        console.error("Error analyzing scheduling options:", error);
        setDayOptions([]);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [depotAddress],
  );

  const handleJobSelect = useCallback(
    async (job: ScheduleJobSearchResult) => {
      setSelectedJob(job);
      setSelectedDate(null);
      const sourceTime = extractTimeFromISO(job.startDateTime);
      const sourceDurationMinutes = getInitialDurationMinutes(job);
      setPreferredTime(sourceTime);
      setPreferredDurationMinutes(sourceDurationMinutes);
      await runAnalysis(job, sourceTime, sourceDurationMinutes, lookaheadDays);
    },
    [lookaheadDays, runAnalysis],
  );

  const handleReanalyze = useCallback(() => {
    if (selectedJob) {
      runAnalysis(
        selectedJob,
        preferredTime,
        preferredDurationMinutes,
        lookaheadDays,
      );
    }
  }, [
    selectedJob,
    preferredTime,
    preferredDurationMinutes,
    lookaheadDays,
    runAnalysis,
  ]);

  const handleSchedule = useCallback((date: string) => {
    setSelectedDate(date);
    setWizardOpen(true);
  }, []);

  const handleWizardComplete = useCallback(() => {
    setWizardOpen(false);
    setSelectedJob(null);
    setDayOptions([]);
    setSelectedDate(null);
    onScheduleCreated?.();
    onOpenChange(false);
  }, [onScheduleCreated, onOpenChange]);

  const handleClose = useCallback(() => {
    setSelectedJob(null);
    setDayOptions([]);
    setSelectedDate(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const analysisInputsChanged =
    preferredTime !== analyzedTime ||
    preferredDurationMinutes !== analyzedDurationMinutes ||
    lookaheadDays !== analyzedLookaheadDays;

  const visibleDayOptions = useMemo(() => {
    if (includeEmptyDays) return dayOptions;
    return dayOptions.filter((option) => option.existingJobsCount > 0);
  }, [dayOptions, includeEmptyDays]);

  const hiddenEmptyDaysCount = useMemo(() => {
    return dayOptions.reduce(
      (count, option) => count + (option.existingJobsCount === 0 ? 1 : 0),
      0,
    );
  }, [dayOptions]);

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Smart Scheduling
            </SheetTitle>
            <SheetDescription>
              Search for any job and find the best day to schedule based on
              drive time optimization. Toggle to &quot;Late Arrival&quot; to
              review not-recommended options.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {!selectedJob ? (
              <div>
                <h3 className="mb-3 font-medium">Step 1: Search for Job</h3>
                <JobsDueSoonSearch
                  onSelect={handleJobSelect}
                  searchScheduleJobs={searchScheduleJobs}
                />
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {selectedJob.jobTitle}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {selectedJob.clientName} • {selectedJob.location}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(null);
                        setDayOptions([]);
                        setSelectedDate(null);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                {/* Preferred start time and duration */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="preferred-time"
                        className="text-sm font-medium"
                      >
                        Preferred Start Time
                      </Label>
                      <Input
                        id="preferred-time"
                        type="time"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="preferred-duration"
                        className="text-sm font-medium"
                      >
                        Duration (minutes)
                      </Label>
                      <Input
                        id="preferred-duration"
                        type="number"
                        min={1}
                        max={1440}
                        step={15}
                        value={preferredDurationMinutes}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          if (Number.isFinite(parsed)) {
                            setPreferredDurationMinutes(
                              Math.max(1, Math.min(1440, parsed)),
                            );
                          }
                        }}
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Look Ahead</Label>
                      <Select
                        value={String(lookaheadDays)}
                        onValueChange={(value) => {
                          const parsed = Number.parseInt(value, 10);
                          if (Number.isFinite(parsed)) {
                            setLookaheadDays(parsed);
                          }
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {analysisInputsChanged && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleReanalyze}
                        disabled={isAnalyzing}
                      >
                        <RefreshCw
                          className={`mr-1.5 h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`}
                        />
                        Re-analyze
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Drive times are calculated from today using this start time,
                    duration, and look-ahead range.
                  </p>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-medium">Step 2: Pick a Day</h3>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="include-empty-days"
                        checked={includeEmptyDays}
                        onCheckedChange={(checked) =>
                          setIncludeEmptyDays(checked === true)
                        }
                      />
                      <Label
                        htmlFor="include-empty-days"
                        className="text-muted-foreground cursor-pointer text-xs"
                      >
                        Include empty days (0 jobs)
                      </Label>
                    </div>
                  </div>
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="border-primary mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                        <p className="text-muted-foreground text-sm">
                          Analyzing drive times...
                        </p>
                      </div>
                    </div>
                  ) : visibleDayOptions.length > 0 ? (
                    <DayRankingView
                      options={visibleDayOptions}
                      onSchedule={handleSchedule}
                      technicians={technicians}
                      newJobLocation={selectedJob.location}
                      newJobTitle={selectedJob.jobTitle}
                    />
                  ) : dayOptions.length > 0 && !includeEmptyDays ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      No days with existing jobs in this range.
                      {hiddenEmptyDaysCount > 0
                        ? ` ${hiddenEmptyDaysCount} empty day(s) are hidden.`
                        : ""}
                    </p>
                  ) : (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      No scheduling options found in this range.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {selectedJob && selectedDate && (
        <ScheduleWizardModal
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          sourceScheduleJobId={selectedJob._id}
          jobTitle={selectedJob.jobTitle}
          location={selectedJob.location}
          selectedDate={selectedDate}
          sourceStartTime={preferredTime}
          technicians={technicians}
          onComplete={handleWizardComplete}
        />
      )}
    </>
  );
}

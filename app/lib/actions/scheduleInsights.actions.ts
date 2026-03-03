"use server";

import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import connectMongo from "../connect";
import { requireAdmin } from "../auth/utils";
import {
  Schedule,
  JobsDueSoon,
  ScheduleInsight,
  ScheduleInsightRun,
} from "../../../models/reactDataSchema";
import {
  type ScheduleType,
  type ScheduleInsightType,
  type ScheduleInsightStatus,
  type ScheduleInsightSeverity,
  type ScheduleInsightSource,
  type ScheduleInsightKind,
  SCHEDULE_INSIGHT_KINDS,
  type ScheduleInsightTrigger,
} from "../typeDefinitions";
import { getBatchTravelTimeSummaries } from "./travelTime.actions";
import { getTechnicians } from "./scheduleJobs.actions";
import {
  getBusinessDateKey,
  getScheduleDisplayDateKey,
  getServiceDayTimelineDate,
} from "../utils/scheduleDayUtils";
import { formatTimeUTC, formatDateStringUTC } from "../utils";
import { getEffectiveServiceDurationMinutes } from "../serviceDurationRules";

type ListScheduleInsightsArgs = {
  status?: ScheduleInsightStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  technicianId?: string;
  kinds?: ScheduleInsightKind[];
  limit?: number;
  futureOnly?: boolean;
};

type AnalyzeScheduleWindowArgs = {
  dateFrom: string;
  dateTo: string;
  technicianIds?: string[];
  trigger?: ScheduleInsightTrigger;
  includeAI?: boolean;
  skipAuth?: boolean;
};

type PersistInsightDraft = {
  kind: ScheduleInsightKind;
  severity: ScheduleInsightSeverity;
  title: string;
  message: string;
  dateKey?: string | null;
  technicianId?: string | null;
  scheduleIds?: string[];
  jobsDueSoonIds?: string[];
  invoiceIds?: string[];
  suggestionPayload?: ScheduleInsightType["suggestionPayload"];
  source?: ScheduleInsightSource;
  confidence?: number;
  fingerprintData: Record<string, unknown>;
};

type TechnicianDirectoryEntry = {
  id: string;
  name: string;
  depotAddress: string | null;
};

type DueSoonAggregateRow = {
  _id: any;
  invoiceId: string;
  dateDue: Date | string;
  jobTitle: string;
  clientId: any;
  invoice?: {
    _id?: any;
    location?: string;
    jobTitle?: string;
  };
};

type UnscheduledDueSoonItem = {
  jobsDueSoonId: string;
  invoiceRef?: string;
  invoiceId: string;
  jobTitle: string;
  location: string;
  dateDue: string;
};

const ANALYSIS_KINDS: ScheduleInsightKind[] = [
  SCHEDULE_INSIGHT_KINDS.REST_GAP_WARNING,
  SCHEDULE_INSIGHT_KINDS.DUE_SOON_UNSCHEDULED,
];

const ACTIVE_INSIGHT_KINDS: ScheduleInsightKind[] = ANALYSIS_KINDS;
const DUE_SOON_ALERT_MAX_DAYS = 3;
const REST_GAP_CRITICAL_MAX_HOURS = 8;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_COOLDOWN_MS = 5 * 60 * 1000;

let openRouterHardDisabledReason: string | null = null;
let openRouterCooldownUntil = 0;

function getOpenRouterAvailability(): { available: boolean; reason?: string } {
  if (!process.env.OPENROUTER_API_KEY) {
    return { available: false, reason: "OPENROUTER_API_KEY is not configured" };
  }

  if (openRouterHardDisabledReason) {
    return { available: false, reason: openRouterHardDisabledReason };
  }

  if (openRouterCooldownUntil > Date.now()) {
    return {
      available: false,
      reason: "OpenRouter temporarily unavailable (cooldown active)",
    };
  }

  return { available: true };
}

function toUtcRangeStart(dateKey: string): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map((v) => Number.parseInt(v, 10));
  return new Date(
    Date.UTC(year || 1970, (month || 1) - 1, day || 1, 0, 0, 0, 0),
  );
}

function toUtcRangeEnd(dateKey: string): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map((v) => Number.parseInt(v, 10));
  return new Date(
    Date.UTC(year || 1970, (month || 1) - 1, day || 1, 23, 59, 59, 999),
  );
}

function getJobEndIso(
  job: Pick<
    ScheduleType,
    | "startDateTime"
    | "hours"
    | "actualServiceDurationMinutes"
    | "historicalServiceDurationMinutes"
  >,
): string {
  const start = new Date(job.startDateTime);
  if (Number.isNaN(start.getTime())) return String(job.startDateTime);
  const durationMinutes = getEffectiveServiceDurationMinutes({
    actualServiceDurationMinutes: job.actualServiceDurationMinutes,
    historicalServiceDurationMinutes: job.historicalServiceDurationMinutes,
    scheduleHours: job.hours,
    fallbackHours: 4,
  });
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return end.toISOString();
}

function getServiceTimelineStartMs(value: Date | string): number {
  const adjusted = getServiceDayTimelineDate(value);
  if (!adjusted) return Number.NaN;
  return adjusted.getTime();
}

function getJobServiceTimelineEndMs(
  job: Pick<
    ScheduleType,
    | "startDateTime"
    | "hours"
    | "actualServiceDurationMinutes"
    | "historicalServiceDurationMinutes"
  >,
): number {
  const startMs = getServiceTimelineStartMs(job.startDateTime);
  if (!Number.isFinite(startMs)) return Number.NaN;

  const durationMinutes = getEffectiveServiceDurationMinutes({
    actualServiceDurationMinutes: job.actualServiceDurationMinutes,
    historicalServiceDurationMinutes: job.historicalServiceDurationMinutes,
    scheduleHours: job.hours,
    fallbackHours: 4,
  });
  return startMs + durationMinutes * 60 * 1000;
}

function normalizeId(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString();
  }
  return String(value);
}

function stableFingerprint(input: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function maxDateKey(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function clampWindowToFuture(args: {
  dateFrom: string;
  dateTo: string;
  todayDateKey: string;
}): { dateFrom: string; dateTo: string } | null {
  const from =
    maxDateKey(args.dateFrom, args.todayDateKey) || args.todayDateKey;
  const to = args.dateTo;
  if (to < from) return null;
  return { dateFrom: from, dateTo: to };
}

function severityRank(severity: ScheduleInsightSeverity): number {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function clampConfidence(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return Math.min(1, Math.max(0, Number(value)));
}

async function getTechnicianDirectory(): Promise<TechnicianDirectoryEntry[]> {
  const techs = await getTechnicians();
  return techs.map(
    (tech: { id: string; name: string; depotAddress: string | null }) => ({
      id: tech.id,
      name: tech.name,
      depotAddress: tech.depotAddress ?? null,
    }),
  );
}

function extractJsonObject(input: string): any | null {
  const trimmed = input.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(sliced);
    } catch {
      return null;
    }
  }

  return null;
}

async function callOpenRouterJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<T | null> {
  const availability = getOpenRouterAvailability();
  if (!availability.available) {
    return null;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL || "openrouter/free";

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "VHD Schedule Insights",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        temperature: 0.2,
        max_tokens: params.maxTokens ?? 900,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      if (response.status === 402) {
        openRouterHardDisabledReason =
          "OpenRouter credits unavailable (402 insufficient credits)";
      } else if (response.status === 401) {
        openRouterHardDisabledReason =
          "OpenRouter authentication failed (401 invalid key/account)";
      } else if (response.status === 429) {
        openRouterCooldownUntil = Date.now() + OPENROUTER_COOLDOWN_MS;
      }
      return null;
    }

    // Successful call clears temporary cooldown.
    openRouterCooldownUntil = 0;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === "string") {
      const parsed = extractJsonObject(content);
      return parsed as T | null;
    }

    if (Array.isArray(content)) {
      const joined = content
        .map((item) => (typeof item?.text === "string" ? item.text : ""))
        .join("\n");
      const parsed = extractJsonObject(joined);
      return parsed as T | null;
    }

    return null;
  } catch (error) {
    void error;
    openRouterCooldownUntil = Date.now() + OPENROUTER_COOLDOWN_MS;
    return null;
  }
}

async function enhanceInsightDraftsWithAI(
  drafts: PersistInsightDraft[],
): Promise<PersistInsightDraft[]> {
  if (drafts.length === 0) return drafts;

  const result = await callOpenRouterJson<{
    items?: Array<{
      index: number;
      title?: string;
      message?: string;
      severity?: ScheduleInsightSeverity;
      confidence?: number;
    }>;
  }>({
    systemPrompt:
      "You are a scheduling operations analyst. Return strict JSON only. Keep messages concise and practical for dispatch managers.",
    userPrompt: JSON.stringify({
      task: "Refine wording and confidence for schedule insights.",
      rules: [
        "Do not invent facts.",
        "Do not change kind/date/ids.",
        "Keep each title under 70 chars.",
        "Keep each message under 180 chars.",
      ],
      items: drafts.map((draft, index) => ({
        index,
        kind: draft.kind,
        severity: draft.severity,
        title: draft.title,
        message: draft.message,
      })),
      responseShape: {
        items: [
          {
            index: 0,
            title: "string",
            message: "string",
            severity: "info|warning|critical",
            confidence: 0.75,
          },
        ],
      },
    }),
  });

  if (!result?.items || !Array.isArray(result.items)) return drafts;

  const next = [...drafts];

  for (const item of result.items) {
    const idx = Number(item.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= next.length) continue;

    const target = next[idx]!;
    const severity = item.severity;
    const safeSeverity: ScheduleInsightSeverity =
      severity === "critical" || severity === "warning" || severity === "info"
        ? severity
        : target.severity;

    next[idx] = {
      ...target,
      title:
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : target.title,
      message:
        typeof item.message === "string" && item.message.trim()
          ? item.message.trim()
          : target.message,
      severity: safeSeverity,
      confidence: clampConfidence(item.confidence) ?? target.confidence,
      source: "hybrid",
    };
  }

  return next;
}

async function persistOpenInsights(
  drafts: PersistInsightDraft[],
): Promise<ScheduleInsightType[]> {
  if (drafts.length === 0) return [];

  await connectMongo();

  const dedupedDrafts = new Map<
    string,
    {
      draft: PersistInsightDraft;
      fingerprint: string;
    }
  >();
  for (const draft of drafts) {
    const fingerprint = stableFingerprint(draft.fingerprintData);
    dedupedDrafts.set(fingerprint, { draft, fingerprint });
  }

  const outputByFingerprint = new Map<string, ScheduleInsightType>();

  for (const { draft, fingerprint } of dedupedDrafts.values()) {
    const doc = await ScheduleInsight.findOneAndUpdate(
      { fingerprint, status: "open" },
      {
        $set: {
          kind: draft.kind,
          severity: draft.severity,
          title: draft.title,
          message: draft.message,
          dateKey: draft.dateKey ?? null,
          technicianId: draft.technicianId ?? null,
          scheduleIds: draft.scheduleIds ?? [],
          jobsDueSoonIds: draft.jobsDueSoonIds ?? [],
          invoiceIds: draft.invoiceIds ?? [],
          suggestionPayload: draft.suggestionPayload,
          fingerprint,
          source: draft.source || "rule",
          confidence: clampConfidence(draft.confidence),
          status: "open",
          resolvedBy: null,
          resolvedAt: null,
          resolutionNote: null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean<ScheduleInsightType>();

    if (doc) {
      outputByFingerprint.set(fingerprint, {
        ...doc,
        _id: normalizeId(doc._id),
        scheduleIds: (doc.scheduleIds || []).map((v) => normalizeId(v)),
        jobsDueSoonIds: (doc.jobsDueSoonIds || []).map((v) => normalizeId(v)),
        invoiceIds: (doc.invoiceIds || []).map((v) => normalizeId(v)),
      });
    }
  }

  return [...outputByFingerprint.values()];
}

async function autoDismissDuplicateOpenInsights(
  fingerprints: string[],
): Promise<void> {
  const uniqueFingerprints = [...new Set(fingerprints.filter(Boolean))];
  if (uniqueFingerprints.length === 0) return;

  await connectMongo();

  const duplicates = await ScheduleInsight.aggregate<{
    _id: string;
    ids: any[];
    count: number;
  }>([
    {
      $match: {
        status: "open",
        fingerprint: { $in: uniqueFingerprints },
      },
    },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$fingerprint",
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  const duplicateIds = duplicates.flatMap((group) => group.ids.slice(1));
  if (duplicateIds.length === 0) return;

  await ScheduleInsight.updateMany(
    { _id: { $in: duplicateIds } },
    {
      $set: {
        status: "dismissed",
        resolvedAt: new Date(),
        resolutionNote: "Auto-deduped duplicate open insight",
      },
    },
  );
}

async function autoDismissMissingInsights(params: {
  dateFrom: string;
  dateTo: string;
  kinds: ScheduleInsightKind[];
  keepFingerprints: string[];
}): Promise<void> {
  const { dateFrom, dateTo, kinds, keepFingerprints } = params;
  if (kinds.length === 0) return;

  await connectMongo();

  const query: any = {
    status: "open",
    kind: { $in: kinds },
    dateKey: { $gte: dateFrom, $lte: dateTo },
  };

  if (keepFingerprints.length > 0) {
    query.fingerprint = { $nin: keepFingerprints };
  }

  await ScheduleInsight.updateMany(query, {
    $set: {
      status: "dismissed",
      resolvedAt: new Date(),
      resolutionNote: "Auto-cleared after re-analysis",
    },
  });
}

async function fetchSchedulesInRange(args: {
  dateFrom: string;
  dateTo: string;
  technicianIds?: string[];
}): Promise<ScheduleType[]> {
  await connectMongo();

  const query: any = {
    startDateTime: {
      $gte: toUtcRangeStart(args.dateFrom),
      $lte: toUtcRangeEnd(args.dateTo),
    },
  };

  if (args.technicianIds && args.technicianIds.length > 0) {
    query.assignedTechnicians = { $in: args.technicianIds };
  }

  const jobs = await Schedule.find(query).lean<ScheduleType[]>();
  return jobs.map((job) => ({
    ...job,
    _id: normalizeId(job._id),
    invoiceRef: normalizeId(job.invoiceRef),
    payrollPeriod: normalizeId(job.payrollPeriod),
    assignedTechnicians: (job.assignedTechnicians || []).map((id) =>
      normalizeId(id),
    ),
  }));
}

async function fetchUnscheduledDueSoonInRange(args: {
  dateFrom: string;
  dateTo: string;
  maxJobs?: number;
}): Promise<UnscheduledDueSoonItem[]> {
  await connectMongo();

  const rows = await JobsDueSoon.aggregate<DueSoonAggregateRow>([
    {
      $match: {
        isScheduled: false,
        dateDue: {
          $gte: toUtcRangeStart(args.dateFrom),
          $lte: toUtcRangeEnd(args.dateTo),
        },
      },
    },
    { $sort: { dateDue: 1 } },
    ...(args.maxJobs && args.maxJobs > 0 ? [{ $limit: args.maxJobs }] : []),
    {
      $lookup: {
        from: "invoices",
        let: { invoiceId: "$invoiceId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: "$_id" }, "$$invoiceId"],
              },
            },
          },
          {
            $project: {
              _id: 1,
              location: 1,
              jobTitle: 1,
            },
          },
        ],
        as: "invoice",
      },
    },
    {
      $addFields: {
        invoice: { $arrayElemAt: ["$invoice", 0] },
      },
    },
  ]);

  const suggestions: UnscheduledDueSoonItem[] = rows.map((row) => {
    const invoiceRef = row.invoice?._id
      ? normalizeId(row.invoice._id)
      : undefined;

    return {
      jobsDueSoonId: normalizeId(row._id),
      invoiceRef,
      invoiceId: row.invoiceId,
      jobTitle: row.jobTitle || row.invoice?.jobTitle || "Due Soon Job",
      location: row.invoice?.location || "",
      dateDue: getScheduleDisplayDateKey(row.dateDue),
    };
  });

  return suggestions;
}

type OvernightTurnaroundCandidate = {
  candidateKey: string;
  techId: string;
  current: ScheduleType;
  next: ScheduleType;
  currentEndMs: number;
  nextStartMs: number;
  nextDate: string;
};

function buildOvernightTurnaroundCandidates(
  schedules: ScheduleType[],
): OvernightTurnaroundCandidate[] {
  const byTech = new Map<string, ScheduleType[]>();

  for (const job of schedules) {
    const uniqueTechIds = new Set(
      (job.assignedTechnicians || []).map((id) => normalizeId(id)),
    );
    for (const techId of uniqueTechIds) {
      if (!techId) continue;
      const current = byTech.get(techId) || [];
      current.push(job);
      byTech.set(techId, current);
    }
  }

  const candidates: OvernightTurnaroundCandidate[] = [];
  const seenCandidateKeys = new Set<string>();

  for (const [techId, jobs] of byTech.entries()) {
    const sorted = [...jobs].sort((a, b) => {
      const aTime = getServiceTimelineStartMs(a.startDateTime);
      const bTime = getServiceTimelineStartMs(b.startDateTime);

      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return aTime - bTime;
      }
      if (Number.isFinite(aTime) && !Number.isFinite(bTime)) return -1;
      if (!Number.isFinite(aTime) && Number.isFinite(bTime)) return 1;

      const aRawTime = new Date(a.startDateTime).getTime();
      const bRawTime = new Date(b.startDateTime).getTime();
      if (Number.isFinite(aRawTime) && Number.isFinite(bRawTime)) {
        return aRawTime - bRawTime;
      }
      return 0;
    });

    for (let idx = 0; idx < sorted.length - 1; idx += 1) {
      const current = sorted[idx]!;
      const next = sorted[idx + 1]!;

      const currentEndMs = getJobServiceTimelineEndMs(current);
      const nextStartMs = getServiceTimelineStartMs(next.startDateTime);
      if (!Number.isFinite(currentEndMs) || !Number.isFinite(nextStartMs))
        continue;

      // Only flag rest gaps that span overnight (different calendar days).
      // Same-day gaps are normal daytime breaks, not rest concerns.
      const currentEndDate = getScheduleDisplayDateKey(new Date(currentEndMs));
      const nextStartDate = getScheduleDisplayDateKey(new Date(nextStartMs));
      if (currentEndDate === nextStartDate) continue;

      const nextDate = getScheduleDisplayDateKey(new Date(nextStartMs));
      const currentId = normalizeId(current._id);
      const nextId = normalizeId(next._id);
      if (!nextDate || !currentId || !nextId) continue;
      const candidateKey = `${techId}::${currentId}::${nextId}`;
      if (seenCandidateKeys.has(candidateKey)) continue;
      seenCandidateKeys.add(candidateKey);

      candidates.push({
        candidateKey,
        techId,
        current,
        next,
        currentEndMs,
        nextStartMs,
        nextDate,
      });
    }
  }

  return candidates;
}

async function getOvernightReturnToDepotMinutes(params: {
  candidates: OvernightTurnaroundCandidate[];
  technicianDirectory: TechnicianDirectoryEntry[];
}): Promise<Map<string, number>> {
  const byTechDepot = new Map(
    params.technicianDirectory.map((tech) => [tech.id, tech.depotAddress]),
  );

  const requestByKey = new Map<
    string,
    { candidateKey: string; currentId: string }
  >();
  const requests: {
    date: string;
    jobs: ScheduleType[];
    depotAddress: string | null;
  }[] = [];

  for (const candidate of params.candidates) {
    const depotAddress = byTechDepot.get(candidate.techId) || null;
    const currentId = normalizeId(candidate.current._id);
    if (!depotAddress || !currentId) {
      continue;
    }

    const requestKey = `overnight_return::${candidate.candidateKey}`;
    requestByKey.set(requestKey, {
      candidateKey: candidate.candidateKey,
      currentId,
    });
    requests.push({
      date: requestKey,
      jobs: [candidate.current],
      depotAddress,
    });
  }

  if (requests.length === 0) return new Map();

  const summaries = await getBatchTravelTimeSummaries(requests);
  const minutesByCandidate = new Map<string, number>();

  for (const summary of summaries) {
    const key = String(summary.date || "");
    const requestMeta = requestByKey.get(key);
    if (!requestMeta) continue;

    const returnSegment = (summary.segments || []).find((segment) => {
      return (
        segment.fromJobId === requestMeta.currentId &&
        segment.fromKind === "job" &&
        segment.toKind === "depot"
      );
    });

    minutesByCandidate.set(
      requestMeta.candidateKey,
      Math.max(0, Math.round(returnSegment?.typicalMinutes || 0)),
    );
  }

  return minutesByCandidate;
}

async function buildRestGapDrafts(args: {
  schedules: ScheduleType[];
  technicianDirectory: TechnicianDirectoryEntry[];
}): Promise<PersistInsightDraft[]> {
  const candidates = buildOvernightTurnaroundCandidates(args.schedules);
  if (candidates.length === 0) return [];

  const returnToDepotByCandidate = await getOvernightReturnToDepotMinutes({
    candidates,
    technicianDirectory: args.technicianDirectory,
  });

  const drafts: PersistInsightDraft[] = [];

  for (const candidate of candidates) {
    const returnToDepotMinutes =
      returnToDepotByCandidate.get(candidate.candidateKey) || 0;
    const adjustedCurrentEndMs =
      candidate.currentEndMs + returnToDepotMinutes * 60 * 1000;
    const gapHours =
      (candidate.nextStartMs - adjustedCurrentEndMs) / (1000 * 60 * 60);

    if (gapHours >= REST_GAP_CRITICAL_MAX_HOURS || gapHours < 0) continue;

    const gapHoursRounded = Math.round(gapHours * 10) / 10;
    const currentLabel = candidate.current.jobTitle?.trim() || "previous job";
    const nextLabel = candidate.next.jobTitle?.trim() || "next job";
    const currentEndTime = formatTimeUTC(getJobEndIso(candidate.current));
    const nextStartTime = formatTimeUTC(candidate.next.startDateTime);
    const driveSuffix =
      returnToDepotMinutes > 0
        ? ` Includes ~${returnToDepotMinutes}m return-to-depot drive time.`
        : "";

    drafts.push({
      kind: SCHEDULE_INSIGHT_KINDS.REST_GAP_WARNING,
      severity: "critical",
      title: "Overnight Turnaround Risk",
      message: `Only ${gapHoursRounded}h rest between ${currentLabel} (ends ${currentEndTime}) and ${nextLabel} (starts ${nextStartTime}).${driveSuffix}`,
      dateKey: candidate.nextDate,
      technicianId: candidate.techId,
      scheduleIds: [
        normalizeId(candidate.current._id),
        normalizeId(candidate.next._id),
      ],
      source: "rule",
      confidence: 0.9,
      fingerprintData: {
        kind: SCHEDULE_INSIGHT_KINDS.REST_GAP_WARNING,
        technicianId: candidate.techId,
        currentId: normalizeId(candidate.current._id),
        nextId: normalizeId(candidate.next._id),
        dateKey: candidate.nextDate,
        returnToDepotMinutes,
      },
    });
  }

  return drafts;
}

function buildDueSoonUnscheduledDrafts(
  items: UnscheduledDueSoonItem[],
): PersistInsightDraft[] {
  const drafts: PersistInsightDraft[] = [];

  for (const item of items) {
    const dueDate = toUtcRangeStart(item.dateDue);
    const daysToDue = Math.round(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysToDue > DUE_SOON_ALERT_MAX_DAYS) continue;
    const severity: ScheduleInsightSeverity =
      daysToDue <= 1 ? "critical" : "warning";

    drafts.push({
      kind: SCHEDULE_INSIGHT_KINDS.DUE_SOON_UNSCHEDULED,
      severity,
      title: "Due Soon Job Not Scheduled",
      message: `${item.jobTitle} due ${formatDateStringUTC(item.dateDue)} and is still unscheduled.`,
      dateKey: item.dateDue,
      jobsDueSoonIds: [item.jobsDueSoonId],
      invoiceIds: item.invoiceRef ? [item.invoiceRef] : [],
      source: "rule",
      confidence: 0.95,
      fingerprintData: {
        kind: SCHEDULE_INSIGHT_KINDS.DUE_SOON_UNSCHEDULED,
        jobsDueSoonId: item.jobsDueSoonId,
        dueDate: item.dateDue,
      },
    });
  }

  return drafts;
}

async function writeRunLog(args: {
  trigger: ScheduleInsightTrigger;
  dateFrom: string;
  dateTo: string;
  technicianIds?: string[];
  generatedCount: number;
  durationMs: number;
  createdBy?: string;
}): Promise<void> {
  await connectMongo();

  await ScheduleInsightRun.create({
    trigger: args.trigger,
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    technicianIds: args.technicianIds || [],
    generatedCount: args.generatedCount,
    model: process.env.OPENROUTER_MODEL || "openrouter/free",
    durationMs: args.durationMs,
    createdBy: args.createdBy,
  });
}

async function runScheduleWindowAnalysis(
  args: AnalyzeScheduleWindowArgs,
): Promise<{
  insights: ScheduleInsightType[];
  generatedCount: number;
  aiUsed: boolean;
  aiSkipReason?: string;
}> {
  const startedAt = Date.now();
  const todayDateKey = getBusinessDateKey(new Date());
  const effectiveWindow = clampWindowToFuture({
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    todayDateKey,
  });

  if (!args.skipAuth) {
    await requireAdmin();
  }

  const schedules = effectiveWindow
    ? await fetchSchedulesInRange({
        dateFrom: effectiveWindow.dateFrom,
        dateTo: effectiveWindow.dateTo,
        technicianIds: args.technicianIds,
      })
    : [];

  const technicians =
    schedules.length > 0 ? await getTechnicianDirectory() : [];

  const unscheduledDueSoon = await fetchUnscheduledDueSoonInRange({
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    maxJobs: 25,
  });

  let drafts: PersistInsightDraft[] = [];
  if (schedules.length > 0) {
    drafts = drafts.concat(
      await buildRestGapDrafts({
        schedules,
        technicianDirectory: technicians,
      }),
    );
  }
  drafts = drafts.concat(buildDueSoonUnscheduledDrafts(unscheduledDueSoon));
  drafts = drafts.filter((draft) => {
    if (!draft.dateKey) return false;
    if (draft.kind === SCHEDULE_INSIGHT_KINDS.DUE_SOON_UNSCHEDULED) return true;
    return draft.dateKey >= todayDateKey;
  });

  const requestedAI = Boolean(args.includeAI);
  const aiAvailability = requestedAI ? getOpenRouterAvailability() : null;
  let aiUsed = requestedAI && Boolean(aiAvailability?.available);
  let aiSkipReason =
    requestedAI && !aiUsed ? aiAvailability?.reason : undefined;

  if (aiUsed) {
    drafts = await enhanceInsightDraftsWithAI(drafts);
    const postRunAvailability = getOpenRouterAvailability();
    if (!postRunAvailability.available) {
      aiUsed = false;
      aiSkipReason = postRunAvailability.reason;
    }
  }

  const insights = await persistOpenInsights(drafts);
  const fingerprints = [
    ...new Set(drafts.map((draft) => stableFingerprint(draft.fingerprintData))),
  ];

  await autoDismissDuplicateOpenInsights(fingerprints);

  await autoDismissMissingInsights({
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    kinds: ANALYSIS_KINDS,
    keepFingerprints: fingerprints,
  });

  const { userId } = await auth();
  await writeRunLog({
    trigger: args.trigger || "manual_range",
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    technicianIds: args.technicianIds,
    generatedCount: insights.length,
    durationMs: Date.now() - startedAt,
    createdBy: userId || undefined,
  });

  return {
    insights,
    generatedCount: insights.length,
    aiUsed,
    aiSkipReason,
  };
}

export async function listScheduleInsights(
  args: ListScheduleInsightsArgs = {},
) {
  await requireAdmin();
  await connectMongo();

  const match: any = {};
  const todayDateKey = getBusinessDateKey(new Date());
  const futureOnly = args.futureOnly ?? true;

  if (args.status && args.status !== "all") {
    match.status = args.status;
  }

  if (args.dateFrom || args.dateTo) {
    match.dateKey = {};
    if (args.dateFrom) match.dateKey.$gte = args.dateFrom;
    if (args.dateTo) match.dateKey.$lte = args.dateTo;
  }

  if (args.technicianId) {
    match.technicianId = args.technicianId;
  }

  const selectedKinds =
    args.kinds && args.kinds.length > 0 ? args.kinds : ACTIVE_INSIGHT_KINDS;
  match.kind = { $in: selectedKinds };

  const docs = await ScheduleInsight.find(match)
    .sort({ createdAt: -1 })
    .limit(args.limit || 100)
    .lean<ScheduleInsightType[]>();

  const normalizedDocs = docs.map((doc) => ({
    ...doc,
    _id: normalizeId(doc._id),
    scheduleIds: (doc.scheduleIds || []).map((value) => normalizeId(value)),
    jobsDueSoonIds: (doc.jobsDueSoonIds || []).map((value) =>
      normalizeId(value),
    ),
    invoiceIds: (doc.invoiceIds || []).map((value) => normalizeId(value)),
  }));

  const dedupedOpenDocs: ScheduleInsightType[] = [];
  const seenOpenFingerprints = new Set<string>();

  for (const doc of normalizedDocs) {
    if (doc.status !== "open") {
      dedupedOpenDocs.push(doc);
      continue;
    }

    const fingerprint = String(doc.fingerprint || "");
    if (fingerprint && seenOpenFingerprints.has(fingerprint)) {
      continue;
    }
    if (fingerprint) {
      seenOpenFingerprints.add(fingerprint);
    }
    dedupedOpenDocs.push(doc);
  }

  return dedupedOpenDocs
    .filter((doc) => {
      if (!futureOnly) return true;
      if (doc.kind === SCHEDULE_INSIGHT_KINDS.DUE_SOON_UNSCHEDULED) return true;
      return Boolean(doc.dateKey) && String(doc.dateKey) >= todayDateKey;
    })
    .sort((a, b) => {
      const bySeverity = severityRank(b.severity) - severityRank(a.severity);
      if (bySeverity !== 0) return bySeverity;
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });
}

export async function analyzeScheduleWindow(args: AnalyzeScheduleWindowArgs) {
  return runScheduleWindowAnalysis({
    ...args,
    trigger: args.trigger || "manual_range",
    includeAI: args.includeAI ?? false,
  });
}

export async function runAutoScheduleInsightAnalysis(args: {
  dateKeys: string[];
  technicianIds?: string[];
}) {
  if (!args.dateKeys || args.dateKeys.length === 0)
    return { generatedCount: 0 };

  const sortedDateKeys = [...new Set(args.dateKeys)].sort();
  const dateFrom = sortedDateKeys[0]!;
  const dateTo = sortedDateKeys[sortedDateKeys.length - 1]!;

  return runScheduleWindowAnalysis({
    dateFrom,
    dateTo,
    technicianIds: args.technicianIds,
    trigger: "auto",
    includeAI: false,
    skipAuth: true,
  });
}

export async function resolveScheduleInsight(args: {
  insightId: string;
  note?: string;
}) {
  const { userId } = await requireAdmin();
  await connectMongo();

  const updated = await ScheduleInsight.findByIdAndUpdate(
    args.insightId,
    {
      $set: {
        status: "resolved",
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote: args.note || "Resolved by manager",
      },
    },
    { new: true },
  ).lean<ScheduleInsightType | null>();

  if (!updated) {
    throw new Error("Insight not found");
  }

  return {
    ...updated,
    _id: normalizeId(updated._id),
  };
}

export async function dismissScheduleInsight(args: {
  insightId: string;
  note?: string;
}) {
  const { userId } = await requireAdmin();
  await connectMongo();

  const updated = await ScheduleInsight.findByIdAndUpdate(
    args.insightId,
    {
      $set: {
        status: "dismissed",
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote: args.note || "Dismissed by manager",
      },
    },
    { new: true },
  ).lean<ScheduleInsightType | null>();

  if (!updated) {
    throw new Error("Insight not found");
  }

  return {
    ...updated,
    _id: normalizeId(updated._id),
  };
}

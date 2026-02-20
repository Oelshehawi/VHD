// @ts-ignore
import mongoose from "mongoose";
import {
  ScheduleInsightType,
  ScheduleInsightRunType,
} from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

const InsightKinds = [
  "travel_overload_day",
  "rest_gap_warning",
  "service_day_boundary_risk",
  "route_efficiency_opportunity",
  "move_job_recommendation",
  "due_soon_unscheduled",
  "due_soon_at_risk",
  "due_soon_best_slot_candidates",
] as const;

const InsightSeverities = ["info", "warning", "critical"] as const;
const InsightStatuses = ["open", "resolved", "dismissed"] as const;
const InsightSources = ["rule", "ai", "hybrid"] as const;

const ScheduleInsightSchema = new Schema<ScheduleInsightType>(
  {
    kind: {
      type: String,
      enum: InsightKinds,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: InsightSeverities,
      required: true,
      default: "warning",
    },
    status: {
      type: String,
      enum: InsightStatuses,
      required: true,
      default: "open",
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    dateKey: { type: String, index: true, default: null },
    technicianId: { type: String, index: true, default: null },
    scheduleIds: { type: [String], default: [] },
    jobsDueSoonIds: { type: [String], default: [] },
    invoiceIds: { type: [String], default: [] },
    suggestionPayload: { type: Schema.Types.Mixed },
    fingerprint: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: InsightSources,
      required: true,
      default: "rule",
    },
    confidence: { type: Number, min: 0, max: 1 },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    resolutionNote: { type: String },
  },
  { timestamps: true },
);

ScheduleInsightSchema.index({ status: 1, dateKey: 1 });
ScheduleInsightSchema.index({ technicianId: 1, dateKey: 1 });
ScheduleInsightSchema.index({ jobsDueSoonIds: 1 });
ScheduleInsightSchema.index({ fingerprint: 1, status: 1 });

const InsightRunTriggers = ["auto", "manual_day", "manual_range"] as const;

const ScheduleInsightRunSchema = new Schema<ScheduleInsightRunType>(
  {
    trigger: { type: String, enum: InsightRunTriggers, required: true },
    dateFrom: { type: String, required: true },
    dateTo: { type: String, required: true },
    technicianIds: { type: [String], default: [] },
    generatedCount: { type: Number, default: 0 },
    model: { type: String },
    durationMs: { type: Number },
    createdBy: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ScheduleInsightRunSchema.index({ createdAt: -1 });
ScheduleInsightRunSchema.index({ trigger: 1, createdAt: -1 });

export const ScheduleInsight =
  (models.ScheduleInsight as typeof Model<ScheduleInsightType>) ||
  model("ScheduleInsight", ScheduleInsightSchema);

export const ScheduleInsightRun =
  (models.ScheduleInsightRun as typeof Model<ScheduleInsightRunType>) ||
  model("ScheduleInsightRun", ScheduleInsightRunSchema);

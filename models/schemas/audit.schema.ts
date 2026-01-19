// @ts-ignore
import mongoose from "mongoose";
import { AuditLogEntry } from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

// Separate AuditLog collection
export const AuditLogSchema = new Schema<AuditLogEntry>({
  invoiceId: { type: String, required: true, index: true },
  action: {
    type: String,
    enum: [
      "reminder_configured",
      "reminder_sent_auto",
      "reminder_sent_manual",
      "reminder_failed",
      "payment_status_changed",
      "payment_info_updated",
      "invoice_created",
      "invoice_emailed",
      "schedule_created",
      "call_logged_job",
      "call_logged_payment",
      "availability_created",
      "availability_updated",
      "availability_deleted",
      "timeoff_requested",
      "timeoff_approved",
      "timeoff_rejected",
      "timeoff_deleted",
      "timeoff_updated",
      "schedule_confirmed",
      "schedule_unconfirmed",
      "schedule_dead_run_marked",
      "schedule_dead_run_cleared",
      "schedule_updated",
      "stripe_payment_settings_configured",
      "stripe_payment_link_generated",
      "stripe_payment_link_revoked",
      "stripe_payment_initiated",
      "stripe_payment_succeeded",
      "stripe_payment_failed",
    ],
    required: true,
  },
  timestamp: { type: Date, default: Date.now, required: true, index: true },
  performedBy: { type: String, required: true },
  details: {
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
});

// Indexes for efficient querying
AuditLogSchema.index({ invoiceId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog =
  (models.AuditLog as typeof Model<AuditLogEntry>) ||
  model("AuditLog", AuditLogSchema);

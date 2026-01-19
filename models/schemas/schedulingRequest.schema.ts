// @ts-ignore
import mongoose from "mongoose";
import { SchedulingRequestType } from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

// Preferred contact enum
const PreferredContactEnum = ["phone", "email", "either", "other"] as const;

// Status enum
const StatusEnum = [
  "pending",
  "confirmed",
  "alternatives_sent",
  "expired",
  "cancelled",
] as const;

// Sub-schema for requested time (exact hour and minute)
const RequestedTimeSchema = new Schema(
  {
    hour: { type: Number, required: true, min: 0, max: 23 },
    minute: { type: Number, required: true, min: 0, max: 59 },
  },
  { _id: false },
);

// Sub-schema for time selection (date + exact time)
const TimeSelectionSchema = new Schema(
  {
    date: { type: Date, required: true },
    requestedTime: { type: RequestedTimeSchema, required: true },
  },
  { _id: false },
);

// Sub-schema for suggested usual tracking
const SuggestedUsualSchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 6 = Saturday
    wasSelected: { type: Boolean },
  },
  { _id: false },
);

export const schedulingRequestSchema = new Schema<SchedulingRequestType>(
  {
    // References
    clientId: {
      type: ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    invoiceId: {
      type: ObjectId,
      ref: "Invoice",
      required: true,
    },
    jobsDueSoonId: {
      type: ObjectId,
      ref: "JobsDueSoon",
      required: true,
      index: true,
    },

    // Client selections
    primarySelection: {
      type: TimeSelectionSchema,
      required: true,
    },
    backupSelection: {
      type: TimeSelectionSchema,
      required: true,
    },

    // Confirmation details from client
    addressConfirmed: { type: Boolean, required: true },
    parkingNotes: { type: String, default: "" },
    accessNotes: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },
    preferredContact: {
      type: String,
      enum: PreferredContactEnum,
      required: true,
    },
    customContactMethod: { type: String },
    onSiteContactName: { type: String },
    onSiteContactPhone: { type: String },

    // "Your usual" tracking for analytics
    suggestedUsual: {
      type: SuggestedUsualSchema,
      required: false,
    },

    // Request lifecycle
    status: {
      type: String,
      enum: StatusEnum,
      default: "pending",
      index: true,
    },
    requestedAt: { type: Date, default: Date.now, index: true },

    // Manager review
    reviewedAt: { type: Date },
    reviewedBy: { type: String }, // Clerk userId
    reviewNotes: { type: String },

    // Confirmation (after manager approves)
    confirmedScheduleId: {
      type: ObjectId,
      ref: "Schedule",
    },
    confirmedDate: { type: Date },
    confirmedTime: { type: RequestedTimeSchema }, // Exact confirmed time

    // Alternatives offered (if primary/backup don't work)
    alternativesOffered: {
      type: [TimeSelectionSchema],
      default: [],
    },

    // Notification tracking
    confirmationEmailSent: { type: Boolean, default: false },
    confirmationEmailSentAt: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Indexes for common queries
schedulingRequestSchema.index({ status: 1, requestedAt: -1 }); // Pending requests sorted by date
schedulingRequestSchema.index({ clientId: 1, status: 1 }); // Client's requests by status

// Clear cached model in development to pick up schema changes
if (process.env.NODE_ENV === "development" && models.SchedulingRequest) {
  delete models.SchedulingRequest;
}

export const SchedulingRequest =
  (models.SchedulingRequest as typeof Model<SchedulingRequestType>) ||
  model("SchedulingRequest", schedulingRequestSchema);

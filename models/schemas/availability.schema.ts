// @ts-ignore
import mongoose from "mongoose";
import {
  AvailabilityType,
  TimeOffRequestType,
} from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

export const AvailabilitySchema = new Schema<AvailabilityType>({
  technicianId: { type: String, required: true },
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0-6 for recurring patterns
  startTime: { type: String, required: true }, // HH:mm format
  endTime: { type: String, required: true }, // HH:mm format
  isFullDay: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  specificDate: { type: Date }, // For one-time blocks
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Availability indexes
AvailabilitySchema.index({ technicianId: 1 });
AvailabilitySchema.index({ technicianId: 1, dayOfWeek: 1 });
AvailabilitySchema.index({ technicianId: 1, specificDate: 1 });

export const Availability =
  (models.Availability as typeof Model<AvailabilityType>) ||
  model("Availability", AvailabilitySchema);

export const TimeOffRequestSchema = new Schema<TimeOffRequestType>({
  technicianId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now, required: true },
  reviewedAt: { type: Date },
  reviewedBy: { type: String }, // Admin Clerk ID
  notes: { type: String },
});

// TimeOffRequest indexes
TimeOffRequestSchema.index({ technicianId: 1, status: 1 });
TimeOffRequestSchema.index({ technicianId: 1, startDate: 1, endDate: 1 });
TimeOffRequestSchema.index({ status: 1, requestedAt: -1 });

export const TimeOffRequest =
  (models.TimeOffRequest as typeof Model<TimeOffRequestType>) ||
  model("TimeOffRequest", TimeOffRequestSchema);

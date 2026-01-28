import mongoose from "mongoose";
import { ExpoPushTokenType } from "../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

// Expo Push Token Schema - stores mobile app push tokens per user
const ExpoPushTokenSchema = new Schema<ExpoPushTokenType>(
  {
    userId: { type: String, required: true, index: true }, // Clerk user ID
    token: { type: String, required: true }, // ExponentPushToken[xxx]
    platform: { type: String, enum: ["ios", "android"], required: true },
    deviceName: { type: String, required: true },
    notifyNewJobs: { type: Boolean, default: true },
    notifyScheduleChanges: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique index on token - each token is globally unique
ExpoPushTokenSchema.index({ token: 1 }, { unique: true });

// Indexes for querying user's tokens with preference filters
ExpoPushTokenSchema.index({ userId: 1, notifyNewJobs: 1 });
ExpoPushTokenSchema.index({ userId: 1, notifyScheduleChanges: 1 });

export const ExpoPushToken =
  (models.ExpoPushToken as typeof Model<ExpoPushTokenType>) ||
  model("ExpoPushToken", ExpoPushTokenSchema);

import mongoose from "mongoose";
import {
  PushSubscriptionType,
  NotificationType,
  NOTIFICATION_TYPES,
} from "../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

// Push Subscription Schema - stores web push subscriptions per user
const PushSubscriptionSchema = new Schema<PushSubscriptionType>(
  {
    userId: { type: String, required: true, index: true }, // Clerk user ID
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate subscriptions for same endpoint per user
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

// Notification Schema - stores in-app notifications
const NotificationSchema = new Schema<NotificationType>(
  {
    userId: { type: String, required: true, index: true }, // Clerk user ID
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    readAt: { type: Date, default: null },
    metadata: {
      invoiceId: { type: String },
      scheduleId: { type: String },
      clientId: { type: String },
      estimateId: { type: String },
      link: { type: String }, // Optional direct link to navigate to
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
NotificationSchema.index({ userId: 1, readAt: 1 }); // Unread notifications
NotificationSchema.index({ userId: 1, createdAt: -1 }); // Latest notifications first

const PushSubscription =
  (models.PushSubscription as typeof Model<PushSubscriptionType>) ||
  model("PushSubscription", PushSubscriptionSchema);

const Notification =
  (models.Notification as typeof Model<NotificationType>) ||
  model("Notification", NotificationSchema);

export { PushSubscription, Notification };

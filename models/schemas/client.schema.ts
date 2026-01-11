// @ts-ignore
import mongoose from "mongoose";
import { ClientType } from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

export const ClientSchema = new Schema<ClientType>({
  clientName: { type: String },
  email: { type: String }, // Keep for backward compatibility
  emails: {
    primary: { type: String },
    scheduling: { type: String },
    accounting: { type: String },
  },
  phoneNumber: { type: String },
  prefix: { type: String },
  notes: { type: String },
  isArchived: { type: Boolean, default: false, index: true },
  archiveReason: { type: String },
  archivedAt: { type: Date },
});

// Index for client searches
ClientSchema.index({ clientName: 1 });

export const Client =
  (models.Client as typeof Model<ClientType>) || model("Client", ClientSchema);

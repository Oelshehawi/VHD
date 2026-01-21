import mongoose from "mongoose";

const { Schema, model, models, Model } = mongoose;

export interface IAppVersion {
  platform: "ios" | "android";
  latest_version: string;
  min_required_version: string;
  release_notes?: string;
  updated_at: Date;
}

export const AppVersionSchema = new Schema<IAppVersion>({
  platform: {
    type: String,
    enum: ["ios", "android"],
    required: true,
    unique: true,
  },
  latest_version: { type: String, required: true },
  min_required_version: { type: String, required: true },
  release_notes: { type: String },
  updated_at: { type: Date, default: Date.now },
});

export const AppVersion =
  (models.AppVersion as typeof Model<IAppVersion>) ||
  model<IAppVersion>("AppVersion", AppVersionSchema, "app_versions");

// @ts-ignore
import mongoose from "mongoose";
import { TravelTimeCacheType } from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

export const TravelTimeCacheSchema = new Schema<TravelTimeCacheType>({
  originAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  pairHash: { type: String, required: true, unique: true },
  typicalMinutes: { type: Number, required: true },
  estimatedKm: { type: Number, required: true },
  travelNotes: { type: String },
  routePolyline: { type: String },
  expiresAt: { type: Date, required: true },
});

// TTL index for automatic cleanup
TravelTimeCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TravelTimeCache =
  (models.TravelTimeCache as typeof Model<TravelTimeCacheType>) ||
  model("TravelTimeCache", TravelTimeCacheSchema);

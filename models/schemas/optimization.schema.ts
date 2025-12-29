// @ts-ignore
import mongoose from "mongoose";
import {
  LocationGeocodeType,
  DistanceMatrixCacheType,
  TechnicianLocationType,
} from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

export const LocationGeocodeSchema = new Schema<LocationGeocodeType>({
  address: { type: String, required: true },
  normalizedAddress: { type: String, required: true },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function (v: number[]) {
        return v.length === 2;
      },
      message: "Coordinates must be [lng, lat] pair",
    },
  },
  lastGeocoded: { type: Date, required: true, default: Date.now },
  source: {
    type: String,
    enum: ["openroute", "manual"],
    required: true,
    default: "openroute",
  },
});

// LocationGeocode indexes
LocationGeocodeSchema.index({ address: 1 });
LocationGeocodeSchema.index({ normalizedAddress: 1 });

export const LocationGeocode =
  (models.LocationGeocode as typeof Model<LocationGeocodeType>) ||
  model("LocationGeocode", LocationGeocodeSchema);

// Simple distance matrix cache for OR Tools VRP
export const DistanceMatrixCacheSchema = new Schema<DistanceMatrixCacheType>({
  locationHash: { type: String, required: true, unique: true },
  locations: [{ type: String, required: true }],
  coordinates: [
    {
      type: [Number],
      required: true,
      validate: {
        validator: function (v: number[]) {
          return v.length === 2;
        },
        message: "Each coordinate must be [lng, lat] pair",
      },
    },
  ],
  matrix: {
    durations: {
      type: [[Number]],
      required: true,
    },
    distances: {
      type: [[Number]],
      required: true,
    },
  },
  calculatedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// DistanceMatrixCache index (TTL cleanup)
DistanceMatrixCacheSchema.index({ expiresAt: 1 });

export const DistanceMatrixCache =
  (models.DistanceMatrixCache as typeof Model<DistanceMatrixCacheType>) ||
  model("DistanceMatrixCache", DistanceMatrixCacheSchema);

export const TechnicianLocationSchema = new Schema<TechnicianLocationType>({
  technicianId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, required: true, default: true },
  currentJobId: { type: String },
  accuracy: { type: Number },
});

// TechnicianLocation indexes
TechnicianLocationSchema.index({ technicianId: 1, timestamp: -1 });
TechnicianLocationSchema.index({ isActive: 1, timestamp: -1 });

export const TechnicianLocation =
  (models.TechnicianLocation as typeof Model<TechnicianLocationType>) ||
  model("TechnicianLocation", TechnicianLocationSchema);

// @ts-ignore
import mongoose from "mongoose";
import { PhotoRecordType } from "../../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;

const PhotoSchema = new Schema<PhotoRecordType>(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    cloudinaryUrl: { type: String, required: true },
    type: {
      type: String,
      enum: ["before", "after", "estimate", "signature"],
      required: true,
    },
    technicianId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    signerName: { type: String, default: null },
  },
  { timestamps: false },
);

PhotoSchema.index({ scheduleId: 1 });

export const Photo =
  (models.Photo as typeof Model<PhotoRecordType>) ||
  model("Photo", PhotoSchema);

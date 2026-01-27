"use server";

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Photo, Schedule } from "../../../models/reactDataSchema";
import { PhotoRecordType } from "../typeDefinitions";

export type PhotoActionType = "before" | "after" | "estimate" | "signature";

export interface PhotoApiRecord {
  id: string;
  scheduleId: string;
  cloudinaryUrl: string;
  type: PhotoActionType;
  technicianId: string;
  timestamp: string;
  signerName?: string | null;
}

export interface NewPhotoInput {
  scheduleId: string;
  cloudinaryUrl: string;
  type: PhotoActionType;
  technicianId: string;
  timestamp?: string;
  signerName?: string | null;
}

const validPhotoTypes: PhotoActionType[] = [
  "before",
  "after",
  "estimate",
  "signature",
];

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const extractPublicId = (cloudinaryUrl: string): string | null => {
  const matches = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
  return matches?.[1] ?? null;
};

const mapToApiRecord = (photo: PhotoRecordType): PhotoApiRecord => ({
  id: photo._id.toString(),
  scheduleId: photo.scheduleId.toString(),
  cloudinaryUrl: photo.cloudinaryUrl,
  type: photo.type,
  technicianId: photo.technicianId,
  timestamp: new Date(photo.timestamp).toISOString(),
  signerName: photo.signerName ?? null,
});

export async function getSchedulePhotos(
  scheduleId: string,
  type?: PhotoActionType,
): Promise<PhotoApiRecord[]> {
  if (!isValidObjectId(scheduleId)) {
    throw new Error("Invalid scheduleId format");
  }

  await connectMongo();

  const query: Record<string, unknown> = {
    scheduleId: toObjectId(scheduleId),
  };

  if (type) {
    if (!validPhotoTypes.includes(type)) {
      throw new Error("Invalid photo type");
    }
    query.type = type;
  }

  const photos = await Photo.find(query)
    .sort({ timestamp: -1 })
    .lean<PhotoRecordType[]>();

  return photos.map(mapToApiRecord);
}

export async function savePhotos(inputs: NewPhotoInput[]): Promise<{
  inserted: number;
}> {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error("No photos to save");
  }

  const scheduleIds = Array.from(
    new Set(inputs.map((photo) => photo.scheduleId)),
  );

  for (const scheduleId of scheduleIds) {
    if (!isValidObjectId(scheduleId)) {
      throw new Error("Invalid scheduleId format");
    }
  }

  for (const input of inputs) {
    if (!input.cloudinaryUrl) {
      throw new Error("cloudinaryUrl is required");
    }
    if (!input.technicianId) {
      throw new Error("technicianId is required");
    }
    if (!validPhotoTypes.includes(input.type)) {
      throw new Error("Invalid photo type");
    }
    if (input.type === "signature" && !input.signerName) {
      throw new Error("signerName is required for signature uploads");
    }
  }

  await connectMongo();

  const schedules = await Schedule.find({
    _id: { $in: scheduleIds.map((id) => toObjectId(id)) },
  }).select("_id");

  if (schedules.length !== scheduleIds.length) {
    throw new Error("Referenced schedule does not exist");
  }

  const docs = inputs.map((input) => ({
    scheduleId: toObjectId(input.scheduleId),
    cloudinaryUrl: input.cloudinaryUrl,
    type: input.type,
    technicianId: input.technicianId,
    timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    signerName: input.signerName ?? null,
  }));

  const inserted = await Photo.insertMany(docs);

  revalidatePath("/schedule");
  revalidatePath("/client-portal/dashboard");

  return { inserted: inserted.length };
}

export async function deletePhoto(photoId: string): Promise<{
  deleted: boolean;
  alreadyDeleted?: boolean;
}> {
  if (!isValidObjectId(photoId)) {
    throw new Error("Invalid photo id format");
  }

  await connectMongo();

  const photo = await Photo.findById(
    toObjectId(photoId),
  ).lean<PhotoRecordType>();

  if (!photo) {
    return { deleted: true, alreadyDeleted: true };
  }

  if (photo.cloudinaryUrl) {
    const publicId = extractPublicId(photo.cloudinaryUrl);
    if (publicId) {
      const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
      if (
        cloudinaryResult.result !== "ok" &&
        cloudinaryResult.result !== "not found"
      ) {
        throw new Error("Failed to delete image from Cloudinary");
      }
    }
  }

  await Photo.deleteOne({ _id: toObjectId(photoId) });

  revalidatePath("/schedule");
  revalidatePath("/client-portal/dashboard");

  return { deleted: true };
}

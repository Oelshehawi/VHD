import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import connectMongo from "../../lib/connect";
import { Photo } from "../../../models/reactDataSchema";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type PhotoType = "before" | "after" | "estimate" | "signature";

interface UpsertPhotoPayload {
  id: string;
  scheduleId: string;
  cloudinaryUrl: string;
  type: PhotoType;
  technicianId: string;
  timestamp: string;
  signerName?: string;
}

function extractPublicId(cloudinaryUrl: string): string | null {
  const matches = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
  return matches?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: UpsertPhotoPayload;
  try {
    payload = (await request.json()) as UpsertPhotoPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    id,
    scheduleId,
    cloudinaryUrl,
    type,
    technicianId,
    timestamp,
    signerName,
  } = payload;

  if (!id || !scheduleId || !cloudinaryUrl || !type) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        message: "id, scheduleId, cloudinaryUrl, and type are required",
      },
      { status: 400 },
    );
  }

  let scheduleObjectId: mongoose.Types.ObjectId;
  let photoObjectId: mongoose.Types.ObjectId;

  try {
    scheduleObjectId = new mongoose.Types.ObjectId(scheduleId);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid schedule ID format",
        message: "The provided scheduleId is not a valid MongoDB ObjectId",
      },
      { status: 400 },
    );
  }

  try {
    photoObjectId = new mongoose.Types.ObjectId(id);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid photo ID format",
        message: "The provided id is not a valid MongoDB ObjectId",
      },
      { status: 400 },
    );
  }

  await connectMongo();

  try {
    await Photo.updateOne(
      { _id: photoObjectId },
      {
        $set: {
          scheduleId: scheduleObjectId,
          cloudinaryUrl,
          type,
          technicianId: technicianId || "",
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          signerName: signerName ?? null,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo upsert error:", error);
    return NextResponse.json(
      {
        error: "Database error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const queryId = url.searchParams.get("id");

  let bodyId: string | undefined;
  if (!queryId) {
    try {
      const body = (await request.json()) as { id?: string };
      bodyId = body?.id;
    } catch {
      bodyId = undefined;
    }
  }

  const id = queryId || bodyId;

  if (!id) {
    return NextResponse.json(
      { error: "Missing id", message: "id is required for deletion" },
      { status: 400 },
    );
  }

  let photoObjectId: mongoose.Types.ObjectId;
  try {
    photoObjectId = new mongoose.Types.ObjectId(id);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid photo ID format",
        message: "The provided id is not a valid MongoDB ObjectId",
      },
      { status: 400 },
    );
  }

  await connectMongo();

  const photo = await Photo.findById(photoObjectId).lean();
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  if (!photo.cloudinaryUrl?.includes("cloudinary.com")) {
    return NextResponse.json(
      {
        error: "Invalid Cloudinary URL",
        message: "The stored URL does not appear to be a Cloudinary URL",
      },
      { status: 400 },
    );
  }

  const publicId = extractPublicId(photo.cloudinaryUrl);
  if (!publicId) {
    return NextResponse.json(
      {
        error: "Invalid Cloudinary URL format",
        message: "Could not extract the public_id from the Cloudinary URL",
      },
      { status: 400 },
    );
  }

  try {
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);

    if (
      cloudinaryResult.result !== "ok" &&
      cloudinaryResult.result !== "not found"
    ) {
      console.error("Cloudinary deletion failed:", cloudinaryResult);
      return NextResponse.json(
        {
          error: "Failed to delete image from Cloudinary",
          cloudinaryResult,
        },
        { status: 500 },
      );
    }
  } catch (cloudinaryError) {
    console.error("Cloudinary deletion failed:", cloudinaryError);
    return NextResponse.json(
      {
        error: "Cloudinary deletion failed",
        message:
          cloudinaryError instanceof Error
            ? cloudinaryError.message
            : "Unknown Cloudinary error",
      },
      { status: 500 },
    );
  }

  await Photo.deleteOne({ _id: photoObjectId });

  return NextResponse.json({ success: true });
}

// pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import { Schedule } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import mongoose from "mongoose";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

interface UploadRequest {
  images: string[];
  type: "before" | "after" | "signature";
  technicianId: string;
  signerName?: string;
  scheduleId?: string;
  jobTitle?: string;
  photoId?: string; // Added for idempotency check
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const {
      images,
      type,
      technicianId,
      signerName,
      scheduleId = "unknown",
      jobTitle = "unknown job",
      photoId, // Get photoId from request
    } = req.body as UploadRequest;

    if (!scheduleId || scheduleId === "unknown") {
      return res.status(400).json({
        error: "Invalid scheduleId",
        message: "A valid scheduleId is required",
        receivedId: scheduleId,
      });
    }

    // Try to convert scheduleId to MongoDB ObjectId
    let scheduleObjectId;
    try {
      scheduleObjectId = new mongoose.Types.ObjectId(scheduleId);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid schedule ID format",
        message: "The provided scheduleId is not a valid MongoDB ObjectId",
        receivedId: scheduleId,
      });
    }

    // Connect to DB and find schedule
    const [, schedule] = await Promise.all([
      connectMongo(),
      Schedule.findById(scheduleObjectId),
    ]);

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // // Check if the photo already exists by photoId
    // if (photoId && type !== "signature") {
    //   const existingPhotos = schedule.photos?.[type] || [];
    //   const photoExists = existingPhotos.some(
    //     (photo: any) => photo._id === photoId || photo.id === photoId
    //   );

    //   if (photoExists) {
    //     console.log(`Photo ${photoId} already exists, skipping upload`);
    //     return res.status(200).json({
    //       message: "Photo already exists",
    //       type,
    //       data: schedule.photos?.[type] || [],
    //       alreadyUploaded: true,
    //     });
    //   }
    // }

    // // For signature, check if signature already exists
    // if (type === "signature" && schedule.signature && photoId) {
    //   if (schedule.signature._id === photoId) {
    //     return res.status(200).json({
    //       message: "Signature already exists",
    //       type,
    //       data: schedule.signature,
    //       alreadyUploaded: true,
    //     });
    //   }
    // }

    // Format date and create folder name
    const dateStr = schedule.startDateTime
      ? new Date(schedule.startDateTime).toISOString().split("T")[0]
      : "no-date";

    const sanitizedJobTitle = `${jobTitle} - ${dateStr}`
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    // Start uploads with optimized settings
    const uploadPromises = images.map((image) =>
      cloudinary.uploader.upload(image, {
        folder: `vhd-app/${sanitizedJobTitle}/${type}`,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto",
        eager_async: true,
        transformation: [{ width: 800, height: 600, crop: "limit" }],
      }),
    );

    // Process uploads
    const results = await Promise.all(uploadPromises);

    // Find and update schedule in one operation
    const updateQuery =
      type === "signature"
        ? {
            $set: {
              signature: {
                url: results[0]?.secure_url || "",
                timestamp: new Date(),
                signerName: signerName || "",
                technicianId,
              },
            },
          }
        : {
            $addToSet: {
              [`photos.${type}`]: {
                $each: results.map((result: { secure_url: string }) => ({
                  url: result.secure_url,
                  timestamp: new Date(),
                  technicianId,
                })),
              },
            },
          };

    try {
      const updatedSchedule = await Schedule.findOneAndUpdate(
        { _id: scheduleObjectId },
        updateQuery,
        { new: true, runValidators: true },
      );

      if (!updatedSchedule) {
        return res.status(404).json({
          error: "Failed to update schedule",
          message: "The schedule was not found or could not be updated",
        });
      }

      return res.status(200).json({
        message: "Upload successful",
        type,
        data:
          type === "signature"
            ? updatedSchedule.signature
            : updatedSchedule.photos?.[type] || [],
        newlyUploaded: true,
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return res.status(400).json({
        error: "Database validation error",
        message:
          dbError instanceof Error ? dbError.message : "Unknown database error",
        details: dbError,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: "Upload failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });
  }
}

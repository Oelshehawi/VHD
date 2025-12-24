import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { Schedule } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import mongoose from "mongoose";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

interface UpdatePhotoRequest {
  cloudinaryUrl: string;
  type: "before" | "after" | "signature";
  technicianId: string;
  scheduleId: string;
  timestamp: string;
  signerName?: string;
}

// Interface for the photo object
interface PhotoObject {
  url: string;
  timestamp: string;
  technicianId: string;
  type: "before" | "after";
}

// Interface for the signature object
interface SignatureObject {
  url: string;
  timestamp: string;
  technicianId: string;
  signerName: string;
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
      cloudinaryUrl,
      type,
      technicianId,
      scheduleId,
      timestamp,
      signerName,
    } = req.body as UpdatePhotoRequest;

    // Validate required fields
    if (!cloudinaryUrl || !scheduleId || !type) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "cloudinaryUrl, scheduleId, and type are required",
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

    // For photo uploads, check if the URL already exists to prevent duplicates
    if (type !== "signature" && schedule.photos && schedule.photos.length > 0) {
      const urlExists = schedule.photos.some(
        (photo: any) => photo.url === cloudinaryUrl,
      );

      if (urlExists) {
        return res.status(200).json({
          success: true,
          message: "Photo already exists",
        });
      }
    }

    // For signature, check if it's the same URL to avoid unnecessary updates
    if (
      type === "signature" &&
      schedule.signature &&
      schedule.signature.url === cloudinaryUrl
    ) {
      return res.status(200).json({
        success: true,
        message: "Signature already exists",
      });
    }

    // Create update query object
    const updateQuery: Record<string, any> = {};

    // Handle different types of uploads
    if (type === "signature") {
      // For signature type - validate required fields
      if (!signerName) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "signerName is required for signature uploads",
        });
      }

      // Create signature object
      const signatureObject: SignatureObject = {
        url: cloudinaryUrl,
        timestamp: timestamp || new Date().toISOString(),
        technicianId: technicianId || "",
        signerName: signerName,
      };

      // Set the signature field
      updateQuery.signature = signatureObject;
    } else {
      // For photo type (before/after)
      const photoObject: PhotoObject = {
        url: cloudinaryUrl,
        timestamp: timestamp || new Date().toISOString(),
        technicianId: technicianId || "",
        type: type as "before" | "after", // Cast is safe because we've checked it's not 'signature'
      };

      // Add the new photo to the photos array
      updateQuery.$push = {
        photos: photoObject,
      };
    }

    // Update the schedule with the new photo or signature
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
        success: true,
        message:
          type === "signature"
            ? "Signature added successfully"
            : "Photo added successfully",
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
    console.error("Update error:", error);
    return res.status(500).json({
      error: "Update failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

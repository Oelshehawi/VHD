import { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import { Schedule } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import mongoose from "mongoose";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface DownloadRequest {
  id?: string; // Support 'id' which client might send
  photoId?: string; // Support 'photoId' from client API
  photoUrl?: string; // Support 'photoUrl' from downloadFile function
  scheduleId?: string; // Support legacy scheduleId param
  type?: "before" | "after" | "signature"; // Support legacy type param
  expiresIn?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectMongo();

    // Get params from request body, supporting multiple parameter names
    const {
      id,
      photoId,
      photoUrl,
      scheduleId,
      type,
      expiresIn = 3600,
    } = req.body as DownloadRequest;

    // Use whichever ID parameter is provided (in order of preference)
    const imageId = photoUrl || photoId || id;

    if (!imageId) {
      return res.status(400).json({
        error: "Missing required field",
        message: "Either photoUrl, photoId, or id is required",
        receivedBody: req.body,
      });
    }

    // Remove any file extension if present
    const cleanId = imageId.replace(/\.jpg$|\.jpeg$|\.png$/i, "");

    // Try to create a valid MongoDB ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(cleanId);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "The provided ID is not a valid MongoDB ObjectId",
        receivedId: cleanId,
      });
    }

    // If scheduleId is provided, search only in that schedule
    let targetSchedule = null;
    if (scheduleId) {
      try {
        const scheduleObjectId = new mongoose.Types.ObjectId(scheduleId);
        targetSchedule = await Schedule.findById(scheduleObjectId);

        if (!targetSchedule) {
          return res.status(404).json({
            error: "Schedule not found",
            scheduleId: scheduleId,
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid schedule ID format",
          message: "The provided scheduleId is not a valid MongoDB ObjectId",
          receivedScheduleId: scheduleId,
        });
      }
    }

    // Variables to store search results
    let foundUrl = null;
    let foundSchedule = null;
    let foundPhotoType = null;

    // If a specific schedule is targeted
    if (targetSchedule) {
      // If type is provided, search only in that photo type
      if (type) {
        if (type === "signature" && targetSchedule.signature) {
          if (targetSchedule.signature._id.toString() === cleanId) {
            foundUrl = targetSchedule.signature.url;
            foundPhotoType = "signature";
          }
        } else if (type === "before" && targetSchedule.photos?.before) {
          const photo = targetSchedule.photos.before.find(
            (p) => p._id.toString() === cleanId,
          );
          if (photo) {
            foundUrl = photo.url;
            foundPhotoType = "before";
          }
        } else if (type === "after" && targetSchedule.photos?.after) {
          const photo = targetSchedule.photos.after.find(
            (p) => p._id.toString() === cleanId,
          );
          if (photo) {
            foundUrl = photo.url;
            foundPhotoType = "after";
          }
        }
      }
      // If no type provided, search all photo types in the target schedule
      else {
        // Check before photos
        if (targetSchedule.photos?.before) {
          const photo = targetSchedule.photos.before.find(
            (p) => p._id.toString() === cleanId,
          );
          if (photo) {
            foundUrl = photo.url;
            foundPhotoType = "before";
          }
        }

        // Check after photos if not found yet
        if (!foundUrl && targetSchedule.photos?.after) {
          const photo = targetSchedule.photos.after.find(
            (p) => p._id.toString() === cleanId,
          );
          if (photo) {
            foundUrl = photo.url;
            foundPhotoType = "after";
          }
        }

        // Check signature if not found yet
        if (!foundUrl && targetSchedule.signature) {
          if (targetSchedule.signature._id.toString() === cleanId) {
            foundUrl = targetSchedule.signature.url;
            foundPhotoType = "signature";
          }
        }
      }

      if (foundUrl) {
        foundSchedule = targetSchedule;
      }
    }
    // If no specific schedule targeted, search across all schedules
    else {
      // Find schedules containing the photo with the given ID
      const scheduleWithBeforePhoto = await Schedule.findOne({
        "photos.before._id": objectId,
      });

      const scheduleWithAfterPhoto = await Schedule.findOne({
        "photos.after._id": objectId,
      });

      const scheduleWithSignature = await Schedule.findOne({
        "signature._id": objectId,
      });

      // Find which collection had the photo and get its URL
      if (scheduleWithBeforePhoto && scheduleWithBeforePhoto.photos?.before) {
        const photo = scheduleWithBeforePhoto.photos.before.find(
          (p) => p._id.toString() === cleanId,
        );
        if (photo) {
          foundUrl = photo.url;
          foundSchedule = scheduleWithBeforePhoto;
          foundPhotoType = "before";
        }
      } else if (
        scheduleWithAfterPhoto &&
        scheduleWithAfterPhoto.photos?.after
      ) {
        const photo = scheduleWithAfterPhoto.photos.after.find(
          (p) => p._id.toString() === cleanId,
        );
        if (photo) {
          foundUrl = photo.url;
          foundSchedule = scheduleWithAfterPhoto;
          foundPhotoType = "after";
        }
      } else if (scheduleWithSignature && scheduleWithSignature.signature) {
        if (scheduleWithSignature.signature._id.toString() === cleanId) {
          foundUrl = scheduleWithSignature.signature.url;
          foundSchedule = scheduleWithSignature;
          foundPhotoType = "signature";
        }
      }
    }

    if (!foundUrl) {
      return res.status(404).json({
        error: "Photo not found in any schedule",
        searchedId: cleanId,
        searchedSchedule: scheduleId || "all",
      });
    }

    return res.status(200).json({
      message: "Photo URL retrieved successfully",
      downloadUrl: foundUrl,
      scheduleId: foundSchedule?._id.toString(),
      photoType: foundPhotoType,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Download failed",
      message: error instanceof Error ? error.message : "Unknown error",
      requestBody: req.body,
    });
  }
}

// Helper functions kept for reference but not used anymore
function extractPublicIdFromUrl(url: string): string {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
  if (!matches || !matches[1]) {
    throw new Error("Invalid Cloudinary URL format");
  }
  return matches[1];
}

function createSignedUrl(url: string, expiresIn: number = 3600): string {
  const publicId = extractPublicIdFromUrl(url);
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  });
}

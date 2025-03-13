// pages/api/delete-photo.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { Schedule } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface DeletePhotoRequest {
  scheduleId: string;
  cloudinaryUrl: string;
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
    const { scheduleId, cloudinaryUrl } = req.body as DeletePhotoRequest;

    // Validate required fields
    if (!scheduleId || !cloudinaryUrl) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "scheduleId and cloudinaryUrl are required",
      });
    }

    // Convert scheduleId to MongoDB ObjectId
    let scheduleObjectId;
    try {
      scheduleObjectId = new mongoose.Types.ObjectId(scheduleId);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid schedule ID format",
        message: "The provided scheduleId is not a valid MongoDB ObjectId",
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

    // Parse photos from the schedule
    let photosArray = [];
    let photoType = "";
    let photoId = "";
    let deletedPhoto = null;
    let photoWasFound = false;

    try {
      // Get the photos array
      if (schedule.photos) {
        const photosData =
          typeof schedule.photos === "string"
            ? JSON.parse(schedule.photos)
            : schedule.photos;

        // Handle both array format and { photos: [] } format
        photosArray = Array.isArray(photosData.photos)
          ? photosData.photos
          : Array.isArray(photosData)
            ? photosData
            : [];

        // Find the photo to delete
        const photoIndex = photosArray.findIndex(
          (p: { url: string }) => p.url === cloudinaryUrl,
        );

        if (photoIndex === -1) {
          // Photo not found in array - likely already deleted
          // We'll still try to delete from Cloudinary but won't modify the array
          photoWasFound = false;
          console.log("Photo not found in array, likely already deleted");
        } else {
          // Photo found in array, store data and remove it
          photoWasFound = true;
          deletedPhoto = photosArray[photoIndex];
          photoType = deletedPhoto.type || "";
          photoId = deletedPhoto.id || "";

          // Remove the photo from the array
          photosArray.splice(photoIndex, 1);
        }
      } else {
        // No photos in schedule
        photoWasFound = false;
        console.log("No photos found in this schedule");
      }
    } catch (error) {
      console.error("Error processing photos:", error);
      return res.status(500).json({
        error: "Failed to process photos data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Now delete from Cloudinary regardless of whether photo was found in array
    let cloudinaryResult;
    try {
      if (cloudinaryUrl.includes("cloudinary.com")) {
        // Extract public_id from Cloudinary URL using regex
        // This will get everything after /upload/v{version}/ and before the file extension
        const matches = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
        if (!matches || !matches[1]) {
          return res.status(400).json({
            error: "Invalid Cloudinary URL format",
            message: "Could not extract the public_id from the Cloudinary URL",
          });
        }

        const publicId = matches[1];

        // Delete the image from Cloudinary
        cloudinaryResult = await cloudinary.uploader.destroy(publicId);

        // For Cloudinary, "not found" is an acceptable result - the image is already gone
        if (
          cloudinaryResult.result !== "ok" &&
          cloudinaryResult.result !== "not found"
        ) {
          console.error("Cloudinary deletion failed:", cloudinaryResult);
          return res.status(500).json({
            error: "Failed to delete image from Cloudinary",
            cloudinaryResult,
            message: "The image could not be deleted from Cloudinary storage",
          });
        }
      } else {
        return res.status(400).json({
          error: "Invalid Cloudinary URL",
          message: "The provided URL does not appear to be a Cloudinary URL",
        });
      }
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      return res.status(500).json({
        error: "Cloudinary deletion failed",
        message:
          cloudinaryError instanceof Error
            ? cloudinaryError.message
            : "Unknown Cloudinary error",
      });
    }

    // Only update the database if we actually found and removed a photo
    if (photoWasFound) {
      // Prepare update query
      const updateQuery: Record<string, any> = {
        photos: photosArray, // Store photos directly as an array
      };

      // Update the schedule
      const updatedSchedule = await Schedule.findOneAndUpdate(
        { _id: scheduleObjectId },
        updateQuery,
        { new: true },
      );

      if (!updatedSchedule) {
        return res.status(404).json({
          error: "Failed to update schedule",
          message: "The schedule was not found or could not be updated",
        });
      }
    }

    // Return success even if photo wasn't found (handle double-click case)
    return res.status(200).json({
      success: true,
      message: photoWasFound
        ? "Photo deleted successfully"
        : "Photo was already deleted",
      photoWasFound,
      cloudinaryResult,
      deletedPhoto: photoWasFound
        ? {
            type: photoType,
            id: photoId,
            url: cloudinaryUrl,
          }
        : null,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      error: "Delete failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

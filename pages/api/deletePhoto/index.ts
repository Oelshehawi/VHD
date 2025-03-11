import { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import { Schedule } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Add delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Track last deletion time
let lastDeletionTime = 0;
const MIN_DELETE_INTERVAL = 1000; // 1 second minimum between deletions

interface DeleteRequest {
  photoUrl: string;
  type: "before" | "after";
  scheduleId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectMongo();
    const { photoUrl, type, scheduleId } = req.body as DeleteRequest;

    if (!photoUrl || !type || !scheduleId) {
      throw new Error("Missing required fields");
    }

    // Extract public_id from Cloudinary URL
    const matches = photoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
    if (!matches || !matches[1]) {
      throw new Error("Invalid Cloudinary URL format");
    }
    const publicId = matches[1];

    // Check if we need to wait before making another deletion
    const now = Date.now();
    const timeSinceLastDeletion = now - lastDeletionTime;
    if (timeSinceLastDeletion < MIN_DELETE_INTERVAL) {
      const waitTime = MIN_DELETE_INTERVAL - timeSinceLastDeletion;
      console.log(`⏳ Waiting ${waitTime}ms before next deletion`);
      await delay(waitTime);
    }

    console.log("🗑️ Attempting to delete from Cloudinary:", {
      url: photoUrl,
      publicId,
    });

    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    lastDeletionTime = Date.now();

    console.log("☁️ Cloudinary delete result:", cloudinaryResult);

    if (cloudinaryResult.result !== "ok") {
      throw new Error("Failed to delete from Cloudinary");
    }

    // Remove photo from MongoDB
    const schedule = await Schedule.findOneAndUpdate(
      { _id: scheduleId },
      {
        $pull: {
          [`photos.${type}`]: { url: photoUrl },
        },
      },
      { new: true },
    );

    if (!schedule) {
      throw new Error("Schedule not found or update failed");
    }

    console.log("📝 Updated schedule:", {
      id: schedule._id,
      remainingPhotos: schedule.photos?.[type]?.length || 0,
    });

    return res.status(200).json({
      message: "Photo deleted successfully",
      photos: schedule.photos?.[type] || [],
    });
  } catch (error) {
    console.error("💥 Error in delete API:", error);
    res.status(500).json({
      error: "Delete failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

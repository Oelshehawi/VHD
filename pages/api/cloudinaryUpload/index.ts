// pages/api/cloudinary-upload.ts
import { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadRequest {
  fileName: string;
  mediaType?: string;
  jobTitle?: string;
  type?: string;
  startDate?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify authentication
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { fileName, mediaType, jobTitle, type, startDate } = req.body as CloudinaryUploadRequest;

    if (!fileName) {
      return res.status(400).json({
        error: "Missing fileName",
        message: "A fileName is required",
      });
    }

    // Format date and create folder name
    const dateStr = startDate
      ? new Date(startDate).toISOString().split("T")[0]
      : "no-date";

    const sanitizedJobTitle = `${jobTitle} - ${dateStr}`
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const folderPath = `vhd-app/${sanitizedJobTitle}/${type}`;

    // Generate a signed upload URL from Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: folderPath,
      },
      process.env.CLOUDINARY_API_SECRET || "",
    );

    // Create the upload URL
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;


    return res.status(200).json({
      message: "Upload parameters generated successfully",
      apiKey,
      timestamp,
      signature,
      cloudName,
      folderPath,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return res.status(500).json({
      error: "Failed to generate upload URL",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// pages/api/deletePhoto.ts
import { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import { Invoice } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface DeleteRequest {
  photoUrl: string;
  type: "before" | "after";
  invoiceId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
    const { photoUrl, type, invoiceId } = req.body as DeleteRequest;

    if (!photoUrl || !type || !invoiceId) {
      throw new Error("Missing required fields");
    }

    // Extract public_id from Cloudinary URL
    // Example URL: https://res.cloudinary.com/your-cloud/image/upload/v1234567/vhd-app/job-title/before/image.jpg
    const matches = photoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
    if (!matches || !matches[1]) {
      throw new Error("Invalid Cloudinary URL format");
    }
    const publicId = matches[1];

    console.log("🗑️ Attempting to delete from Cloudinary:", {
      url: photoUrl,
      publicId,
    });

    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    
    console.log("☁️ Cloudinary delete result:", cloudinaryResult);

    if (cloudinaryResult.result !== 'ok') {
      throw new Error("Failed to delete from Cloudinary");
    }

    // Remove photo from MongoDB
    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId },
      {
        $pull: {
          [`photos.${type}`]: { url: photoUrl },
        },
      },
      { new: true }
    );

    if (!invoice) {
      throw new Error("Invoice not found or update failed");
    }

    console.log("📝 Updated invoice:", {
      id: invoice._id,
      remainingPhotos: invoice.photos?.[type]?.length || 0,
    });

    return res.status(200).json({
      message: "Photo deleted successfully",
      photos: invoice.photos?.[type] || [],
    });
  } catch (error) {
    console.error("💥 Error in delete API:", error);
    res.status(500).json({ 
      error: "Delete failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}
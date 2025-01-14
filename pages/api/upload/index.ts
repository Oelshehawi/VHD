import { NextApiRequest, NextApiResponse } from "next";
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import { PhotoType, SignatureType } from "../../../app/lib/typeDefinitions";
import { Invoice } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";

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
  invoiceId?: string;
  jobTitle?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log("🔥 Upload API called");

  const { userId } = getAuth(req);

  if (!userId) {
    console.log("❌ Unauthorized - No user ID");
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectMongo();
    const { images, type, technicianId, signerName, jobTitle, invoiceId } =
      req.body as UploadRequest;

    console.log("📦 Request body:", {
      type,
      technicianId,
      jobTitle,
      invoiceId,
      imagesCount: images?.length,
    });

    if (!images || !Array.isArray(images) || !invoiceId) {
      throw new Error("Missing required fields");
    }

    if (!technicianId || !jobTitle) {
      throw new Error("Technician ID and job title are required");
    }

    const sanitizedJobTitle = jobTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const uploadPromises = images.map((image: string) =>
      cloudinary.uploader.upload(image, {
        folder: `vhd-app/${sanitizedJobTitle}/${type}`,
        resource_type: "auto",
      }),
    );

    const results = await Promise.all(uploadPromises);

    console.log(
      "☁️ Cloudinary upload results:",
      results.map((r) => r.secure_url),
    );

    // Find the invoice - use findOneAndUpdate instead of findById
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
                $each: results.map((result) => ({
                  url: result.secure_url,
                  timestamp: new Date(),
                  technicianId,
                })),
              },
            },
          };

    // First ensure the photos structure exists
    await Invoice.updateOne(
      {
        _id: invoiceId,
        photos: { $exists: false },
      },
      {
        $set: {
          photos: { before: [], after: [] },
        },
      },
    );

    // Then update with the new photos/signature
    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId },
      updateQuery,
      {
        new: true,
        runValidators: true,
      },
    );

    console.log("🔍 Updated invoice:", {
      id: invoice?._id,
      photos: invoice?.photos,
      signature: invoice?.signature,
    });

    if (!invoice) {
      throw new Error("Invoice not found or update failed");
    }

    return res.status(200).json({
      message: "Upload successful",
      type,
      data:
        type === "signature" ? invoice.signature : invoice.photos?.[type] || [],
    });
  } catch (error) {
    console.error("💥 Error in upload API:", error);
    res.status(500).json({ error: "Upload failed" });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

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

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CloudinaryUploadRequest;
  try {
    payload = (await request.json()) as CloudinaryUploadRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, jobTitle, type, startDate } = payload;

  if (!fileName) {
    return NextResponse.json(
      {
        error: "Missing fileName",
        message: "A fileName is required",
      },
      { status: 400 },
    );
  }

  const dateStr = startDate
    ? new Date(startDate).toISOString().split("T")[0]
    : "no-date";

  const sanitizedJobTitle = `${jobTitle} - ${dateStr}`
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();

  const folderPath = `vhd-app/${sanitizedJobTitle}/${type}`;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: folderPath,
    },
    process.env.CLOUDINARY_API_SECRET || "",
  );

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;

  return NextResponse.json({
    message: "Upload parameters generated successfully",
    apiKey,
    timestamp,
    signature,
    cloudName,
    folderPath,
  });
}

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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const buildFolderPath = (
    jobTitle: string,
    type: string,
    startDate: string,
  ) => {
    const parsedDate = new Date(startDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "Invalid startDate" } as const;
    }

    const dateStr = parsedDate.toISOString().split("T")[0];

    const sanitizedJobTitle = `${jobTitle} - ${dateStr}`
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    return {
      folderPath: `vhd-app/${sanitizedJobTitle}/${type}`,
    } as const;
  };

  const toSignedResponse = (file: CloudinaryUploadRequest) => {
    const { fileName, jobTitle, type, startDate } = file;
    if (!fileName) {
      return { error: "Missing fileName" } as const;
    }
    if (!jobTitle) {
      return { error: "Missing jobTitle" } as const;
    }
    if (!type) {
      return { error: "Missing type" } as const;
    }
    if (!startDate) {
      return { error: "Missing startDate" } as const;
    }

    const folderResult = buildFolderPath(jobTitle, type, startDate);
    if ("error" in folderResult) {
      return folderResult;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: folderResult.folderPath,
      },
      process.env.CLOUDINARY_API_SECRET || "",
    );

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    return {
      filename: fileName,
      apiKey,
      timestamp,
      signature,
      cloudName,
      folderPath: folderResult.folderPath,
    } as const;
  };

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { files?: CloudinaryUploadRequest[] }).files)
  ) {
    const files = (payload as { files: CloudinaryUploadRequest[] }).files;
    if (files.length === 0) {
      return NextResponse.json(
        { error: "Missing files", message: "A files array is required" },
        { status: 400 },
      );
    }

    const signedUrls = [];
    for (const file of files) {
      const result = toSignedResponse(file);
      if ("error" in result) {
        return NextResponse.json(
          { error: result.error, message: result.error },
          { status: 400 },
        );
      }
      signedUrls.push(result);
    }

    return NextResponse.json({ signedUrls });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "Missing fileName", message: "A fileName is required" },
      { status: 400 },
    );
  }

  const result = toSignedResponse(payload as CloudinaryUploadRequest);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, message: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: "Upload parameters generated successfully",
    ...result,
  });
}

import { NextRequest, NextResponse } from "next/server";
import connectMongo from "../../../lib/connect";
import { AppVersion, IAppVersion } from "../../../../models";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");

  // Validate platform parameter
  if (!platform) {
    return NextResponse.json(
      { error: "Missing required parameter: platform" },
      { status: 400 },
    );
  }

  if (!["ios", "android"].includes(platform)) {
    return NextResponse.json(
      { error: "Invalid platform. Must be 'ios' or 'android'" },
      { status: 400 },
    );
  }

  try {
    await connectMongo();

    const versionDoc = await AppVersion.findOne({ platform }).lean<IAppVersion>();

    if (!versionDoc) {
      return NextResponse.json(
        { error: `No version information found for platform: ${platform}` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      latest_version: versionDoc.latest_version,
      min_required_version: versionDoc.min_required_version,
      release_notes: versionDoc.release_notes,
    });
  } catch (error) {
    console.error("Error fetching app version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

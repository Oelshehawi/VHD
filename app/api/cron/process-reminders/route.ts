import { NextResponse } from "next/server";
import {
  processAutoReminders,
  previewAutoReminders,
} from "../../../lib/actions/reminder.actions";

export async function GET(request: Request) {
  // Verify this request is from Vercel Cron (skip in development)
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const isPreview = url.searchParams.get("preview") === "true";

  try {
    if (isPreview) {
      const result = await previewAutoReminders();

      return NextResponse.json({
        mode: "preview",
        message: "DRY RUN - No emails were sent",
        wouldProcess: result.wouldProcess,
        previews: result.previews,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await processAutoReminders();

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      sentCount: result.sentCount,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

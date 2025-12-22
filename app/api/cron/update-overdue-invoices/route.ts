import { NextRequest, NextResponse } from "next/server";
import { checkAndProcessOverdueInvoices } from "../../../lib/actions/actions";

export async function GET(req: NextRequest) {
  // Only allow GET requests (Vercel cron calls this endpoint)

  // Verify this request is from Vercel Cron (skip in development)
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await checkAndProcessOverdueInvoices();
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cron job failed",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

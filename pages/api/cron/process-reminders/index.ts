import { NextApiRequest, NextApiResponse } from "next";
import {
  processAutoReminders,
  previewAutoReminders,
} from "../../../../app/lib/actions/reminder.actions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow GET requests (Vercel cron calls this endpoint)
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify this request is from Vercel Cron (skip in development)
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // Check for preview mode (dry-run)
  const isPreview = req.query.preview === "true";

  try {
    if (isPreview) {
      // Preview mode - just show what would be sent
      const result = await previewAutoReminders();

      return res.status(200).json({
        mode: "preview",
        message: "DRY RUN - No emails were sent",
        wouldProcess: result.wouldProcess,
        previews: result.previews,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Normal mode - actually send reminders
    const result = await processAutoReminders();

    return res.status(200).json({
      success: true,
      processedCount: result.processedCount,
      sentCount: result.sentCount,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return res.status(500).json({
      error: "Cron job failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}

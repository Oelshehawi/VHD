import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import { TimeOffRequest, AuditLog } from "../../../models/reactDataSchema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Extract time-off request data from request body
    const { technicianId, startDate, endDate, reason } = req.body;

    // Validate required fields
    if (!technicianId) {
      return res.status(400).json({ message: "Technician ID is required" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Reason is required" });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Validate start date is before end date
    if (start >= end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    // Validate 2-week advance notice (14 days)
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    if (start < twoWeeksFromNow) {
      return res.status(400).json({
        message: "Time-off requests must be made at least 2 weeks in advance",
        requiredDate: twoWeeksFromNow.toISOString().split("T")[0],
      });
    }

    // Connect to the database
    await connectMongo();

    // Create new time-off request
    const newRequest = new TimeOffRequest({
      technicianId,
      startDate: start,
      endDate: end,
      reason,
      status: "pending",
      requestedAt: new Date(),
    });

    const savedRequest = await newRequest.save();

    // Create audit log for request creation
    await AuditLog.create({
      invoiceId: "system", // System-level action
      action: "timeoff_requested",
      timestamp: new Date(),
      performedBy: technicianId,
      details: {
        newValue: savedRequest,
        metadata: {
          requestId: savedRequest._id,
          dateRange: `${startDate} to ${endDate}`,
        },
      },
      success: true,
    });

    // Return success response
    return res.status(201).json({
      message: "Time-off request created successfully",
      request: savedRequest,
    });
  } catch (error) {
    console.error("Error creating time-off request:", error);
    return res.status(500).json({
      message: "Failed to create time-off request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

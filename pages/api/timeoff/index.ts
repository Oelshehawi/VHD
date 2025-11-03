import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import { TimeOffRequest, AuditLog } from "../../../models/reactDataSchema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Route to appropriate handler based on HTTP method
  switch (req.method) {
    case "POST":
      return handlePost(req, res);
    case "PATCH":
      return handlePatch(req, res);
    case "DELETE":
      return handleDelete(req, res);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

/**
 * POST: Create a new time-off request
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
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
    if (start > end) {
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

/**
 * PATCH: Update a time-off request
 */
async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, startDate, endDate, reason } = req.body;


    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    // Connect to the database
    await connectMongo();

    // Find the existing request
    const existingRequest = await TimeOffRequest.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Prepare update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (startDate !== undefined) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid start date format" });
      }
      updateData.startDate = start;
    }

    if (endDate !== undefined) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid end date format" });
      }
      updateData.endDate = end;
    }

    if (reason !== undefined) {
      if (reason.trim() === "") {
        return res.status(400).json({ message: "Reason cannot be empty" });
      }
      updateData.reason = reason;
    }

    // Validate date logic if both dates are being updated or updated with existing
    const finalStart = updateData.startDate || existingRequest.startDate;
    const finalEnd = updateData.endDate || existingRequest.endDate;
    if (finalStart > finalEnd) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    // Update the request
    const updatedRequest = await TimeOffRequest.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Create audit log for update
    await AuditLog.create({
      invoiceId: "system",
      action: "timeoff_updated",
      timestamp: new Date(),
      performedBy: existingRequest.technicianId,
      details: {
        oldValue: existingRequest,
        newValue: updatedRequest,
        metadata: {
          requestId: id,
          updatedFields: Object.keys(updateData),
        },
      },
      success: true,
    });

    return res.status(200).json({
      message: "Time-off request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating time-off request:", error);
    return res.status(500).json({
      message: "Failed to update time-off request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * DELETE: Delete a time-off request
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    // Connect to the database
    await connectMongo();

    // Find and delete the request
    const deletedRequest = await TimeOffRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Time-off request not found" });
    }

    // Create audit log for deletion
    await AuditLog.create({
      invoiceId: "system",
      action: "timeoff_deleted",
      timestamp: new Date(),
      performedBy: deletedRequest.technicianId,
      details: {
        oldValue: deletedRequest,
        metadata: {
          requestId: id,
        },
      },
      success: true,
    });

    return res.status(200).json({
      message: "Time-off request deleted successfully",
      request: deletedRequest,
    });
  } catch (error) {
    console.error("Error deleting time-off request:", error);
    return res.status(500).json({
      message: "Failed to delete time-off request",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

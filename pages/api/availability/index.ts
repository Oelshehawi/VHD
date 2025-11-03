import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import { Availability, AuditLog } from "../../../models/reactDataSchema";

// Helper function to validate time format
function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Helper function to validate time logic
function validateTimeLogic(startTime: string, endTime: string, isFullDay: boolean): string | null {
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");

  if (startParts.length !== 2 || endParts.length !== 2) {
    return "Invalid time format";
  }

  const startHour = parseInt(startParts[0] ?? "0", 10);
  const startMin = parseInt(startParts[1] ?? "0", 10);
  const endHour = parseInt(endParts[0] ?? "0", 10);
  const endMin = parseInt(endParts[1] ?? "0", 10);

  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;

  if (startTimeMinutes >= endTimeMinutes && !isFullDay) {
    return "Start time must be before end time";
  }
  return null;
}

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
 * POST: Create a new availability entry
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract availability data from request body
    const { technicianId, ...availabilityData } = req.body;

    // Validate required fields
    if (!technicianId) {
      return res.status(400).json({ message: "Technician ID is required" });
    }

    if (!availabilityData.startTime || !availabilityData.endTime) {
      return res.status(400).json({ message: "Start and end times are required" });
    }

    // Validate time format (HH:mm)
    if (!validateTimeFormat(availabilityData.startTime) || !validateTimeFormat(availabilityData.endTime)) {
      return res.status(400).json({ message: "Invalid time format. Use HH:mm" });
    }

    // Validate start time < end time
    const timeError = validateTimeLogic(availabilityData.startTime, availabilityData.endTime, availabilityData.isFullDay);
    if (timeError) {
      return res.status(400).json({ message: timeError });
    }

    // For recurring patterns, dayOfWeek is required
    if (availabilityData.isRecurring && availabilityData.dayOfWeek === undefined) {
      return res.status(400).json({ message: "Day of week is required for recurring availability" });
    }

    // For one-time patterns, specificDate is required
    if (!availabilityData.isRecurring && !availabilityData.specificDate) {
      return res.status(400).json({ message: "Specific date is required for non-recurring availability" });
    }

    // Connect to the database
    await connectMongo();

    // Create new availability
    const newAvailability = new Availability({
      technicianId,
      ...availabilityData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedAvailability = await newAvailability.save();

    // Create audit log for creation
    await AuditLog.create({
      invoiceId: "system",
      action: "availability_created",
      timestamp: new Date(),
      performedBy: technicianId,
      details: {
        newValue: savedAvailability,
      },
      success: true,
    });

    // Return success response
    return res.status(201).json({
      message: "Availability created successfully",
      availability: savedAvailability,
    });
  } catch (error) {
    console.error("Error creating availability:", error);
    return res.status(500).json({
      message: "Failed to create availability",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * PATCH: Update an existing availability entry
 */
async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, technicianId, startTime, endTime, ...otherData } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({ message: "Availability ID is required" });
    }

    // Connect to the database
    await connectMongo();

    // Find the existing availability
    const existingAvailability = await Availability.findById(id);
    if (!existingAvailability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    // Prepare update object with only provided fields
    const updateData: Record<string, unknown> = { ...otherData };

    if (startTime !== undefined) {
      if (!validateTimeFormat(startTime)) {
        return res.status(400).json({ message: "Invalid start time format. Use HH:mm" });
      }
      updateData.startTime = startTime;
    }

    if (endTime !== undefined) {
      if (!validateTimeFormat(endTime)) {
        return res.status(400).json({ message: "Invalid end time format. Use HH:mm" });
      }
      updateData.endTime = endTime;
    }

    // Validate time logic if times are being updated
    if (startTime !== undefined || endTime !== undefined) {
      const finalStartTime = startTime || existingAvailability.startTime;
      const finalEndTime = endTime || existingAvailability.endTime;
      const finalIsFullDay = otherData.isFullDay ?? existingAvailability.isFullDay;
      const timeError = validateTimeLogic(finalStartTime, finalEndTime, finalIsFullDay);
      if (timeError) {
        return res.status(400).json({ message: timeError });
      }
    }

    // Validate recurring/specific date logic
    if (otherData.isRecurring === true && otherData.dayOfWeek === undefined && existingAvailability.dayOfWeek === undefined) {
      return res.status(400).json({ message: "Day of week is required for recurring availability" });
    }

    if (otherData.isRecurring === false && otherData.specificDate === undefined && !existingAvailability.specificDate) {
      return res.status(400).json({ message: "Specific date is required for non-recurring availability" });
    }

    updateData.updatedAt = new Date();

    // Update the availability
    const updatedAvailability = await Availability.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Create audit log for update
    await AuditLog.create({
      invoiceId: "system",
      action: "availability_updated",
      timestamp: new Date(),
      performedBy: existingAvailability.technicianId,
      details: {
        oldValue: existingAvailability,
        newValue: updatedAvailability,
        metadata: {
          availabilityId: id,
          updatedFields: Object.keys(updateData),
        },
      },
      success: true,
    });

    return res.status(200).json({
      message: "Availability updated successfully",
      availability: updatedAvailability,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return res.status(500).json({
      message: "Failed to update availability",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * DELETE: Delete an availability entry
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.body;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({ message: "Availability ID is required" });
    }

    // Connect to the database
    await connectMongo();

    // Find and delete the availability
    const deletedAvailability = await Availability.findByIdAndDelete(id);

    if (!deletedAvailability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    // Create audit log for deletion
    await AuditLog.create({
      invoiceId: "system",
      action: "availability_deleted",
      timestamp: new Date(),
      performedBy: deletedAvailability.technicianId,
      details: {
        oldValue: deletedAvailability,
        metadata: {
          availabilityId: id,
        },
      },
      success: true,
    });

    return res.status(200).json({
      message: "Availability deleted successfully",
      availability: deletedAvailability,
    });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return res.status(500).json({
      message: "Failed to delete availability",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import { Availability, AuditLog } from "../../../models/reactDataSchema";
import { AvailabilityType } from "../../../app/lib/typeDefinitions";

// Helper function to check if string is a valid MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Extract availability data from request body
    const { technicianId, availabilityId, ...availabilityData } = req.body;

    // Validate required fields
    if (!technicianId) {
      return res.status(400).json({ message: "Technician ID is required" });
    }

    if (!availabilityData.startTime || !availabilityData.endTime) {
      return res.status(400).json({ message: "Start and end times are required" });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(availabilityData.startTime) || !timeRegex.test(availabilityData.endTime)) {
      return res.status(400).json({ message: "Invalid time format. Use HH:mm" });
    }

    // Validate start time < end time
    const [startHour, startMin] = availabilityData.startTime.split(":").map(Number);
    const [endHour, endMin] = availabilityData.endTime.split(":").map(Number);
    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    if (startTimeMinutes >= endTimeMinutes && !availabilityData.isFullDay) {
      return res.status(400).json({ message: "Start time must be before end time" });
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

    let updatedAvailability: AvailabilityType | null;
    let action: "availability_created" | "availability_updated" = "availability_created";

    if (availabilityId && isValidObjectId(availabilityId)) {
      // Update existing availability
      const oldAvailability = await Availability.findById(availabilityId);

      updatedAvailability = await Availability.findByIdAndUpdate(
        availabilityId,
        {
          ...availabilityData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true },
      );

      if (!updatedAvailability) {
        return res.status(404).json({ message: "Availability not found" });
      }

      action = "availability_updated";

      // Create audit log for update
      await AuditLog.create({
        invoiceId: "system", // System-level action
        action,
        timestamp: new Date(),
        performedBy: technicianId,
        details: {
          oldValue: oldAvailability,
          newValue: updatedAvailability,
        },
        success: true,
      });
    } else {
      // Create new availability
      const newAvailability = new Availability({
        technicianId,
        ...availabilityData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      updatedAvailability = await newAvailability.save();

      // Create audit log for creation
      await AuditLog.create({
        invoiceId: "system", // System-level action
        action: "availability_created",
        timestamp: new Date(),
        performedBy: technicianId,
        details: {
          newValue: updatedAvailability,
        },
        success: true,
      });
    }

    // Return success response
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

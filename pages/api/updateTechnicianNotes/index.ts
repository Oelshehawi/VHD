import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import { Schedule } from "../../../models/reactDataSchema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Extract the scheduleId and technicianNotes from request body
    const { scheduleId, technicianNotes } = req.body;

    // Validate inputs
    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    if (technicianNotes === undefined) {
      return res.status(400).json({ message: "Technician notes are required" });
    }

    // Connect to the database
    await connectMongo();

    // Update the schedule with the new technician notes
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { technicianNotes },
      { new: true, runValidators: true },
    );

    // Check if schedule exists
    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Return success response
    return res.status(200).json({
      message: "Technician notes updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating technician notes:", error);
    return res.status(500).json({
      message: "Failed to update technician notes",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import { getAuth } from "@clerk/nextjs/server";
import { Schedule } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import { startOfDay, endOfDay } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";
import { clerkClient } from "@clerk/nextjs/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  try {
    const { userId, orgPermissions } = getAuth(req);
    const canManage = orgPermissions?.includes("org:database:allow") ?? false;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await connectMongo();

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Get today's schedules based on user role
    const query = canManage ? {} : { assignedTechnicians: userId };
    const todaySchedules = await Schedule.find({
      ...query,
      startDateTime: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    })
      .sort({ startDateTime: 1 })
      .lean();

    // Get all unique technician IDs from schedules
    const technicianIds = Array.from(
      new Set(todaySchedules.flatMap((s) => s.assignedTechnicians)),
    );

    // Fetch technician names from Clerk
    const users: any = await clerkClient();
    const userList = await users.users.getUserList();
    const technicians = userList.data.map((user: any) => ({
      id: user.id,
      name: user.fullName,
      hourlyRate: user.publicMetadata.hourlyRate,
    }));

    // Create a map of technician IDs to names
    const technicianNames = new Map(
      technicians.map((tech: any) => [tech.id, tech.name || "Unknown"]),
    );

    // Calculate hours per technician
    const employeeHours = technicianIds.map((techId) => ({
      userId: techId,
      name: technicianNames.get(techId) || "Unknown",
      hours: todaySchedules
        .filter((s) => s.assignedTechnicians.includes(techId))
        .reduce((sum, s) => sum + (s.hours || 0), 0),
    }));

    // Calculate total hours
    const totalHours = todaySchedules.reduce(
      (sum, schedule) => sum + (schedule.hours || 0),
      0,
    );

    // Get current user's name from technicians list
    const currentTech = technicians.find((tech: any) => tech.id === userId);
    const userName = currentTech?.name || "User";

    // Transform the data
    const transformedData = {
      userId,
      name: userName,
      canManage,
      todaySchedules: todaySchedules.map((schedule) => ({
        _id: schedule._id.toString(),
        jobTitle: schedule.jobTitle,
        location: schedule.location,
        startDateTime: schedule.startDateTime,
        hours: schedule.hours,
        confirmed: schedule.confirmed,
        technicians: schedule.assignedTechnicians.map((techId) => ({
          id: techId,
          name: technicianNames.get(techId) || "Unknown",
        })),
      })),
      totalHours,
      employeeHours: canManage ? employeeHours : undefined,
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

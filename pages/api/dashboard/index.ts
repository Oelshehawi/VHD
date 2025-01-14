import { getAuth } from "@clerk/nextjs/server";
import { Schedule, PayrollPeriod } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import { startOfDay, endOfDay } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";
import { clerkClient } from "@clerk/nextjs/server";

// Dashboard API endpoint
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
    const now = new Date();
    const startOfTodayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfTodayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const query = canManage ? {} : { assignedTechnicians: userId };
    const todaySchedules = await Schedule.find({
      ...query,
      startDateTime: {
        $gte: startOfTodayUTC,
        $lt: endOfTodayUTC,
      },
    }).lean();

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

    let currentPayroll = null;
    if (!canManage) {
      // Find current payroll period
      const currentPayrollPeriod = await PayrollPeriod.findOne({
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).lean();

      if (currentPayrollPeriod) {
        // Get all schedules for this user in the period
        const payrollSchedules = await Schedule.find({
          assignedTechnicians: userId,
          startDateTime: {
            $gte: currentPayrollPeriod.startDate,
            $lte: currentPayrollPeriod.endDate,
          },
        })
          .sort({ startDateTime: 1 })
          .lean();

        // Calculate total hours for payroll period
        const payrollHours = payrollSchedules.reduce(
          (sum, schedule) => sum + (schedule.hours || 0),
          0,
        );

        currentPayroll = {
          periodStart: currentPayrollPeriod.startDate,
          periodEnd: currentPayrollPeriod.endDate,
          cutoffDate: currentPayrollPeriod.cutoffDate,
          payDay: currentPayrollPeriod.payDay,
          totalHours: payrollHours,
          schedules: payrollSchedules.map((s) => ({
            _id: s._id.toString(),
            jobTitle: s.jobTitle,
            date: s.startDateTime,
            hours: s.hours,
            location: s.location,
          })),
        };
      }
    }

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
      currentPayroll: !canManage ? currentPayroll : undefined,
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

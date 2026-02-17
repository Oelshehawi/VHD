import { getBatchTravelTimeSummaries } from "./actions/travelTime.actions";
import {
  PayrollDriveMetricsType,
  ScheduleType,
  TechnicianType,
  TravelTimeRequest,
} from "./typeDefinitions";
import {
  compareScheduleDisplayOrder,
  getScheduleDisplayDateKey,
} from "./utils/scheduleDayUtils";

function roundHours(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function buildTechDayKey(techId: string, dateKey: string): string {
  return `${techId}::${dateKey}`;
}

function groupSchedulesByTechDay(
  schedules: ScheduleType[],
): Map<string, ScheduleType[]> {
  const map = new Map<string, ScheduleType[]>();

  for (const schedule of schedules) {
    const dateKey = getScheduleDisplayDateKey(schedule.startDateTime);
    for (const techId of schedule.assignedTechnicians || []) {
      const key = buildTechDayKey(techId, dateKey);
      const jobs = map.get(key) || [];
      jobs.push(schedule);
      map.set(key, jobs);
    }
  }

  for (const [key, jobs] of map.entries()) {
    map.set(
      key,
      [...jobs].sort((a, b) =>
        compareScheduleDisplayOrder(a.startDateTime, b.startDateTime),
      ),
    );
  }

  return map;
}

async function getTravelMinutesByTechnician(
  schedules: ScheduleType[],
  technicians: TechnicianType[],
): Promise<Map<string, number>> {
  const byTechDay = groupSchedulesByTechDay(schedules);
  const depotByTech = new Map(
    technicians.map((technician) => [
      technician.id,
      technician.depotAddress || null,
    ]),
  );

  const requests: TravelTimeRequest[] = [];
  for (const [techDayKey, jobs] of byTechDay.entries()) {
    const splitAt = techDayKey.indexOf("::");
    if (splitAt === -1) continue;

    const technicianId = techDayKey.slice(0, splitAt);
    const dateKey = techDayKey.slice(splitAt + 2);
    if (!technicianId || !dateKey) continue;

    requests.push({
      date: `${dateKey}__${technicianId}`,
      jobs,
      depotAddress: depotByTech.get(technicianId) || null,
    });
  }

  if (requests.length === 0) {
    return new Map();
  }

  const totalsByTech = new Map<string, number>();

  try {
    const summaries = await getBatchTravelTimeSummaries(requests);
    for (const summary of summaries) {
      const dateValue = String(summary.date || "");
      const splitAt = dateValue.indexOf("__");
      if (splitAt === -1) continue;

      const technicianId = dateValue.slice(splitAt + 2);
      if (!technicianId) continue;

      totalsByTech.set(
        technicianId,
        (totalsByTech.get(technicianId) || 0) + summary.totalTravelMinutes,
      );
    }
  } catch (error) {
    console.error("Failed to compute payroll travel summaries:", error);
  }

  return totalsByTech;
}

export async function buildPayrollDriveMetrics(args: {
  schedules: ScheduleType[];
  technicians: TechnicianType[];
}): Promise<PayrollDriveMetricsType> {
  const { schedules, technicians } = args;
  const travelMinutesByTech = await getTravelMinutesByTechnician(
    schedules,
    technicians,
  );

  const techniciansMetrics = technicians.map((technician) => {
    const assignedSchedules = schedules.filter((schedule) =>
      schedule.assignedTechnicians.includes(technician.id),
    );

    const scheduledHoursRaw = assignedSchedules.reduce(
      (sum, schedule) => sum + (Number(schedule.hours) || 0),
      0,
    );

    let actualMinutesRaw = 0;
    const missingActualDurationJobs = assignedSchedules.flatMap((schedule) => {
      const actualDuration = schedule.actualServiceDurationMinutes;
      if (
        typeof actualDuration === "number" &&
        Number.isFinite(actualDuration)
      ) {
        actualMinutesRaw += Math.max(0, actualDuration);
        return [];
      }

      return [
        {
          scheduleId: String(schedule._id),
          jobTitle: schedule.jobTitle?.trim() || "Untitled Job",
          startDateTime: schedule.startDateTime,
        },
      ];
    });

    const driveHoursRaw = (travelMinutesByTech.get(technician.id) || 0) / 60;
    const scheduledHours = roundHours(scheduledHoursRaw);
    const actualHours = roundHours(actualMinutesRaw / 60);
    const driveHours = roundHours(driveHoursRaw);
    const scheduledPlusDriveHours = roundHours(scheduledHours + driveHours);
    const actualPlusDriveHours = roundHours(actualHours + driveHours);
    const actualVsScheduledPlusDriveHours = roundHours(
      actualHours - scheduledPlusDriveHours,
    );

    return {
      technicianId: technician.id,
      technicianName: technician.name,
      totalJobs: assignedSchedules.length,
      scheduledHours,
      actualHours,
      driveHours,
      scheduledPlusDriveHours,
      actualPlusDriveHours,
      actualVsScheduledPlusDriveHours,
      hasDepotAddress:
        typeof technician.depotAddress === "string" &&
        technician.depotAddress.trim().length > 0,
      missingActualDurationJobs,
    };
  });

  const totals = techniciansMetrics.reduce(
    (acc, technician) => {
      acc.totalJobs += technician.totalJobs;
      acc.totalScheduledHours += technician.scheduledHours;
      acc.totalActualHours += technician.actualHours;
      acc.totalDriveHours += technician.driveHours;
      acc.totalScheduledPlusDriveHours += technician.scheduledPlusDriveHours;
      acc.totalActualPlusDriveHours += technician.actualPlusDriveHours;
      acc.totalMissingActualDurationJobs +=
        technician.missingActualDurationJobs.length;
      return acc;
    },
    {
      totalJobs: 0,
      totalScheduledHours: 0,
      totalActualHours: 0,
      totalDriveHours: 0,
      totalScheduledPlusDriveHours: 0,
      totalActualPlusDriveHours: 0,
      totalMissingActualDurationJobs: 0,
    },
  );

  const totalActualVsScheduledPlusDriveHours = roundHours(
    totals.totalActualHours - totals.totalScheduledPlusDriveHours,
  );

  return {
    totalJobs: totals.totalJobs,
    totalScheduledHours: roundHours(totals.totalScheduledHours),
    totalActualHours: roundHours(totals.totalActualHours),
    totalDriveHours: roundHours(totals.totalDriveHours),
    totalScheduledPlusDriveHours: roundHours(
      totals.totalScheduledPlusDriveHours,
    ),
    totalActualPlusDriveHours: roundHours(totals.totalActualPlusDriveHours),
    totalActualVsScheduledPlusDriveHours,
    totalMissingActualDurationJobs: totals.totalMissingActualDurationJobs,
    technicians: techniciansMetrics,
  };
}

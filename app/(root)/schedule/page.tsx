import {
  fetchHolidays,
  fetchTechnicianAvailability,
  fetchTimeOffRequests,
} from "../../lib/data";
import { fetchAllScheduledJobsWithShifts } from "../../lib/scheduleAndShifts";
import { auth } from "@clerk/nextjs/server";
import {
  ScheduleType,
  TimeOffRequestType,
} from "../../../app/lib/typeDefinitions";
import CalendarOptions from "../../../_components/schedule/CalendarOptions";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";

const Schedule = async ({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    date?: string;
  }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams?.view || "week";
  const date = resolvedSearchParams?.date || null;

  const parseDateOnlyToUTC = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const datePart = dateString.split("T")[0] || dateString;
    const [yearStr, monthStr, dayStr] = datePart.split("-");
    if (!yearStr || !monthStr || !dayStr) return undefined;

    const year = Number.parseInt(yearStr, 10);
    const monthIndex = Number.parseInt(monthStr, 10) - 1;
    const day = Number.parseInt(dayStr, 10);

    const isValidNumber =
      Number.isFinite(year) &&
      Number.isFinite(monthIndex) &&
      Number.isFinite(day);
    const isValidRange =
      monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31;
    if (!isValidNumber || !isValidRange) return undefined;

    const parsed = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== monthIndex ||
      parsed.getUTCDate() !== day
    )
      return undefined;

    return parsed;
  };

  // Calculate date range for fetching specific to the current view
  let rangeStart: Date | undefined;
  let rangeEnd: Date | undefined;

  const now = new Date();
  const fallbackDate = new Date(
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
  const targetDate = parseDateOnlyToUTC(date || undefined) || fallbackDate;

  // Fetch a wider range for smoother navigation: 2 weeks back, 2 months forward.
  rangeStart = new Date(targetDate);
  rangeStart.setUTCDate(targetDate.getUTCDate() - 14);
  rangeStart.setUTCHours(0, 0, 0, 0);

  rangeEnd = new Date(targetDate);
  rangeEnd.setUTCMonth(targetDate.getUTCMonth() + 2);
  rangeEnd.setUTCHours(23, 59, 59, 999);

  // Fetch all data in parallel for better performance
  // Invoices are now lazy-loaded in AddJob modal via TanStack Query
  const [
    scheduledJobsResult,
    holidays,
    availability,
    authResult,
    technicians,
    timeOffRequests,
  ] = await Promise.all([
    fetchAllScheduledJobsWithShifts(rangeStart, rangeEnd),
    fetchHolidays(),
    fetchTechnicianAvailability(),
    auth(),
    getTechnicians(),
    fetchTimeOffRequests("approved"),
  ]);

  let scheduledJobs: ScheduleType[] = scheduledJobsResult;
  const { sessionClaims, userId }: any = authResult;
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (!canManage) {
    scheduledJobs = scheduledJobs.filter((job) =>
      job.assignedTechnicians.includes(userId),
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-gray-50">
      <div className="min-w-0 flex-1">
        <CalendarOptions
          scheduledJobs={scheduledJobs}
          canManage={canManage}
          holidays={holidays}
          technicians={technicians}
          availability={availability}
          timeOffRequests={timeOffRequests}
          initialView={view}
          initialDate={date}
          initialRangeStart={rangeStart.toISOString()}
          initialRangeEnd={rangeEnd.toISOString()}
        />
      </div>
    </div>
  );
};

export default Schedule;

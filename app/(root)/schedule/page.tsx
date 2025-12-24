import { fetchHolidays, fetchTechnicianAvailability } from "../../lib/data";
import { fetchAllScheduledJobsWithShifts } from "../../lib/scheduleAndShifts";
import { auth } from "@clerk/nextjs/server";
import { ScheduleType } from "../../../app/lib/typeDefinitions";
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

  // Fetch all data in parallel for better performance
  // Invoices are now lazy-loaded in AddJob modal via TanStack Query
  const [scheduledJobsResult, holidays, availability, authResult, technicians] =
    await Promise.all([
      fetchAllScheduledJobsWithShifts(),
      fetchHolidays(),
      fetchTechnicianAvailability(),
      auth(),
      getTechnicians(),
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
          initialView={view}
          initialDate={date}
        />
      </div>
    </div>
  );
};

export default Schedule;

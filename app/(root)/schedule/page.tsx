import {
  fetchAllInvoices,
  fetchHolidays,
  fetchTechnicianAvailability,
} from "../../lib/data";
import { fetchAllScheduledJobsWithShifts } from "../../lib/scheduleAndShifts";
import { auth } from "@clerk/nextjs/server";
import {
  InvoiceType,
  ScheduleType,
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

  // Fetch all data in parallel for better performance
  const [
    invoicesResult,
    scheduledJobsResult,
    holidays,
    availability,
    authResult,
    technicians,
  ] = await Promise.all([
    fetchAllInvoices(),
    fetchAllScheduledJobsWithShifts(),
    fetchHolidays(),
    fetchTechnicianAvailability(),
    auth(),
    getTechnicians(),
  ]);

  const invoices: InvoiceType[] = invoicesResult ?? [];
  let scheduledJobs: ScheduleType[] = scheduledJobsResult;
  const { sessionClaims, userId }: any = authResult;
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (!canManage) {
    scheduledJobs = scheduledJobs.filter((job) =>
      job.assignedTechnicians.includes(userId),
    );
  }

  const sortedInvoices = invoices.sort((a, b) => {
    const dateComparison =
      new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime();
    if (dateComparison !== 0) return dateComparison;

    return a.clientId.toString().localeCompare(b.clientId.toString());
  });

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 min-w-0">
      <div className="flex-1 min-w-0">
        <CalendarOptions
          invoices={sortedInvoices}
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

import { fetchAllInvoices, fetchHolidays, fetchTechnicianAvailability } from "../../lib/data";
import { fetchAllScheduledJobsWithShifts } from "../../lib/scheduleAndShifts";
import { auth } from "@clerk/nextjs/server";
import {
  InvoiceType,
  ScheduleType,
  TechnicianType,
  AvailabilityType,
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
  const invoices: InvoiceType[] = (await fetchAllInvoices()) ?? [];
  let scheduledJobs: ScheduleType[] = await fetchAllScheduledJobsWithShifts();
  const holidays = await fetchHolidays();
  const availability: AvailabilityType[] = await fetchTechnicianAvailability();
  const { sessionClaims, userId }: any = await auth();
  const canManage = (sessionClaims as any)?.isManager?.isManager === true ? true : false;
  const technicians: TechnicianType[] = await getTechnicians();

  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams?.view || "week";
  const date = resolvedSearchParams?.date || null;

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
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <div className="flex-1">
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

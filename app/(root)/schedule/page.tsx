import { fetchAllInvoices, fetchHolidays } from "../../lib/data";
import { fetchAllScheduledJobsWithShifts } from "../../lib/scheduleAndShifts";
import { auth } from "@clerk/nextjs/server";
import {
  InvoiceType,
  ScheduleType,
  TechnicianType,
} from "../../../app/lib/typeDefinitions";
import CalendarOptions from "../../../_components/schedule/CalendarOptions";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";

const Schedule = async () => {
  const invoices: InvoiceType[] = (await fetchAllInvoices()) ?? [];
  let scheduledJobs: ScheduleType[] = await fetchAllScheduledJobsWithShifts();
  const holidays = await fetchHolidays();
  const { orgPermissions, userId }: any = await auth();
  const canManage = orgPermissions?.includes("org:database:allow");
  const technicians: TechnicianType[] = await getTechnicians();

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

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
        />
      </div>
    </div>
  );
};

export default Schedule;

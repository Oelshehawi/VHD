import {
  fetchAllInvoices,
  fetchHolidays,
} from "../../lib/data";
import { fetchAllScheduledJobsWithShifts } from "../../lib/scheduleAndShifts";
import { auth } from "@clerk/nextjs/server";
import { InvoiceType, ScheduleType } from "../../../app/lib/typeDefinitions";
import CalendarOptions from "../../../_components/schedule/CalendarOptions";
import { getTechnicians } from "../../lib/actions/scheduleJobs.actions";

const Schedule = async () => {
  const invoices: InvoiceType[] = (await fetchAllInvoices()) ?? [];
  let scheduledJobs: ScheduleType[] = await fetchAllScheduledJobsWithShifts();
  const holidays = await fetchHolidays();
  const { has, userId }: any = auth();
  const canManage = has({ permission: "org:database:allow" });
  const technicians = await getTechnicians();

  if (!canManage) {
    scheduledJobs = scheduledJobs.filter((job) =>
      job.assignedTechnicians.includes(userId),
    );
  }

  const sortedInvoices = invoices.sort(
    (a, b) =>
      new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime(),
  );

  const groupedSortedInvoices = sortedInvoices.sort((a, b) => {
    const clientIdA = a.clientId.toString();
    const clientIdB = b.clientId.toString();
    if (clientIdA === clientIdB) {
      return 0;
    }
    return clientIdA.localeCompare(clientIdB);
  });

  return (
    <CalendarOptions
      invoices={groupedSortedInvoices}
      scheduledJobs={scheduledJobs}
      canManage={canManage}
      holidays={holidays}
      technicians={technicians}
    />
  );
};

export default Schedule;

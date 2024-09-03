import { fetchAllInvoices, fetchAllScheduledJobs } from "../../lib/data";
import { auth } from "@clerk/nextjs/server";
import MiniCalendar from "../../../_components/schedule/MiniCalendar";
import FullCalendar from "../../../_components/schedule/FullCalendar";
import SearchSelect from "../../../_components/schedule/JobSearchSelect";
import { InvoiceType, ScheduleType } from "../../../app/lib/typeDefinitions";
import Link from "next/link";
import CalendarOptions from "../../../_components/schedule/CalendarOptions";

const Schedule = async () => {
  const invoices: InvoiceType[] = (await fetchAllInvoices()) ?? [];
  const scheduledJobs: ScheduleType[] = await fetchAllScheduledJobs();
  const { has } = auth();
  const canManage = has({ permission: "org:database:allow" });

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
   <CalendarOptions invoices={groupedSortedInvoices} scheduledJobs={scheduledJobs} canManage={canManage} />
  );
};


export default Schedule;

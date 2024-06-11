import Calendar from "../../../_components/schedule/Calendar";
import { fetchAllInvoices, fetchAllScheduledJobs } from "../../lib/data";
import { InvoiceType, ScheduleType } from "../../lib/typeDefinitions";

const Schedule = async () => {
  const invoices: InvoiceType[] = await fetchAllInvoices();
  const scheduledJobs: ScheduleType[] = await fetchAllScheduledJobs();

  const sortedInvoices = invoices.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());

  // Stable sort to group by clientId
  const groupedSortedInvoices = sortedInvoices.sort((a, b) => {
    const clientIdA = a.clientId.toString();
    const clientIdB = b.clientId.toString();
    if (clientIdA === clientIdB) {
      return 0;
    }
    return clientIdA.localeCompare(clientIdB);
  });

  return (
    <div className="flex min-h-[100vh] items-center justify-center p-4">
      <div className="w-full rounded-xl border-2 border-black p-2 pt-0 shadow-2xl md:w-[50%]">
        <Calendar
          invoices={groupedSortedInvoices}
          scheduledJobs={scheduledJobs}
        />
      </div>
    </div>
  );
};

export default Schedule;

import Calendar from "../../../_components/schedule/Calendar";
import { fetchAllInvoices, fetchAllScheduledJobs } from "../../lib/data";
import { InvoiceType, ScheduleType } from "../../lib/typeDefinitions";

const Schedule = async () => {
  const invoices: InvoiceType[] = await fetchAllInvoices();
  const scheduledJobs: ScheduleType[] = await fetchAllScheduledJobs();

  return (
    <div className="flex min-h-[100vh] items-center justify-center p-4">
      <div className="w-full rounded-xl border-2 border-black p-2 pt-0 shadow-2xl md:w-[50%]">
        <Calendar invoices={invoices} scheduledJobs={scheduledJobs} />
      </div>
    </div>
  );


};

export default Schedule;

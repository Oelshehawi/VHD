import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import InvoiceRow from "./InvoiceRow";
import CustomSelect from "./CustomSelect";
import {
  checkScheduleStatus,
  getScheduledCount,
  getUnscheduledCount,
  fetchDueInvoices,
} from "../../app/lib/dashboard.data";
import { FaCalendarAlt } from "react-icons/fa";
import ScheduledJobsBox from "./ScheduledJobsBox";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";

// Helper function to serialize objects (convert to plain objects)
const serializeData = <T,>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

const JobsDueContainer = async ({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => 2024 + i);

  const month = searchParams.month || months[new Date().getMonth()];
  const year = searchParams.year || currentYear;

  // Add type safety for result
  const result: { month: string; year: number } = {
    month: month || "",
    year: typeof year === "string" ? parseInt(year) : year,
  };

  // Fetch all due invoices and check their schedule status
  const dueInvoices = await fetchDueInvoices(result);
  const invoicesWithSchedule = await checkScheduleStatus(dueInvoices);

  // Add type safety
  if (!Array.isArray(invoicesWithSchedule)) {
    return (
      <div className="flex h-[50vh] w-full flex-col rounded-lg border bg-white p-4 shadow-lg">
        <p className="text-center text-gray-500">Error loading jobs</p>
      </div>
    );
  }

  // Get total counts with safety checks
  const totalDue = invoicesWithSchedule?.length || 0;
  const invoiceIds =
    invoicesWithSchedule?.map((invoice) => invoice.invoiceId) || [];
  const scheduledCount = (await getScheduledCount(invoiceIds)) || 0;
  const unscheduledCount = (await getUnscheduledCount(invoiceIds)) || 0;

  // Filter for display based on isScheduled - default to showing unscheduled
  const displayInvoices = invoicesWithSchedule.filter((invoice) =>
    searchParams.scheduled === "true"
      ? invoice?.isScheduled
      : !invoice?.isScheduled,
  );

  // Get scheduled invoices for the modal
  const scheduledInvoices = invoicesWithSchedule.filter(
    (invoice) => invoice?.isScheduled,
  );

  // Ensure we're passing serialized data to client components
  const serializedScheduledInvoices = serializeData(scheduledInvoices);

  return (
    <div className="flex h-[50vh] w-full flex-col rounded-lg border bg-white p-4 shadow-lg transition-all hover:shadow-xl lg:h-[70vh] lg:w-[50%]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="h-5 w-5 text-darkGreen" />
          <h2 className="text-lg font-bold text-gray-800">Jobs Due</h2>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-darkGreen font-bold text-white">
          {totalDue}
        </div>
      </div>

      {/* Client component for scheduled/unscheduled count boxes and modal */}
      <ScheduledJobsBox
        scheduledCount={scheduledCount}
        unscheduledCount={unscheduledCount}
        scheduledInvoices={serializedScheduledInvoices}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <CustomSelect
          values={months}
          currentValue={month}
          urlName="month"
          searchParams={searchParams}
        />
        <CustomSelect
          values={years}
          currentValue={year}
          urlName="year"
          searchParams={searchParams}
        />
      </div>

      <div className="flex-grow overflow-hidden rounded-lg border">
        <div className="max-h-full overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Job
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Due
                </th>
                <th className="hidden whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-600 md:table-cell">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayInvoices.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-500"
                    colSpan={4}
                  >
                    No jobs due this month
                  </td>
                </tr>
              ) : (
                displayInvoices.map((invoice) => (
                  <InvoiceRow key={invoice.invoiceId} invoiceData={invoice} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobsDueContainer;

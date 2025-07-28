import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import InvoiceRow from "./InvoiceRow";
import CustomSelect from "./CustomSelect";
import {
  checkScheduleStatus,
  getScheduledCount,
  getUnscheduledCount,
  fetchDueInvoices,
} from "../../app/lib/dashboard.data";
import { FaCalendarAlt, FaFilter, FaClock } from "react-icons/fa";
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
      <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <FaClock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium text-gray-500">Error loading jobs</p>
            <p className="text-sm text-gray-400">Please try again later</p>
          </div>
        </div>
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
    searchParams?.scheduled === "true"
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
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-gray-200 p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-darkGreen to-green-600 shadow-lg">
            <FaCalendarAlt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Jobs Due</h2>
            <p className="text-sm text-gray-600">Track and manage upcoming jobs</p>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-darkGreen to-green-600 font-bold text-white shadow-lg">
          {totalDue}
        </div>
      </div>

      {/* Status Cards */}
      <div className="px-6 pt-4">
        <ScheduledJobsBox
          scheduledCount={scheduledCount}
          unscheduledCount={unscheduledCount}
          scheduledInvoices={serializedScheduledInvoices}
        />
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-2 px-6 z-20 py-4">
        <FaFilter className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 mr-2">Filter by:</span>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Table Section */}
      <div className="flex-grow overflow-hidden px-6 pb-6">
        <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <div className="h-full overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>Job</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <FaClock className="h-3 w-3" />
                      <span>Due Date</span>
                    </div>
                  </th>
                  <th className="hidden px-4 py-4 text-center text-sm font-semibold text-gray-700 md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {displayInvoices.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center" colSpan={4}>
                      <div className="flex flex-col items-center justify-center">
                        <FaClock className="mb-4 h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No jobs due this month</p>
                        <p className="text-sm text-gray-400 mt-1">Check back later or adjust your filters</p>
                      </div>
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
    </div>
  );
};

export default JobsDueContainer;

import { fetchAllInvoices, fetchAllScheduledJobs, fetchFilteredScheduledJobs } from "../../lib/data";
import { auth } from "@clerk/nextjs/server";
import MiniCalendar from "../../../_components/schedule/MiniCalendar";
import FullCalendar from "../../../_components/schedule/FullCalendar";
import SearchSelect from "../../../_components/schedule/JobSearchSelect";
import { InvoiceType, ScheduleType } from "../../../app/lib/typeDefinitions";
import Link from "next/link";

const Schedule = async ({
  searchParams,
}: {
  searchParams: {
    calendarOption: string;
    query: string;
  };
}) => {
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

  const calendarOption = searchParams?.calendarOption ?? "full";

  const query = searchParams?.query || "";

  return (
    <>
      <Header query={query} calendarOption={calendarOption} />
      {calendarOption === "mini" ? (
        <div className="flex min-h-[90vh] items-center justify-center p-4">
          <div className="w-full rounded-xl border-2 border-black p-2 pt-0 shadow-2xl md:w-[50%]">
            <MiniCalendar
              invoices={groupedSortedInvoices}
              scheduledJobs={scheduledJobs}
              canManage={canManage}
            />
          </div>
        </div>
      ) : (
        <FullCalendar
          invoices={groupedSortedInvoices}
          scheduledJobs={scheduledJobs}
          canManage={canManage}
        />
      )}
    </>
  );
};

const Header = async ({
  calendarOption,
  query,
}: {
  calendarOption: string;
  query: string;
}) => {
  const nextCalendarOption = calendarOption === "full" ? "mini" : "full";
  const buttonLabel =
    calendarOption === "full" ? "Show Mini Calendar" : "Show Full Calendar";

  const filteredJobs = await fetchFilteredScheduledJobs(query);

  return (
    <div className="shadow-custom flex flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between md:gap-0 md:py-0">
      <SearchSelect data={filteredJobs} placeholder="Search for a job" />
      <Link
        href={`?calendarOption=${nextCalendarOption}`}
        className={`flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 transition-colors duration-300 ${
          calendarOption === "full"
            ? "bg-darkGreen text-white"
            : "border-darkGreen bg-white text-darkGreen"
        }`}
      >
        <span>{buttonLabel}</span>
      </Link>
    </div>
  );
};

export default Schedule;

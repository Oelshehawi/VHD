import { DashboardSearchParams, DueInvoiceType } from "../../app/lib/typeDefinitions";
import InvoiceRow from "./InvoiceRow";
import CustomSelect from "./CustomSelect";
import { fetchDueInvoices } from "../../app/lib/data";



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

  const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];

  const month = searchParams.month || months[new Date().getMonth()];
  const year = searchParams.year || new Date().getFullYear();

  const result = {
    month: month,
    year: year,
  };

  const dueInvoices = await fetchDueInvoices(result);

  const count = dueInvoices.length;

  return (
    <div className="mb-5 flex h-[50vh] w-full flex-col rounded-lg border bg-white md:p-4 lg:mb-0 lg:ml-5 lg:h-[70vh] lg:w-3/4">
      <SelectBoxes
        years={years}
        month={month}
        year={year}
        months={months}
        searchParams={searchParams}
        count={count}
      />
      <div className="flex-grow overflow-auto rounded-lg shadow-md">
        <table className="w-full table-fixed">
          <thead className="sticky top-0">
            <tr className="bg-gray-100">
              <th className="w-1/4 px-6 py-4 text-left font-bold uppercase text-gray-600">
                Job Name
              </th>
              <th className="w-1/4 px-6 py-4 text-left font-bold uppercase text-gray-600">
                Due Date
              </th>
              <th className="hidden w-1/4 px-6 py-4 text-left font-bold uppercase text-gray-600 md:block">
                Scheduled?
              </th>
              <th className="w-1/4 px-6 py-4 text-left font-bold uppercase text-gray-600">
                Send Email?
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {dueInvoices.length === 0 ? (
              <tr>
                <td
                  className="border-b border-gray-200 px-3 py-4 text-center"
                  colSpan={4}
                >
                  No invoices due this month
                </td>
              </tr>
            ) : (
              dueInvoices.map((invoice: DueInvoiceType) => (
                <InvoiceRow key={invoice.invoiceId} invoiceData={invoice} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SelectBoxes = ({
  searchParams,
  months,
  years,
  month,
  year,
  count,
}: {
  searchParams: DashboardSearchParams;
  months: string[];
  years: number[];
  month: string | undefined;
  year: string | number;
  count: number;
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <CustomSelect
        values={months}
        currentValue={month}
        urlName="month"
        searchParams={searchParams}
      />
      <div className="flex size-10 items-center justify-center rounded-xl bg-darkGreen font-bold text-white">
        {count}
      </div>
      <CustomSelect
        values={years}
        currentValue={year}
        urlName="year"
        searchParams={searchParams}
      />
    </div>
  );
};

export default JobsDueContainer;

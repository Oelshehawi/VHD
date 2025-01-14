import Link from "next/link";
import { FaPenSquare } from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import { fetchFilteredInvoices } from "../../app/lib/data";
import { InvoiceType } from "../../app/lib/typeDefinitions";

const InvoiceTable = async ({
  query,
  currentPage,
  filter,
  sort,
}: {
  query: string;
  currentPage: number;
  filter: string;
  sort: string;
}) => {
  const invoiceData = await fetchFilteredInvoices(
    query,
    currentPage,
    filter,
    sort,
  );

  if (!invoiceData.length) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded bg-darkGreen/90">
        <p className="text-xl font-semibold text-white">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-borderGreen bg-darkGreen/10 shadow-lg">
      <div className="flex flex-col overflow-hidden rounded-lg">
        <div className="flex-grow overflow-auto">
          <table className="relative w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-darkGreen text-white">
                <th className="whitespace-nowrap px-4 py-3.5 text-left font-semibold">
                  Invoice #
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-left font-semibold">
                  Job Title
                </th>
                <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                  Issued Date
                </th>
                <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                  Status
                </th>
                <th className="hidden whitespace-nowrap px-4 py-3.5 text-left font-semibold md:table-cell">
                  Amount
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkGreen/20">
              {invoiceData.map((invoice: InvoiceType, index: number) => {
                const subtotal = invoice.items.reduce(
                  (total, item) => total + item.price,
                  0,
                );
                const tax = subtotal * 0.05;
                const totalAmount = (subtotal + tax).toFixed(2);

                return (
                  <tr
                    key={invoice._id as string}
                    className={`bg-darkGreen/70 transition-colors hover:bg-darkGreen/90 ${
                      index === invoiceData.length - 1 ? "h-full" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-white">
                      <div className="font-medium">{invoice.invoiceId}</div>
                    </td>
                    <td className="px-4 py-3 text-white">
                      <div className="font-medium">{invoice.jobTitle}</div>
                      <div className="space-y-1 md:hidden">
                        <div className="text-gray-200">
                          {new Date(invoice.dateIssued).toLocaleDateString(
                            "en-CA",
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              invoice.status === "paid"
                                ? "bg-green-600/20 text-green-300"
                                : invoice.status === "pending"
                                  ? "bg-yellow-600/20 text-yellow-300"
                                  : "bg-red-600/20 text-red-300"
                            }`}
                          >
                            {invoice.status.toUpperCase()}
                          </div>
                          <span className="text-gray-200">${totalAmount}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-white md:table-cell">
                      {new Date(invoice.dateIssued).toLocaleDateString("en-CA")}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          invoice.status === "paid"
                            ? "bg-green-600/20 text-green-300"
                            : invoice.status === "pending"
                              ? "bg-yellow-600/20 text-yellow-300"
                              : "bg-red-600/20 text-red-300"
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-white md:table-cell">
                      ${totalAmount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/invoices/${invoice._id}`}
                          className="transition-transform hover:scale-105"
                        >
                          <FaPenSquare className="size-8 rounded bg-green-600 p-1.5 text-white hover:bg-green-700" />
                        </Link>
                        <div className="hidden md:block">
                          <DeleteModal
                            deleteText="Are you sure you want to delete this invoice?"
                            deleteDesc="This action cannot be undone!"
                            deletionId={invoice._id.toString()}
                            deletingValue="invoice"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoiceData.length < 10 && (
                <tr className="h-full bg-darkGreen/70">
                  <td className="px-4 py-3" colSpan={6}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;

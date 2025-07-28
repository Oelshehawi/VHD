import Link from "next/link";
import { FaPenSquare, FaFileInvoice, FaTrash } from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import { fetchFilteredInvoices } from "../../app/lib/data";
import { InvoiceType } from "../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../app/lib/utils";

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
      <div className="flex min-h-[70vh] items-center justify-center rounded-xl bg-darkGray border border-borderGreen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-darkGreen flex items-center justify-center border border-borderGreen">
            <FaFileInvoice className="h-8 w-8 text-lightGray" />
          </div>
          <p className="text-xl font-semibold text-white mb-2">No invoices found</p>
          <p className="text-lightGray">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-borderGreen bg-darkGreen shadow-lg">
      {/* Table Container */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-darkBlue border-b border-borderGreen">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Invoice #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Job Title
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Issued Date
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Status
              </th>
              <th className="hidden px-6 py-4 text-left text-sm font-semibold text-white md:table-cell">
                Amount
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderGreen">
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
                  className="bg-darkGreen/70 transition-all duration-200 hover:bg-darkGreen"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{invoice.invoiceId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white mb-1">{invoice.jobTitle}</div>
                      <div className="md:hidden space-y-2">
                        <div className="text-sm text-lightGray">
                          {formatDateStringUTC(invoice.dateIssued as string)}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium border ${
                              invoice.status === "paid"
                                ? "bg-darkGreen border-green-400 text-green-300"
                                : invoice.status === "pending"
                                  ? "bg-darkBlue border-yellow-400 text-yellow-300"
                                  : "bg-red-900/50 border-red-400 text-red-300"
                            }`}
                          >
                            {invoice.status.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-white">${totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-lightGray md:table-cell">
                    {formatDateStringUTC(invoice.dateIssued as string)}
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium border ${
                        invoice.status === "paid"
                          ? "bg-darkGreen border-green-400 text-green-300"
                          : invoice.status === "pending"
                            ? "bg-darkBlue border-yellow-400 text-yellow-300"
                            : "bg-red-900/50 border-red-400 text-red-300"
                      }`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-sm font-semibold text-white md:table-cell">
                    ${totalAmount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href={`/invoices/${invoice._id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-darkBlue border border-borderGreen text-lightGray transition-all duration-200 hover:bg-darkGreen hover:scale-110"
                        title="Edit Invoice"
                      >
                        <FaPenSquare className="h-4 w-4" />
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;

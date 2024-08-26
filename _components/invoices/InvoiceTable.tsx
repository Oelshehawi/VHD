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

  return (
    <div>
      <div className="max-h-[70vh] min-h-[70vh] overflow-auto rounded">
        <table className="w-full text-left ">
          <thead className="bg-darkGreen text-white">
            <tr className="">
              <th className="px-3.5 py-3 capitalize">Invoice #</th>
              <th className="px-3.5 py-3 capitalize">Job Title</th>
              <th className="hidden px-3.5 py-3 capitalize md:table-cell">
                Issued Date
              </th>
              <th className="hidden px-3.5 py-3 capitalize md:table-cell">
                Status
              </th>
              <th className="hidden px-3.5 py-3 capitalize md:table-cell">
                Amount
              </th>
              <th className="px-3.5 py-3 capitalize">Edit Invoice</th>
              <th className="hidden px-3.5 py-3 capitalize md:table-cell">
                Delete Invoice
              </th>
            </tr>
          </thead>
          <tbody className="rounded font-bold">
            {invoiceData.map((invoice: InvoiceType) => (
              <tr
                key={invoice._id as string}
                className="bg-borderGreen text-white"
              >
                <td className="px-3.5 py-2.5 ">{invoice.invoiceId}</td>
                <td className="px-3.5 py-2.5">{invoice.jobTitle}</td>
                <td className="hidden px-3.5 py-2.5 md:table-cell">
                  {new Date(invoice.dateIssued).toLocaleDateString("en-CA")}
                </td>
                <td className="hidden px-3.5 py-2.5 md:table-cell">
                  <div
                    className={`flex items-center justify-center rounded-lg font-bold ${
                      invoice.status === "paid"
                        ? "bg-green-500 text-white"
                        : invoice.status === "pending"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                    }`}
                  >
                    {invoice.status.toUpperCase()}
                  </div>
                </td>
                <td className="hidden px-3.5 py-2.5 md:table-cell">
                  $
                  {invoice.items
                    .reduce((total, item) => total + item.price, 0)
                    .toFixed(2)}
                </td>
                <td className="flex justify-center px-3.5 py-2.5">
                  <Link href={`/invoices/${invoice._id}`}>
                    <FaPenSquare className="size-8 rounded bg-darkGreen text-white hover:bg-green-800" />
                  </Link>
                </td>
                <td className="hidden px-3.5 py-2.5 md:table-cell">
                  <DeleteModal
                    deleteText={"Are you sure you want to delete this invoice?"}
                    deleteDesc={"This action cannot be undone!"}
                    deletionId={invoice._id.toString()}
                    deletingValue="invoice"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;

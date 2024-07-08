import { auth } from "@clerk/nextjs/server";
import AddInvoice from "../../../_components/invoices/AddInvoice";
import InvoiceTable from "../../../_components/invoices/InvoiceTable";
import { fetchAllClients, fetchInvoicesPages } from "../../lib/data";
import Search from "../../../_components/database/Search";
import Pagination from "../../../_components/database/Pagination";
import InvoiceSorting from "../../../_components/invoices/InvoiceSorting";
import { ClientType } from "../../lib/typeDefinitions";

const Invoice = async ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    statusFilter?: string;
  };
}) => {
  const clients = (await fetchAllClients()) as ClientType[];

  const { has } = auth();
  const canManage = has({ permission: "org:database:allow" });

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const statusFilter = searchParams?.statusFilter || "";

  const totalPages = await fetchInvoicesPages(query, statusFilter);
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="my-5 min-h-[90vh] w-[90%] rounded-lg bg-white p-4 shadow-lg lg:my-0 lg:w-4/5">
        <AddInvoice clients={clients} />
        <div className="">
          <div className="flex flex-col justify-between md:flex-row lg:gap-4 ">
            <Search placeholder="Search For Invoice..." />
            <InvoiceSorting />
          </div>
          <InvoiceTable
            query={query}
            currentPage={currentPage}
            statusFilter={statusFilter}
          />
        </div>
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
};

export default Invoice;

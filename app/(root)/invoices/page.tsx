import { auth } from "@clerk/nextjs/server";
import AddInvoice from "../../../_components/invoices/AddInvoice";
import InvoiceTable from "../../../_components/invoices/InvoiceTable";
import { fetchAllClients, fetchInvoicesPages } from "../../lib/data";
import Search from "../../../_components/database/Search";
import Pagination from "../../../_components/database/Pagination";
import InvoiceSorting from "../../../_components/invoices/InvoiceSorting";
import { ClientType } from "../../lib/typeDefinitions";
import { Suspense } from "react";
import { TableContainerSkeleton } from "../../../_components/Skeletons";

const Invoice = async ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    filter?: string;
    sort?: string;
  };
}) => {
  const clients = (await fetchAllClients()) as ClientType[];

  const { sessionClaims } = await auth();
  const canManage = (sessionClaims as any)?.isManager?.isManager === true ? true : false;
  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const filter = searchParams?.filter || "";
  const sort = searchParams?.sort || "";

  const totalPages = await fetchInvoicesPages(query, filter, sort);
  return (
    <Suspense fallback={<TableContainerSkeleton />}>
      <div className="flex min-h-full items-center justify-center">
        <div className="my-5 flex min-h-[90vh] w-[90%] flex-col gap-4 rounded-lg bg-white p-4 shadow-lg lg:my-0 lg:w-4/5">
          <AddInvoice clients={clients} />
          <div className="">
            <div className="flex flex-col justify-between md:flex-row lg:gap-4 ">
              <Search placeholder="Search For Invoice..." />
              <InvoiceSorting />
            </div>
            <InvoiceTable
              query={query}
              currentPage={currentPage}
              filter={filter}
              sort={sort}
            />
          </div>
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </Suspense>
  );
};

export default Invoice;

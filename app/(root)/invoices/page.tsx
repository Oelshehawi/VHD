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
import { Card, CardContent } from "../../../_components/ui/card";

const Invoice = async ({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    page?: string;
    filter?: string;
    sort?: string;
  }>;
}) => {
  const clients = (await fetchAllClients()) as ClientType[];

  const { sessionClaims } = await auth();
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;
  if (!canManage)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="mx-4 max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="bg-destructive/10 border-destructive/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
                <svg
                  className="text-destructive h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-foreground mb-2 text-2xl font-bold">
                Access Denied
              </h2>
              <p className="text-muted-foreground">
                You don&apos;t have the required permissions to access this
                page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.query || "";
  const currentPage = Number(resolvedSearchParams?.page) || 1;
  const filter = resolvedSearchParams?.filter || "";
  const sort = resolvedSearchParams?.sort || "";

  const totalPages = await fetchInvoicesPages(query, filter, sort);
  return (
    <Suspense fallback={<TableContainerSkeleton />}>
      <div className="flex items-center justify-center">
        <Card className="flex w-full max-w-7xl flex-col gap-8 p-8">
          <AddInvoice clients={clients} />
          <div className="flex-1 space-y-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row lg:gap-8">
              <Search placeholder="Search For Invoice..." />
              <InvoiceSorting />
            </div>
            <div className="min-w-0 flex-1">
              <InvoiceTable
                query={query}
                currentPage={currentPage}
                filter={filter}
                sort={sort}
              />
            </div>
          </div>
          <Pagination totalPages={totalPages} />
        </Card>
      </div>
    </Suspense>
  );
};

export default Invoice;

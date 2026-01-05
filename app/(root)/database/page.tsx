import { fetchClientsPages } from "../../lib/data";
import { auth } from "@clerk/nextjs/server";
import AddClient from "../../../_components/database/AddClient";
import ClientTable from "../../../_components/database/ClientTable";
import Search from "../../../_components/database/Search";
import Sorting from "../../../_components/database/Sorting";
import Pagination from "../../../_components/database/Pagination";
import { Suspense } from "react";
import { TableContainerSkeleton } from "../../../_components/Skeletons";
import { Card, CardContent } from "../../../_components/ui/card";

const Database = async ({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; sort?: 1 | -1 }>;
}) => {
  // AUTH STUFF
  const { sessionClaims } = await auth();
  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (!canManage)
    return (
      <div className="bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
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
  const sort = resolvedSearchParams?.sort || 1;
  const currentPage = Number(resolvedSearchParams?.page) || 1;

  const totalPages = await fetchClientsPages(query);

  return (
    <Suspense fallback={<TableContainerSkeleton />}>
      <div className="bg-background flex h-full min-h-0">
        <Card className="flex min-h-0 w-full flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <AddClient />
          <div className="flex min-h-0 flex-1 flex-col space-y-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1">
                <Search placeholder="Search For Client..." />
              </div>
              <div className="w-full md:w-48">
                <Sorting />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ClientTable
                query={query}
                sort={sort}
                currentPage={currentPage}
              />
            </div>
          </div>
          <Pagination totalPages={totalPages} />
        </Card>
      </div>
    </Suspense>
  );
};

export default Database;

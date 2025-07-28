import { fetchClientsPages } from "../../lib/data";
import { auth } from "@clerk/nextjs/server";
import AddClient from "../../../_components/database/AddClient";
import ClientTable from "../../../_components/database/ClientTable";
import Search from "../../../_components/database/Search";
import Sorting from "../../../_components/database/Sorting";
import Pagination from "../../../_components/database/Pagination";
import { Suspense } from "react";
import { TableContainerSkeleton } from "../../../_components/Skeletons";

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl bg-white p-8 shadow-xl border border-gray-200 max-w-md mx-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have the required permissions to access this page.</p>
          </div>
        </div>
      </div>
    );

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.query || "";
  const sort = resolvedSearchParams?.sort || 1;
  const currentPage = Number(resolvedSearchParams?.page) || 1;

  const totalPages = await fetchClientsPages(query);

  return (
    <Suspense fallback={<TableContainerSkeleton />}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full flex flex-col gap-8 min-h-[95vh] rounded-2xl bg-white p-8 shadow-xl border border-gray-200">
          <AddClient />
          <div className="flex-1 space-y-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row lg:gap-8">
              <Search placeholder="Search For Client..." />
              <Sorting />
            </div>
            <div className="flex-1">
              <ClientTable query={query} sort={sort} currentPage={currentPage} />
            </div>
          </div>
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </Suspense>
  );
};

export default Database;

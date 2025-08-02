import { Suspense } from "react";
import {
  fetchFilteredEstimates,
  fetchEstimatesPages,
  getEstimatesByStatus,
} from "../../lib/estimates.data";
import { fetchAllClients } from "../../lib/data";
import { EstimatesPage } from "../../../_components/estimates/EstimatesPage";
import { TableContainerSkeleton } from "../../../_components/Skeletons";
//@ts-ignore
import { auth } from "@clerk/nextjs/server";

export default async function Estimates({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    status?: string;
    page?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { sessionClaims } = await auth();
  const canManage = (sessionClaims as any)?.isManager?.isManager === true;

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
  const status = resolvedSearchParams?.status || "";
  const dateFrom = resolvedSearchParams?.dateFrom || "";
  const dateTo = resolvedSearchParams?.dateTo || "";
  const currentPage = Number(resolvedSearchParams?.page) || 1;

  const totalPages = await fetchEstimatesPages(query, status, dateFrom, dateTo);
  const clients = await fetchAllClients();
  const statusCounts = await getEstimatesByStatus();
  const estimates = await fetchFilteredEstimates(
    query,
    status,
    currentPage,
    dateFrom,
    dateTo,
  );

  // Serialize estimates to plain objects using JSON to avoid MongoDB ObjectId issues
  const serializedEstimates = JSON.parse(JSON.stringify(estimates));
  // Serialize clients to plain objects
  const serializedClients = JSON.parse(JSON.stringify(clients || []));

  return (
    <Suspense fallback={<TableContainerSkeleton />}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full flex flex-col gap-6 max-h-[95vh] rounded-2xl bg-white p-8 shadow-xl border border-gray-200 overflow-hidden">
          <EstimatesPage
            query={query}
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
            currentPage={currentPage}
            totalPages={totalPages}
            clients={serializedClients}
            estimates={serializedEstimates}
            statusCounts={statusCounts}
          />
        </div>
      </div>
    </Suspense>
  );
}

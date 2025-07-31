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

  if (!canManage) {
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );
  }

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
      <div className="flex min-h-full items-center justify-center">
        <div className="my-5 flex min-h-[90vh] w-[95%] flex-col gap-4 overflow-visible rounded-lg bg-white p-4 shadow-lg lg:my-0 lg:w-[95%]">
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

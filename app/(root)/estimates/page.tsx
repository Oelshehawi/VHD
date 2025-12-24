import { Suspense } from "react";
import {
  fetchFilteredEstimates,
  fetchEstimatesPages,
  getEstimatesByStatus,
} from "../../lib/estimates.data";
import { fetchAllClients } from "../../lib/data";
import { EstimatesPage } from "../../../_components/estimates/EstimatesPage";
import { TableContainerSkeleton } from "../../../_components/Skeletons";
import { Card } from "../../../_components/ui/card";
import { AlertTriangle } from "lucide-react";
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
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="mx-4 max-w-md">
          <div className="p-8 text-center">
            <div className="bg-destructive/10 border-destructive/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
            <h2 className="text-foreground mb-2 text-2xl font-bold">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              You don&apos;t have the required permissions to access this page.
            </p>
          </div>
        </Card>
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
      <div className="bg-background min-h-screen p-6">
        <Card className="flex max-h-[95vh] w-full flex-col gap-6 overflow-hidden p-8">
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
        </Card>
      </div>
    </Suspense>
  );
}

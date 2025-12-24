import { Suspense } from "react";
import { fetchEstimateById } from "../../../lib/estimates.data";
import { fetchAllClients } from "../../../lib/data";
import { notFound } from "next/navigation";
import EstimateDetailsContainer from "../../../../_components/estimates/EstimateDetailsContainer";
import { Skeleton } from "../../../../_components/ui/skeleton";
// @ts-ignore
import { auth } from "@clerk/nextjs/server";

const EstimateDetailed = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const estimateId = id;
  
  try {
    const { sessionClaims } = await auth();
    const canManage = (sessionClaims as any)?.isManager?.isManager === true;

    const estimate = await fetchEstimateById(estimateId);
    if (!estimate) {
      notFound();
    }

    const clients = await fetchAllClients();

    // Serialize estimate data to remove MongoDB ObjectIds
    const serializedEstimate = JSON.parse(JSON.stringify(estimate));
    const serializedClients = JSON.parse(JSON.stringify(clients));

    return (
      <Suspense 
        fallback={
          <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        }
      >
        <EstimateDetailsContainer
          estimate={serializedEstimate}
          clients={serializedClients}
          canManage={canManage}
          estimateId={estimateId}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error fetching estimate data:", error);
    notFound();
  }
};

export default EstimateDetailed; 
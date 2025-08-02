import { Suspense } from "react";
import { fetchEstimateById } from "../../../lib/estimates.data";
import { fetchAllClients } from "../../../lib/data";
import { notFound } from "next/navigation";
import EstimateDetailsContainer from "../../../../_components/estimates/EstimateDetailsContainer";
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
          <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
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
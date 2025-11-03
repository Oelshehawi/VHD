import { Suspense } from "react";
import JobsDueContainer from "../../../_components/dashboard/JobsDueContainer";
import {
  InfoBoxSkeleton,
  JobsDueContainerSkeleton,
} from "../../../_components/Skeletons";
import {
  getClientCount,
  getPendingInvoiceAmount,
  getPendingInvoices,
  fetchRecentActions,
} from "../../lib/dashboard.data";
import { FaPeopleGroup } from "react-icons/fa6";
import ActionsFeed from "../../../_components/dashboard/ActionsFeed";
//@ts-ignore
import { auth } from "@clerk/nextjs/server";
import PendingAmountContainer from "../../../_components/database/PendingAmountContainer";
import { DashboardSearchParams } from "../../lib/typeDefinitions";

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) => {
  const resolvedSearchParams = await searchParams;

  const [{ sessionClaims }, amount, pendingInvoices, recentActions] = await Promise.all([
    auth(),
    getPendingInvoiceAmount(),
    getPendingInvoices(),
    fetchRecentActions()
  ]);


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

  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-8 mb-12 sm:grid-cols-2">
        <Suspense fallback={<InfoBoxSkeleton />}>
          <ClientCount />
        </Suspense>
        <Suspense fallback={<InfoBoxSkeleton />}>
          <PendingAmountContainer
            amount={amount}
            pendingInvoices={pendingInvoices}
          />
        </Suspense>
      </div>

      {/* Activity Feed and Jobs Due */}
      <div className="flex flex-col gap-8 lg:flex-row">
        <Suspense fallback={<div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200 h-[400px] animate-pulse" />}>
          <div className="flex-1 lg:h-[680px]">
            <ActionsFeed actions={recentActions} />
          </div>
        </Suspense>
        <Suspense fallback={<JobsDueContainerSkeleton />}>
          <div className="flex-1 lg:h-[680px]">
            <JobsDueContainer searchParams={resolvedSearchParams} />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

const ClientCount = async () => {
  const count = await getClientCount();
  return (
    <div className="rounded-xl bg-white p-4 sm:p-8 shadow-lg border border-gray-200 transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="rounded-xl bg-gradient-to-r from-darkGreen to-green-600 p-3 sm:p-4 shadow-lg">
            <FaPeopleGroup className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">Total Clients</h2>
            <p className="text-gray-600 text-sm sm:text-base">Active customer base</p>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 sm:p-6 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-900 sm:text-4xl">{count}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

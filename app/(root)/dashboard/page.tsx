import { Suspense } from "react";
import JobsDueContainer from "../../../_components/dashboard/JobsDueContainer";
import {
  InfoBoxSkeleton,
  JobsDueContainerSkeleton,
  YearlySalesSkeleton,
} from "../../../_components/Skeletons";
import {
  getClientCount,
  getPendingInvoiceAmount,
  getPendingInvoices,
  fetchYearlySalesData,
} from "../../lib/dashboard.data";
import { FaPeopleGroup } from "react-icons/fa6";
import YearlySales from "../../../_components/dashboard/YearlySales";
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
  const currentYear = resolvedSearchParams.salesYear
    ? parseInt(resolvedSearchParams.salesYear)
    : new Date().getFullYear();

  console.time('Dashboard Page Total');
  
  console.time('Parallel Data Fetch');
  const [{ sessionClaims }, salesData, amount, pendingInvoices] = await Promise.all([
    auth(),
    fetchYearlySalesData(currentYear),
    getPendingInvoiceAmount(),
    getPendingInvoices()
  ]);
  console.timeEnd('Parallel Data Fetch');

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

  console.timeEnd('Dashboard Page Total');
  
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

      {/* Charts and Analytics - Larger Height */}
      <div className="flex flex-col gap-8 lg:flex-row h-[700px] lg:h-[680px]">
        <Suspense fallback={<YearlySalesSkeleton />}>
          <div className="flex-1 h-full">
            <YearlySales salesData={salesData} currentYear={currentYear} />
          </div>
        </Suspense>
        <Suspense fallback={<JobsDueContainerSkeleton />}>
          <div className="flex-1 h-full">
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
    <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200 transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="rounded-xl bg-gradient-to-r from-darkGreen to-green-600 p-4 shadow-lg">
            <FaPeopleGroup className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Total Clients</h2>
            <p className="text-gray-600 text-base">Active customer base</p>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-6 text-center border border-gray-200">
          <div className="text-4xl font-bold text-gray-900">{count}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

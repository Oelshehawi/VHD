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
import { auth } from "@clerk/nextjs/server";
import PendingAmountContainer from "../../../_components/database/PendingAmountContainer";
import { DashboardSearchParams } from "../../lib/typeDefinitions";

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) => {
  const currentYear = searchParams.salesYear
    ? parseInt(searchParams.salesYear)
    : new Date().getFullYear();

  const salesData = await fetchYearlySalesData(currentYear);
  const amount = await getPendingInvoiceAmount();
  const pendingInvoices = (await getPendingInvoices()) || [];
  const {  sessionClaims } = await auth();

  const canManage = (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <div className="w-full">
          <Suspense fallback={<InfoBoxSkeleton />}>
            <ClientCount />
          </Suspense>
        </div>
        <div className="w-full">
          <Suspense fallback={<InfoBoxSkeleton />}>
            <PendingAmountContainer
              amount={amount}
              pendingInvoices={pendingInvoices}
            />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-2 px-4 lg:flex-row">
        <Suspense fallback={<YearlySalesSkeleton />}>
          <YearlySales salesData={salesData} currentYear={currentYear} />
        </Suspense>
        <Suspense fallback={<JobsDueContainerSkeleton />}>
          <JobsDueContainer searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
};

const ClientCount = async () => {
  const count = await getClientCount();
  return (
    <div className="h-full space-y-2 rounded-lg bg-darkGreen p-4 text-white shadow-lg transition-all hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaPeopleGroup className="h-8 w-8 lg:h-10 lg:w-10" />
          <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">
            Total Clients
          </h2>
        </div>
      </div>
      <div className="rounded-lg bg-darkGray p-3 text-center text-2xl font-bold sm:text-3xl lg:text-4xl">
        {count}
      </div>
    </div>
  );
};

export default DashboardPage;

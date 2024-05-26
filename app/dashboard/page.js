import { Suspense } from "react";
import JobsDueContainer from "../../components/dashboard/JobsDueContainer";
import {
  getClientCount,
  getOverDueInvoiceAmount,
  getPendingInvoiceAmount,
} from "../lib/data";
import {
  InfoBoxSkeleton,
  JobsDueContainerSkeleton,
  YearlySalesSkeleton,
} from "../../components/Skeletons";
import { FaPeopleGroup, FaMoneyBill, FaFile } from "react-icons/fa6";
import YearlySales from "../../components/dashboard/YearlySales";
import { fetchYearlySalesData } from "../lib/data";
import { auth } from "@clerk/nextjs/server";

const DashboardPage = async () => {
  const salesData = await fetchYearlySalesData();
  const { has } = auth();

  const canManage = has({ permission: "org:database:allow" });

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  return (
    <>
      <div className="flex h-[20vh] flex-row items-center justify-between md:h-1/5 md:px-6">
        <div className="w-1/3 px-2 md:w-1/6 md:!px-0">
          <Suspense fallback={<InfoBoxSkeleton />}>
            <ClientCount />
          </Suspense>
        </div>
        <div className="w-1/3 px-2 md:w-1/6 md:!px-0">
          <Suspense fallback={<InfoBoxSkeleton />}>
            <OverdueAmount />
          </Suspense>
        </div>
        <div className="w-1/3 px-2 md:w-1/6 md:!px-0">
          <Suspense fallback={<InfoBoxSkeleton />}>
            <PendingAmount />
          </Suspense>
        </div>
      </div>

      <div className="flex h-4/5 flex-col justify-between px-4 lg:flex-row">
        <Suspense fallback={<YearlySalesSkeleton />}>
          <YearlySales salesData={salesData} />
        </Suspense>
        <Suspense fallback={<JobsDueContainerSkeleton />}>
          <JobsDueContainer />
        </Suspense>
      </div>
    </>
  );
};

const ClientCount = async () => {
  const count = await getClientCount();
  return (
    <div className="h-full space-y-2 rounded bg-darkGreen p-2 text-white shadow">
      <div className="flex flex-row items-center justify-center md:justify-start">
        <FaPeopleGroup className="h-6 w-6 " />
        <div className="hidden p-2 text-center text-xl md:block">
          Total Clients
        </div>
      </div>
      <div className="text-md rounded bg-darkGray p-2 text-center md:text-3xl">
        {count}
      </div>
    </div>
  );
};

const OverdueAmount = async () => {
  const amount = await getOverDueInvoiceAmount();
  return (
    <div className="h-full space-y-2 rounded bg-darkGreen p-2 text-white shadow">
      <div className="flex flex-row items-center justify-center md:justify-start">
        <FaFile className="h-6 w-6" />
        <div className="hidden p-2 text-center text-xl md:block ">
          Overdue Amount
        </div>
      </div>

      <div className="text-md rounded bg-darkGray p-2 text-center md:text-3xl">
        ${amount}
      </div>
    </div>
  );
};

const PendingAmount = async () => {
  const amount = await getPendingInvoiceAmount();
  return (
    <div className="h-full space-y-2 rounded bg-darkGreen p-2 text-white shadow">
      <div className="flex flex-row items-center justify-center md:justify-start">
        <FaMoneyBill className="h-6 w-6" />
        <div className="hidden p-2 text-center text-xl md:block">
          Pending Amount
        </div>
      </div>
      <div className="text-md rounded bg-darkGray p-2 text-center md:text-3xl">
        ${amount}
      </div>
    </div>
  );
};

export default DashboardPage;

import { Suspense } from "react";
import JobsDueContainer from "../../../_components/dashboard/JobsDueContainer";
import {
  InfoBoxSkeleton,
  JobsDueContainerSkeleton,
} from "../../../_components/Skeletons";
import {
  getPendingInvoiceAmount,
  getPendingInvoices,
  getUnscheduledJobs,
  fetchJobsDueData,
  fetchRecentActions,
} from "../../lib/dashboard.data";
import ActionsFeed from "../../../_components/dashboard/ActionsFeed";
import MobileTabInterface from "../../../_components/dashboard/MobileTabInterface";
import { auth } from "@clerk/nextjs/server";
import PendingAmountContainer from "../../../_components/database/PendingAmountContainer";
import UrgentAttention from "../../../_components/dashboard/UrgentAttention";
import { DashboardSearchParams } from "../../lib/typeDefinitions";
import { Card, CardContent } from "../../../_components/ui/card";
import { AlertCircle } from "lucide-react";

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) => {
  const resolvedSearchParams = await searchParams;

  // Parse date range for actions feed (default to current month)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const actionsDateFrom = resolvedSearchParams.actionsDateFrom
    ? new Date(resolvedSearchParams.actionsDateFrom)
    : currentMonthStart;
  const actionsDateTo = resolvedSearchParams.actionsDateTo
    ? new Date(resolvedSearchParams.actionsDateTo)
    : currentMonthEnd;
  const actionsSearch = resolvedSearchParams.actionsSearch || "";

  // Adjust end date for fetchRecentActions (it expects exclusive end date)
  const adjustedActionsDateTo = new Date(actionsDateTo);
  adjustedActionsDateTo.setDate(adjustedActionsDateTo.getDate() + 1);

  // Parse month/year for jobs due - default to current month/year on server side
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentMonthName = MONTHS[now.getMonth()];
  const jobsMonth = resolvedSearchParams.month || currentMonthName;
  const jobsYear = resolvedSearchParams.year
    ? typeof resolvedSearchParams.year === "string"
      ? parseInt(resolvedSearchParams.year)
      : resolvedSearchParams.year
    : now.getFullYear();

  const [
    { sessionClaims },
    amount,
    pendingInvoices,
    unscheduledJobs,
    jobsDueData,
    recentActions,
  ] = await Promise.all([
    auth(),
    getPendingInvoiceAmount(),
    getPendingInvoices(),
    getUnscheduledJobs(),
    fetchJobsDueData({
      month: jobsMonth,
      year: jobsYear,
    }),
    fetchRecentActions(actionsDateFrom, adjustedActionsDateTo, actionsSearch),
  ]);

  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  const overdueInvoices = pendingInvoices.filter(
    (inv) => inv.status === "overdue",
  );

  // Filter unscheduled jobs to only show those due before the current month
  const urgentUnscheduledJobs = unscheduledJobs.filter((job) => {
    const dueDate = new Date(job.dateDue);
    return dueDate < currentMonthStart;
  });

  if (!canManage)
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don&apos;t have the required permissions to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <>
      {/* Top Row: Pending Amount & Urgent Attention - Side by Side */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<InfoBoxSkeleton />}>
          <PendingAmountContainer
            amount={amount}
            pendingInvoices={pendingInvoices}
          />
        </Suspense>
        <UrgentAttention
          overdueInvoices={overdueInvoices}
          unscheduledJobs={urgentUnscheduledJobs}
        />
      </div>

      {/* Main Content Grid - flex-1 fills remaining space */}
      <div className="hidden min-h-0 flex-1 gap-8 lg:grid lg:grid-cols-2">
        {/* Jobs Due - 1/2 width */}
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-auto">
          <JobsDueContainer jobsDueData={jobsDueData} />
        </div>

        {/* Activity Feed - 1/2 width */}
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-auto">
          <ActionsFeed
            searchParams={resolvedSearchParams}
            recentActions={recentActions}
          />
        </div>
      </div>

      {/* Mobile: Tab interface - Jobs Due first */}
      <MobileTabInterface
        searchParams={resolvedSearchParams}
        jobsDueData={jobsDueData}
        recentActions={recentActions}
      />
    </>
  );
};

export default DashboardPage;

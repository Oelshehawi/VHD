import { Suspense, cache } from "react";
import JobsDueSection from "../../../_components/dashboard/JobsDueSection";
import {
  InfoBoxSkeleton,
  JobsDueContainerSkeleton,
  ActionsFeedSkeleton,
} from "../../../_components/Skeletons";
import {
  getPendingInvoicesData,
  getUnscheduledJobs,
  fetchRecentActions,
  fetchJobsDueData,
} from "../../lib/dashboard.data";
import ActionsFeed from "../../../_components/dashboard/ActionsFeed";
import MobileTabInterface from "../../../_components/dashboard/MobileTabInterface";
import PendingAmountContainer from "../../../_components/database/PendingAmountContainer";
import UrgentAttention from "../../../_components/dashboard/UrgentAttention";

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

const DashboardPage = () => {
  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()] || "January";
  const currentYear = now.getFullYear();
  const jobsDueDataPromise = fetchJobsDueData({
    month: currentMonthName,
    year: currentYear,
  });

  /* Jobs Due Tab Content */
  const jobsDueTabContent = (
    <Suspense fallback={<JobsDueContainerSkeleton />}>
      <JobsDueSection
        jobsDueDataPromise={jobsDueDataPromise}
        month={currentMonthName}
        year={currentYear}
      />
    </Suspense>
  );

  const activityTabContent = (
    <Suspense fallback={<ActionsFeedSkeleton />}>
      <ActionsFeedSection />
    </Suspense>
  );

  return (
    <>
      {/* Top Row: Pending Amount & Urgent Attention - Side by Side */}
      <Suspense fallback={<InfoBoxSkeleton />}>
        <TopRowSection />
      </Suspense>

      {/* Main Content Grid - flex-1 fills remaining space */}
      <div className="hidden min-h-0 flex-1 gap-8 lg:grid lg:grid-cols-2">
        {/* Jobs Due - 1/2 width */}
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-auto">
          {jobsDueTabContent}
        </div>

        {/* Activity Feed - 1/2 width */}
        <div className="h-full min-h-0 min-w-0 flex-1 overflow-auto">
          {activityTabContent}
        </div>
      </div>

      {/* Mobile: Tab interface - Jobs Due first */}
      <MobileTabInterface
        jobsDueContent={jobsDueTabContent}
        activityTabContent={activityTabContent}
      />
    </>
  );
};

// Async server component for top row
async function TopRowSection() {
  const [{ invoices, totalAmount }, unscheduledJobs] = await Promise.all([
    getPendingInvoicesData(),
    getUnscheduledJobs(), // Keep fetching all for admin visibility
  ]);

  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const urgentUnscheduledJobs = unscheduledJobs.filter((job) => {
    const dueDate = new Date(job.dateDue);
    return dueDate < currentMonthStart;
  });

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PendingAmountContainer
        amount={totalAmount}
        pendingInvoices={invoices}
      />
      <UrgentAttention
        overdueInvoices={overdueInvoices}
        unscheduledJobs={urgentUnscheduledJobs}
      />
    </div>
  );
}

const fetchRecentActionsCached = cache(
  async (startMs: number, endMs: number, searchQuery: string) => {
    return fetchRecentActions(new Date(startMs), new Date(endMs), searchQuery);
  },
);

// Async component to fetch and render actions
async function ActionsFeedSection() {
  const now = new Date();
  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const currentMonthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );

  // Fetch current month's actions - client will filter dates locally
  const recentActions = await fetchRecentActionsCached(
    currentMonthStart.getTime(),
    currentMonthEnd.getTime(),
    "",
  );

  return <ActionsFeed recentActions={recentActions} />;
}

export default DashboardPage;

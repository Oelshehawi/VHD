import { Suspense } from "react";
import {
  fetchYearlySalesData,
  fetchAnalyticsMetrics,
} from "../../lib/dashboard.data";
import YearlySales from "../../../_components/dashboard/YearlySales";
import AnalyticsMetrics from "../../../_components/analytics/AnalyticsMetrics";
import {
  YearlySalesSkeleton,
  InfoBoxSkeleton,
} from "../../../_components/Skeletons";
//@ts-ignore
import { auth } from "@clerk/nextjs/server";

export default async function AnalyticsPage() {
  const { sessionClaims } = await auth();

  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (!canManage)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-4 max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-100">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have the required permissions to access this page.
            </p>
          </div>
        </div>
      </div>
    );

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-8">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Business insights and performance metrics
        </p>
      </div>

      {/* Main Analytics Section */}
      <div className="flex-1 grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Key Metrics - Sidebar */}
        <div className="flex-1 lg:col-span-1">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-4">
                <InfoBoxSkeleton />
                <InfoBoxSkeleton />
                <InfoBoxSkeleton />
              </div>
            }
          >
            <AnalyticsMetricsContainer />
          </Suspense>
        </div>

        {/* Sales Chart - Main Content */}
        <div className="flex-1 lg:col-span-3">
          <Suspense fallback={<YearlySalesSkeleton />}>
            <div className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
              <YearlySalesChart currentYear={currentYear} />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function AnalyticsMetricsContainer() {
  const metrics = await fetchAnalyticsMetrics();
  return <AnalyticsMetrics metrics={metrics} />;
}

async function YearlySalesChart({ currentYear }: { currentYear: number }) {
  const salesData = await fetchYearlySalesData(currentYear);
  return <YearlySales salesData={salesData} currentYear={currentYear} />;
}

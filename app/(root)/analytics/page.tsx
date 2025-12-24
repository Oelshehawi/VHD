import { Suspense } from "react";
import { fetchAnalyticsMetrics } from "../../lib/dashboard.data";
import AnalyticsMetrics from "../../../_components/analytics/AnalyticsMetrics";
import YearlySalesContainer from "../../../_components/analytics/YearlySalesContainer";
import {
  YearlySalesSkeleton,
  InfoBoxSkeleton,
} from "../../../_components/Skeletons";
import { Card, CardContent } from "../../../_components/ui/card";
import { AlertTriangle } from "lucide-react";
//@ts-ignore
import { auth } from "@clerk/nextjs/server";

export default async function AnalyticsPage() {
  const { sessionClaims } = await auth();

  const canManage =
    (sessionClaims as any)?.isManager?.isManager === true ? true : false;

  if (!canManage)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="border-destructive/20 mx-4 max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-8 w-8" />
              </div>
              <h2 className="text-foreground mb-2 text-2xl font-bold">
                Access Denied
              </h2>
              <p className="text-muted-foreground">
                You don't have the required permissions to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="bg-background flex min-h-screen flex-col p-8">
      {/* Header */}

      {/* Main Analytics Section */}
      <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-4">
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
          <YearlySalesContainer initialYear={new Date().getFullYear()} />
        </div>
      </div>
    </div>
  );
}

async function AnalyticsMetricsContainer() {
  const metrics = await fetchAnalyticsMetrics();
  return <AnalyticsMetrics metrics={metrics} />;
}

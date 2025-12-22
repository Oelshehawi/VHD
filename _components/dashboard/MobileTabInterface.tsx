"use client";

import ActionsFeed from "./ActionsFeed";
import JobsDueContainer from "./JobsDueContainer";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";
import { JobsDueDataType, DisplayAction } from "../../app/lib/dashboard.data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export default function MobileTabInterface({
  searchParams,
  jobsDueData,
  recentActions,
}: {
  searchParams: DashboardSearchParams;
  jobsDueData: JobsDueDataType;
  recentActions: DisplayAction[];
}) {
  return (
    <div className="flex h-full flex-col lg:hidden">
      <Tabs defaultValue="jobs" className="flex h-full w-full flex-col">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="jobs">Jobs Due</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="jobs" className="mt-0 h-full border-0 p-0">
            <div className="h-full">
              <JobsDueContainer jobsDueData={jobsDueData} />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0 h-full border-0 p-0">
            <ActionsFeed
              searchParams={searchParams}
              recentActions={recentActions}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

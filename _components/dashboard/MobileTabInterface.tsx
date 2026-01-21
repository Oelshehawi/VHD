"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export default function MobileTabInterface({
  jobsDueContent,
  activityTabContent,
}: {
  jobsDueContent: React.ReactNode;
  activityTabContent: React.ReactNode;
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
            <div className="h-full">{jobsDueContent}</div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0 h-full border-0 p-0">
            {activityTabContent}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

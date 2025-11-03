"use client";

import { useState, Suspense } from "react";
import ActionsFeed from "./ActionsFeed";
import JobsDueContainer from "./JobsDueContainer";
import { JobsDueContainerSkeleton } from "../Skeletons";
import { DashboardSearchParams } from "../../app/lib/typeDefinitions";

export default function MobileTabInterface({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const [activeTab, setActiveTab] = useState<"jobs" | "activity">("jobs");

  return (
    <div className="md:hidden flex flex-col h-full">
      {/* Tab buttons */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "jobs"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Jobs Due
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Activity Feed
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "jobs" && (
          <Suspense fallback={<JobsDueContainerSkeleton />}>
            <div className="h-full">
              <JobsDueContainer searchParams={searchParams} />
            </div>
          </Suspense>
        )}

        {activeTab === "activity" && (
          <Suspense
            fallback={
              <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200 h-full animate-pulse" />
            }
          >
            <div className="h-full">
              <ActionsFeed />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPendingSchedulingRequests } from "../../app/lib/actions/autoScheduling.actions";
import {
  SchedulingRequestType,
  RequestedTime,
} from "../../app/lib/typeDefinitions";
import { formatDateShortUTC } from "../../app/lib/utils";
import SchedulingReviewModal from "./SchedulingReviewModal";

// Format exact time for display
const formatTime = (time: RequestedTime): string => {
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  return `${displayHour}:${time.minute.toString().padStart(2, "0")} ${period}`;
};

interface SchedulingRequestsPanelProps {
  initialRequests?: SchedulingRequestType[];
}

export default function SchedulingRequestsPanel({
  initialRequests = [],
}: SchedulingRequestsPanelProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<SchedulingRequestType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: requests = initialRequests, refetch } = useQuery({
    queryKey: ["schedulingRequests"],
    queryFn: getPendingSchedulingRequests,
    initialData: initialRequests,
    refetchInterval: 60000, // Refetch every minute
  });

  const formatDate = (dateStr: string | Date): string => {
    return formatDateShortUTC(dateStr);
  };

  const getTimeSinceRequest = (requestedAt: string | Date): string => {
    const now = new Date();
    const requested = new Date(requestedAt);
    const diffMs = now.getTime() - requested.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return "Just now";
    }
  };

  const handleReviewClick = (request: SchedulingRequestType) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    refetch();
  };

  if (requests.length === 0) {
    return null; // Don't show panel if no pending requests
  }

  return (
    <>
      <div className="rounded-lg bg-white shadow">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            <h2 className="font-semibold text-gray-900">Scheduling Requests</h2>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
              {requests.length}
            </span>
          </div>
        </div>

        {/* Request List */}
        <div className="max-h-96 divide-y overflow-y-auto">
          {requests.map((request) => {
            const clientName =
              (request.clientId as any)?.clientName || "Unknown Client";
            const jobTitle =
              (request.invoiceId as any)?.jobTitle || "Unknown Job";
            const primaryDate = formatDate(request.primarySelection.date);
            const primaryTime = formatTime(
              request.primarySelection.requestedTime,
            );
            const backupDate = formatDate(request.backupSelection.date);
            const backupTime = formatTime(
              request.backupSelection.requestedTime,
            );
            const timeSince = getTimeSinceRequest(request.requestedAt);

            return (
              <div
                key={request._id?.toString()}
                className="p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="truncate font-medium text-gray-900">
                        {clientName}
                      </p>
                      <span className="text-xs text-gray-400">{timeSince}</span>
                    </div>
                    <p className="truncate text-sm text-gray-600">{jobTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        <span className="font-medium">1st:</span>
                        <span className="ml-1">
                          {primaryDate} {primaryTime}
                        </span>
                      </span>
                      <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        <span className="font-medium">Backup:</span>
                        <span className="ml-1">
                          {backupDate} {backupTime}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReviewClick(request)}
                    className="ml-4 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <SchedulingReviewModal
          request={selectedRequest}
          onClose={handleModalClose}
          isOpen={isModalOpen}
        />
      )}
    </>
  );
}

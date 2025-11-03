"use client";

import { TimeOffRequestType } from "../../app/lib/typeDefinitions";
import { TimeOffApprovalModal } from "./TimeOffApprovalModal";
import { deleteTimeOffRequest } from "../../app/lib/actions/availability.actions";
import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";

interface TimeOffRequestsTableProps {
  requests: TimeOffRequestType[];
  technicians?: { [key: string]: string }; // Map of technicianId to name
  onRefresh?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-700",
    icon: ClockIcon,
    label: "Pending",
  },
  approved: {
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    badgeColor: "bg-green-100 text-green-700",
    icon: CheckCircleIcon,
    label: "Approved",
  },
  rejected: {
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-700",
    icon: XCircleIcon,
    label: "Rejected",
  },
};

export function TimeOffRequestsTable({
  requests,
  technicians = {},
  onRefresh,
}: TimeOffRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequestType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (request: TimeOffRequestType) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleSuccess = () => {
    onRefresh?.();
  };

  const formatDate = (date: string | Date) => {
    // Handle timezone offset by extracting UTC components directly
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    // Create local date from UTC components to avoid timezone shift
    return format(new Date(year, month, day), "MMMM d, yyyy");
  };

  const calculateDays = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  // Separate requests by status
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const renderRequestsSection = (
    sectionRequests: TimeOffRequestType[],
    status: "pending" | "approved" | "rejected",
  ) => {
    if (sectionRequests.length === 0) return null;

    const config = STATUS_CONFIG[status];

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <config.icon className={`h-5 w-5 ${config.textColor}`} />
          <h3 className={`text-lg font-semibold ${config.textColor}`}>
            {config.label} Requests
          </h3>
          <span className="ml-auto text-sm font-medium text-gray-600">
            {sectionRequests.length}
          </span>
        </div>

        <div className="space-y-2">
          {sectionRequests.map((request) => (
            <div
              key={request._id?.toString() || ""}
              className={`${config.bgColor} border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {technicians[request.technicianId] || request.technicianId}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white ${config.textColor}`}>
                      <config.icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {formatDate(request.startDate)} – {formatDate(request.endDate)} ({calculateDays(request.startDate, request.endDate)}d) • {request.reason}
                  </p>
                </div>
                {status === "pending" && (
                  <button
                    onClick={() => handleOpenModal(request)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {pendingRequests.length === 0 &&
      approvedRequests.length === 0 &&
      rejectedRequests.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No time-off requests yet</p>
        </div>
      ) : (
        <>
          {renderRequestsSection(pendingRequests, "pending")}
          {renderRequestsSection(approvedRequests, "approved")}
          {renderRequestsSection(rejectedRequests, "rejected")}
        </>
      )}

      <TimeOffApprovalModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        technicianName={
          selectedRequest
            ? technicians[selectedRequest.technicianId]
            : undefined
        }
      />
    </div>
  );
}

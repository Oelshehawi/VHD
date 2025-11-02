"use client";

import { TimeOffRequestType } from "../../app/lib/typeDefinitions";
import { TimeOffApprovalModal } from "./TimeOffApprovalModal";
import { useState } from "react";
import { format } from "date-fns";

interface TimeOffRequestsTableProps {
  requests: TimeOffRequestType[];
  technicians?: { [key: string]: string }; // Map of technicianId to name
  onRefresh?: () => void;
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
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
    return format(new Date(date), "MMMM d, yyyy");
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
    title: string,
  ) => {
    if (sectionRequests.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
        <div className="overflow-x-auto max-h-[500px] border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 border-b z-10">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Technician</th>
                <th className="p-3 text-left font-semibold text-gray-700">Date Range</th>
                <th className="p-3 text-left font-semibold text-gray-700">Days</th>
                <th className="p-3 text-left font-semibold text-gray-700">Reason</th>
                <th className="p-3 text-left font-semibold text-gray-700">Requested</th>
                <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                {title.includes("Pending") && (
                  <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sectionRequests.map((request) => (
                <tr key={request._id?.toString() || ""} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-700">
                    {technicians[request.technicianId] || request.technicianId}
                  </td>
                  <td className="p-3 text-gray-700 text-sm">
                    {formatDate(request.startDate)} to {formatDate(request.endDate)}
                  </td>
                  <td className="p-3 text-gray-700 text-sm font-medium">
                    {calculateDays(request.startDate, request.endDate)} days
                  </td>
                  <td className="p-3 text-gray-700 text-sm max-w-xs truncate">
                    {request.reason}
                  </td>
                  <td className="p-3 text-gray-700 text-sm">
                    {formatDate(request.requestedAt)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  {title.includes("Pending") && (
                    <td className="p-3">
                      <button
                        onClick={() => handleOpenModal(request)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 font-medium"
                      >
                        Review
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
          {renderRequestsSection(pendingRequests, "Pending Requests")}
          {renderRequestsSection(approvedRequests, "Approved Requests")}
          {renderRequestsSection(rejectedRequests, "Rejected Requests")}
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

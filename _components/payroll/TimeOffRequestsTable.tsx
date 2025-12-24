"use client";

import { TimeOffRequestType } from "../../app/lib/typeDefinitions";
import { TimeOffApprovalModal } from "./TimeOffApprovalModal";
import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface TimeOffRequestsTableProps {
  requests: TimeOffRequestType[];
  technicians?: { [key: string]: string }; // Map of technicianId to name
  onRefresh?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    bgColor: "bg-warning/5",
    borderColor: "border-warning/20",
    badgeVariant: "warning" as const,
    icon: Clock,
    label: "Pending",
  },
  approved: {
    bgColor: "bg-success/5",
    borderColor: "border-success/20",
    badgeVariant: "success" as const,
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    bgColor: "bg-destructive/5",
    borderColor: "border-destructive/20",
    badgeVariant: "destructive" as const,
    icon: XCircle,
    label: "Rejected",
  },
};

export function TimeOffRequestsTable({
  requests,
  technicians = {},
  onRefresh,
}: TimeOffRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<TimeOffRequestType | null>(null);
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
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
    const Icon = config.icon;

    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Icon
            className={`h-5 w-5 ${
              status === "pending"
                ? "text-warning"
                : status === "approved"
                  ? "text-success"
                  : "text-destructive"
            }`}
          />
          <h3
            className={`text-lg font-semibold ${
              status === "pending"
                ? "text-warning"
                : status === "approved"
                  ? "text-success"
                  : "text-destructive"
            }`}
          >
            {config.label} Requests
          </h3>
          <span className="text-muted-foreground ml-auto text-sm font-medium">
            {sectionRequests.length}
          </span>
        </div>

        <div className="space-y-2">
          {sectionRequests.map((request) => (
            <div
              key={request._id?.toString() || ""}
              className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 transition-shadow hover:shadow-sm`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-foreground text-sm font-semibold">
                      {technicians[request.technicianId] ||
                        request.technicianId}
                    </p>
                    <Badge
                      variant={
                        status === "pending"
                          ? "outline"
                          : status === "approved"
                            ? "default"
                            : "destructive"
                      }
                      className={`text-xs ${
                        status === "pending"
                          ? "border-warning text-warning"
                          : status === "approved"
                            ? "bg-success hover:bg-success"
                            : ""
                      }`}
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(request.startDate)} –{" "}
                    {formatDate(request.endDate)} (
                    {calculateDays(request.startDate, request.endDate)}d) •{" "}
                    {request.reason}
                  </p>
                </div>
                {status === "pending" && (
                  <Button size="sm" onClick={() => handleOpenModal(request)}>
                    Review
                  </Button>
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
        <div className="bg-muted/50 rounded-lg border py-8 text-center">
          <p className="text-muted-foreground">No time-off requests yet</p>
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

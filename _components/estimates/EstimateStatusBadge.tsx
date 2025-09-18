import { EstimateType } from "../../app/lib/typeDefinitions";
import { useState } from "react";
import { updateEstimateStatus } from "../../app/lib/actions/estimates.actions";
import { toast } from "react-hot-toast";

interface EstimateStatusBadgeProps {
  status: EstimateType["status"];
  className?: string;
  estimateId?: string;
  editable?: boolean;
  onStatusChange?: (newStatus: EstimateType["status"]) => void;
}

export default function EstimateStatusBadge({
  status,
  className = "",
  estimateId,
  editable = false,
  onStatusChange,
}: EstimateStatusBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const getStatusConfig = (status: EstimateType["status"]) => {
    switch (status) {
      case "draft":
        return {
          label: "Draft",
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
      case "sent":
        return {
          label: "Sent",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "approved":
        return {
          label: "Approved",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-700 border-red-200",
        };
      default:
        return {
          label: "Unknown",
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  const config = getStatusConfig(status);

  const handleStatusChange = async (newStatus: EstimateType["status"]) => {
    if (!estimateId || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateEstimateStatus(estimateId, newStatus);
      toast.success("Status updated successfully");
      onStatusChange?.(newStatus);
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!editable) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium md:px-2.5 md:text-sm ${config.className} ${className}`}
      >
        {config.label}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as EstimateType["status"])}
        disabled={isUpdating}
        className={`appearance-none cursor-pointer rounded-full border px-2 py-0.5 text-xs font-medium md:px-2.5 md:text-sm pr-6 ${config.className} ${className} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1">
        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

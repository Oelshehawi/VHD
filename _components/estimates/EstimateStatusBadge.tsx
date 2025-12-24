import { EstimateType } from "../../app/lib/typeDefinitions";
import { useState } from "react";
import { updateEstimateStatus } from "../../app/lib/actions/estimates.actions";
import { toast } from "react-hot-toast";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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

  const getStatusVariant = (
    status: EstimateType["status"],
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "sent":
        return "secondary";
      case "draft":
      default:
        return "outline";
    }
  };

  const getStatusBadgeClassName = (status: EstimateType["status"]): string => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-200";
      case "rejected":
        return "";
      case "sent":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200";
      case "draft":
      default:
        return "";
    }
  };

  const getStatusLabel = (status: EstimateType["status"]) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "sent":
        return "Sent";
      case "draft":
      default:
        return "Draft";
    }
  };

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
      <Badge
        variant={getStatusVariant(status)}
        className={`${getStatusBadgeClassName(status)} ${className}`}
      >
        {getStatusLabel(status)}
      </Badge>
    );
  }

  return (
    <Select
      value={status}
      onValueChange={(value) =>
        handleStatusChange(value as EstimateType["status"])
      }
      disabled={isUpdating}
    >
      <SelectTrigger
        className={`h-auto w-auto border-none p-0 shadow-none focus:ring-0 [&>svg]:hidden ${className}`}
      >
        <Badge
          variant={getStatusVariant(status)}
          className={`cursor-pointer ${getStatusBadgeClassName(status)} ${isUpdating ? "opacity-50" : ""}`}
        >
          {getStatusLabel(status)}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="sent">Sent</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  );
}

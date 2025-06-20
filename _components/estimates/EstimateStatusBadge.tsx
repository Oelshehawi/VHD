import { EstimateType } from "../../app/lib/typeDefinitions";

interface EstimateStatusBadgeProps {
  status: EstimateType["status"];
  className?: string;
}

export default function EstimateStatusBadge({
  status,
  className = "",
}: EstimateStatusBadgeProps) {
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

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium md:px-2.5 md:text-sm ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}

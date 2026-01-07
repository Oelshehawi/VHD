"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface ArchivedBannerProps {
  entity: "client" | "invoice";
  archiveReason?: string;
  archivedAt?: string | Date;
}

export default function ArchivedBanner({
  entity,
  archiveReason,
  archivedAt,
}: ArchivedBannerProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <span className="font-semibold">
          This {entity} is archived.
        </span>{" "}
        {archiveReason && (
          <>
            Reason: <span className="italic">&quot;{archiveReason}&quot;</span>.
          </>
        )}{" "}
        {archivedAt && (
          <>Archived on {formatDate(archivedAt)}.</>
        )}
      </AlertDescription>
    </Alert>
  );
}

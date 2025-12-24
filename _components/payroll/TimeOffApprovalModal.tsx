"use client";

import { useState } from "react";
import {
  approvePendingTimeOff,
  rejectPendingTimeOff,
} from "../../app/lib/actions/availability.actions";
import { TimeOffRequestType } from "../../app/lib/typeDefinitions";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

interface TimeOffApprovalModalProps {
  request: TimeOffRequestType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  technicianName?: string;
}

export function TimeOffApprovalModal({
  request,
  isOpen,
  onClose,
  onSuccess,
  technicianName,
}: TimeOffApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    if (!request?._id) return;

    setLoading(true);
    setError("");

    try {
      const result = await approvePendingTimeOff(
        request._id as string,
        notes || undefined,
      );

      if (!result.success) {
        toast.error(result.message || "Failed to approve request");
        return;
      }

      toast.success("Time-off request approved");
      setNotes("");
      setAction(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request?._id) return;

    if (!notes.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await rejectPendingTimeOff(request._id as string, notes);

      if (!result.success) {
        toast.error(result.message || "Failed to reject request");
        return;
      }

      toast.success("Time-off request rejected");
      setNotes("");
      setAction(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setNotes("");
    setAction(null);
    setError("");
    onClose();
  };

  if (!request) return null;

  const startDate = new Date(request.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endDate = new Date(request.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Review Time-Off Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Compact Info Grid */}
          <div className="bg-muted grid grid-cols-2 gap-3 rounded-lg p-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Technician
              </p>
              <p className="text-foreground mt-0.5 text-sm font-medium">
                {technicianName || request.technicianId}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Duration
              </p>
              <p className="text-foreground mt-0.5 text-sm font-medium">
                {Math.ceil(
                  (new Date(request.endDate).getTime() -
                    new Date(request.startDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                ) + 1}{" "}
                days
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Date Range
              </p>
              <p className="text-foreground mt-0.5 text-sm font-medium">
                {startDate} – {endDate}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Reason
              </p>
              <p className="text-foreground mt-0.5 line-clamp-2 text-sm font-medium">
                {request.reason}
              </p>
            </div>
          </div>

          {/* Notes textarea */}
          {action && (
            <div>
              <Label className="mb-2 text-xs font-semibold uppercase">
                {action === "approve"
                  ? "Approval Notes (Optional)"
                  : "Rejection Reason (Required)"}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === "reject"
                    ? "Explain rejection reason..."
                    : "Add notes..."
                }
                rows={2}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!action ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleModalClose}
                  disabled={loading}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setAction("reject")}
                  disabled={loading}
                >
                  Reject
                </Button>
                <Button
                  className="bg-success hover:bg-success/90 flex-1"
                  onClick={() => setAction("approve")}
                  disabled={loading}
                >
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAction(null)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  className={`flex-1 ${
                    action === "approve" ? "bg-success hover:bg-success/90" : ""
                  }`}
                  variant={action === "reject" ? "destructive" : "default"}
                  onClick={action === "approve" ? handleApprove : handleReject}
                  disabled={loading || (action === "reject" && !notes.trim())}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : action === "approve" ? (
                    "Confirm"
                  ) : (
                    "Reject"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

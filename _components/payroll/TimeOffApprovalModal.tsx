"use client";

import { useState } from "react";
import {
  approvePendingTimeOff,
  rejectPendingTimeOff,
} from "../../app/lib/actions/availability.actions";
import { TimeOffRequestType } from "../../app/lib/typeDefinitions";

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
        setError(result.message || "Failed to approve request");
        return;
      }

      setNotes("");
      setAction(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
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
      const result = await rejectPendingTimeOff(
        request._id as string,
        notes,
      );

      if (!result.success) {
        setError(result.message || "Failed to reject request");
        return;
      }

      setNotes("");
      setAction(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotes("");
    setAction(null);
    setError("");
    onClose();
  };

  if (!isOpen || !request) return null;

  const startDate = new Date(request.startDate).toLocaleDateString();
  const endDate = new Date(request.endDate).toLocaleDateString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Review Time-Off Request</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700">Technician</label>
            <p className="text-gray-600">{technicianName || request.technicianId}</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Date Range</label>
            <p className="text-gray-600">
              {startDate} to {endDate}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Reason</label>
            <p className="text-gray-600">{request.reason}</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Requested</label>
            <p className="text-gray-600">
              {new Date(request.requestedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {action && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {action === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === "reject" ? "Please explain why this request is being rejected" : "Add any notes..."}
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3">
          {!action ? (
            <>
              <button
                onClick={() => setAction("reject")}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => setAction("approve")}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Approve
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAction(null)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Back
              </button>
              <button
                onClick={action === "approve" ? handleApprove : handleReject}
                disabled={loading || (action === "reject" && !notes.trim())}
                className={`flex-1 px-4 py-2 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {loading ? "Processing..." : action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

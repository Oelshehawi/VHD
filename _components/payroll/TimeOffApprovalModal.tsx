"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  approvePendingTimeOff,
  rejectPendingTimeOff,
} from "../../app/lib/actions/availability.actions";
import { TimeOffRequestType } from "../../app/lib/typeDefinitions";
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
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
        toast.error(result.message || "Failed to reject request");
        return;
      }

      toast.success("Time-off request rejected");
      setNotes("");
      setAction(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject request");
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

  if (!isOpen || !request) return null;

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

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="timeoff-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleModalClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Review Time-Off Request</h2>
              <button
                onClick={handleModalClose}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium flex items-start gap-2">
                <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Compact Info Grid */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Technician</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {technicianName || request.technicianId}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Duration</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {Math.ceil(
                    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1} days
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Date Range</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {startDate} – {endDate}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Reason</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2">
                  {request.reason}
                </p>
              </div>
            </div>

            {/* Notes textarea */}
            {action && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                  {action === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === "reject" ? "Explain rejection reason..." : "Add notes..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {!action ? (
                <>
                  <button
                    onClick={handleModalClose}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setAction("reject")}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setAction("approve")}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAction(null)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    onClick={action === "approve" ? handleApprove : handleReject}
                    disabled={loading || (action === "reject" && !notes.trim())}
                    className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      action === "approve"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {loading ? "Processing..." : action === "approve" ? "Confirm" : "Reject"}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

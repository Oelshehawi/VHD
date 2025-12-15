"use client";
import { useState, useEffect } from "react";
import { FaHistory, FaTimes } from "react-icons/fa";
import { CallLogEntry } from "../../app/lib/typeDefinitions";
import CallHistoryDisplay from "./CallHistoryDisplay";

interface CallHistoryModalProps {
  open: boolean;
  onClose: () => void;
  callHistory: CallLogEntry[];
  jobTitle: string;
}

const CallHistoryModal = ({ open, onClose, callHistory, jobTitle }: CallHistoryModalProps) => {
  const [preservedCallHistory, setPreservedCallHistory] = useState<CallLogEntry[]>([]);
  const [preservedJobTitle, setPreservedJobTitle] = useState<string>("");

  // Preserve data when modal opens or when new data arrives
  useEffect(() => {
    if (open && callHistory && callHistory.length > 0) {
      setPreservedCallHistory(callHistory);
    }
    if (open && jobTitle) {
      setPreservedJobTitle(jobTitle);
    }
  }, [open, callHistory, jobTitle]);

  // Use preserved data for display
  const displayCallHistory = preservedCallHistory.length > 0 ? preservedCallHistory : callHistory;
  const displayJobTitle = preservedJobTitle || jobTitle;
  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-linear-to-r from-purple-600 to-purple-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <FaHistory className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Call History</h2>
                <p className="text-sm text-purple-100">{displayJobTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white hover:bg-white/20 transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            {callHistory && callHistory.length > 0 ? (
              <CallHistoryDisplay callHistory={callHistory} maxVisible={10} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaHistory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No call history found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CallHistoryModal;
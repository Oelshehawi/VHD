"use client";
import { useState, useEffect } from "react";
import { FaPhone, FaClock, FaCalendar, FaUser, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { CALL_OUTCOME_LABELS } from "../../app/lib/callLogConstants";
import { CallLogEntry } from "../../app/lib/typeDefinitions";
import { formatDateStringUTC } from "../../app/lib/utils";

interface CallHistoryDisplayProps {
  callHistory: CallLogEntry[];
  maxVisible?: number;
  showCompact?: boolean;
}

const CallHistoryDisplay = ({
  callHistory = [],
  maxVisible = 3,
  showCompact = false
}: CallHistoryDisplayProps) => {
  const [showAll, setShowAll] = useState(false);
  const [preservedCallHistory, setPreservedCallHistory] = useState<CallLogEntry[]>([]);

  // Preserve call history data during animations
  useEffect(() => {
    if (callHistory && callHistory.length > 0) {
      setPreservedCallHistory(callHistory);
    }
  }, [callHistory]);

  // Use preserved data for rendering, fallback to current data
  const displayCallHistory = preservedCallHistory.length > 0 ? preservedCallHistory : callHistory;

  if (!displayCallHistory || displayCallHistory.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FaPhone className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No call history yet</p>
        <p className="text-xs text-gray-400">Call logs will appear here</p>
      </div>
    );
  }

  const sortedCalls = [...displayCallHistory].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const visibleCalls = showAll ? sortedCalls : sortedCalls.slice(0, maxVisible);
  const hasMoreCalls = sortedCalls.length > maxVisible;

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'scheduled':
      case 'payment_promised':
      case 'will_pay_today':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'will_call_back':
      case 'requested_callback':
      case 'needs_more_time':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'no_answer':
      case 'voicemail_left':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'not_interested':
      case 'cancelled':
      case 'dispute_raised':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (showCompact) {
    const latestCall = sortedCalls[0];
    return (
      <div className="flex items-center gap-2 text-xs">
        <FaPhone className="h-3 w-3 text-gray-400" />
        <span className="text-gray-600">
          {formatDateStringUTC(latestCall?.timestamp || new Date())} • {latestCall?.callerName}
        </span>
        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getOutcomeColor(latestCall?.outcome || '')}`}>
          {CALL_OUTCOME_LABELS[latestCall?.outcome as keyof typeof CALL_OUTCOME_LABELS || '']}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FaPhone className="h-4 w-4 text-gray-500" />
          Call History ({displayCallHistory.length})
        </h3>
        {hasMoreCalls && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {showAll ? (
              <>Show Less <FaChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show All <FaChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visibleCalls.map((call, index) => (
          <div
            key={call._id || index}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            {/* Call Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <FaUser className="h-3 w-3" />
                  {call.callerName}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FaClock className="h-3 w-3" />
                  {formatDateStringUTC(call.timestamp)}
                </div>
              </div>
              {call.duration && (
                <div className="text-xs text-gray-500">
                  {call.duration}m
                </div>
              )}
            </div>

            {/* Outcome Badge */}
            <div className="mb-2">
              <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-medium ${getOutcomeColor(call.outcome)}`}>
                {CALL_OUTCOME_LABELS[call.outcome as keyof typeof CALL_OUTCOME_LABELS]}
              </span>
            </div>

            {/* Notes */}
            <div className="text-sm text-gray-700 mb-2">
              {call.notes}
            </div>

            {/* Follow-up Date */}
            {call.followUpDate && (
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <FaCalendar className="h-3 w-3" />
                Follow up: {formatDateStringUTC(call.followUpDate)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallHistoryDisplay;
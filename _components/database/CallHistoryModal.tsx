"use client";
import { useState } from "react";
import {
  FaHistory,
  FaPhone,
  FaClock,
  FaCalendar,
  FaUser,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { CallLogEntry } from "../../app/lib/typeDefinitions";
import { CALL_OUTCOME_LABELS } from "../../app/lib/callLogConstants";
import {
  formatDateStringUTC,
  formatDateTimeStringUTC,
} from "../../app/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

interface CallHistoryModalProps {
  open: boolean;
  onClose: () => void;
  callHistory: CallLogEntry[];
  jobTitle: string;
}

const CallHistoryModal = ({
  open,
  onClose,
  callHistory,
  jobTitle,
}: CallHistoryModalProps) => {
  const [showAll, setShowAll] = useState(false);
  const maxVisible = 10;

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "scheduled":
      case "payment_promised":
      case "will_pay_today":
        return "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      case "will_call_back":
      case "requested_callback":
      case "needs_more_time":
        return "text-primary bg-primary/10 border-primary/20";
      case "no_answer":
      case "voicemail_left":
        return "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
      case "not_interested":
      case "cancelled":
      case "dispute_raised":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const sortedCalls = [...(callHistory || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const visibleCalls = showAll ? sortedCalls : sortedCalls.slice(0, maxVisible);
  const hasMoreCalls = sortedCalls.length > maxVisible;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-4xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <FaHistory className="text-primary h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Call History</DialogTitle>
              <p className="text-muted-foreground mt-1 text-sm">{jobTitle}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)] px-6">
          {!callHistory || callHistory.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <FaHistory className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" />
              <p>No call history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  <FaPhone className="text-muted-foreground h-4 w-4" />
                  Call History ({callHistory.length})
                </h3>
                {hasMoreCalls && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-primary hover:text-primary/90 text-xs"
                  >
                    {showAll ? (
                      <>
                        Show Less <FaChevronUp className="ml-1 h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Show All <FaChevronDown className="ml-1 h-3 w-3" />
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {visibleCalls.map((call, index) => (
                  <div
                    key={call._id || index}
                    className="bg-card border-border rounded-lg border p-3 transition-shadow hover:shadow-sm"
                  >
                    {/* Call Header */}
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <FaUser className="h-3 w-3" />
                          {call.callerName}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <FaClock className="h-3 w-3" />
                          {formatDateTimeStringUTC(call.timestamp)}
                        </div>
                      </div>
                      {call.duration && (
                        <div className="text-muted-foreground text-xs">
                          {call.duration}m
                        </div>
                      )}
                    </div>

                    {/* Outcome Badge */}
                    <div className="mb-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getOutcomeColor(call.outcome)}`}
                      >
                        {
                          CALL_OUTCOME_LABELS[
                            call.outcome as keyof typeof CALL_OUTCOME_LABELS
                          ]
                        }
                      </span>
                    </div>

                    {/* Notes */}
                    {call.notes && (
                      <div className="text-foreground mb-2 text-sm">
                        {call.notes}
                      </div>
                    )}

                    {/* Follow-up Date */}
                    {call.followUpDate && (
                      <div className="text-primary bg-primary/10 flex items-center gap-1 rounded px-2 py-1 text-xs">
                        <FaCalendar className="h-3 w-3" />
                        Follow up: {formatDateStringUTC(call.followUpDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CallHistoryModal;

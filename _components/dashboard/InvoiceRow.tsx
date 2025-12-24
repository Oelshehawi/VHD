"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { updateInvoiceScheduleStatus } from "../../app/lib/actions/actions";
import { sendCleaningReminderEmail } from "../../app/lib/actions/email.actions";
import { formatDateStringUTC } from "../../app/lib/utils";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";
import {
  FaPhone,
  FaEllipsisV,
  FaCheck,
  FaEnvelope,
  FaHistory,
} from "react-icons/fa";
import { CALL_OUTCOME_LABELS } from "../../app/lib/callLogConstants";
import CallLogModal from "../database/CallLogModal";
import CallHistoryModal from "../database/CallHistoryModal";

import { TableRow, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

const InvoiceRow = ({ invoiceData }: { invoiceData: DueInvoiceType }) => {
  const router = useRouter();
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [callHistoryOpen, setCallHistoryOpen] = useState(false);

  const getLastCallInfo = () => {
    if (!invoiceData.callHistory || invoiceData.callHistory.length === 0) {
      return null;
    }

    const sortedCalls = [...invoiceData.callHistory].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return sortedCalls[0];
  };

  const lastCall = getLastCallInfo();
  const needsFollowUp =
    lastCall?.followUpDate && new Date(lastCall.followUpDate) <= new Date();

  return (
    <TableRow className="group hover:bg-muted/50 cursor-pointer">
      <TableCell
        className="font-medium"
        onClick={() => router.push(`/invoices/${invoiceData.invoiceId}`)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {invoiceData.notesExists && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 shadow-sm"></div>
            )}
            <span className="truncate font-medium">{invoiceData.jobTitle}</span>
          </div>
          {lastCall && (
            <div className="flex items-center gap-2 text-xs">
              <FaPhone className="text-muted-foreground h-3 w-3" />
              <Badge
                variant={needsFollowUp ? "destructive" : "secondary"}
                className="px-2 text-[10px]"
              >
                {
                  CALL_OUTCOME_LABELS[
                    lastCall.outcome as keyof typeof CALL_OUTCOME_LABELS
                  ]
                }
              </Badge>
              <span className="text-muted-foreground">
                {formatDateStringUTC(lastCall.timestamp)}
              </span>
              {needsFollowUp && (
                <span className="text-destructive animate-pulse font-medium">
                  Follow-up due
                </span>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            {formatDateStringUTC(invoiceData.dateDue)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 p-0 ${needsFollowUp ? "text-destructive" : "text-muted-foreground"}`}
            >
              <span className="sr-only">Open menu</span>
              <FaEllipsisV className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setCallLogOpen(true);
              }}
            >
              <FaPhone className="mr-2 h-4 w-4 text-blue-500" />
              <span>Log Call</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await updateInvoiceScheduleStatus(invoiceData.invoiceId);
                  toast.success("Invoice marked as scheduled successfully");
                } catch (error) {
                  console.error("Error marking invoice as scheduled:", error);
                  toast.error("Failed to mark invoice as scheduled");
                }
              }}
            >
              <FaCheck className="mr-2 h-4 w-4 text-green-500" />
              <span>Mark Scheduled</span>
            </DropdownMenuItem>

            {invoiceData.callHistory && invoiceData.callHistory.length > 0 && (
              <DropdownMenuItem
                onClick={() => {
                  setCallHistoryOpen(true);
                }}
              >
                <FaHistory className="mr-2 h-4 w-4 text-purple-500" />
                <span>
                  View Call History ({invoiceData.callHistory.length})
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={invoiceData.emailSent || !invoiceData.emailExists}
              onClick={async (e) => {
                e.preventDefault();
                if (invoiceData.emailSent || !invoiceData.emailExists) return;

                try {
                  await sendCleaningReminderEmail(invoiceData);
                  toast.success("Reminder email sent successfully");
                } catch (error) {
                  console.error("Error sending email:", error);
                  toast.error("Failed to send reminder email");
                }
              }}
              className={
                invoiceData.emailSent
                  ? "cursor-default text-green-600 focus:text-green-600"
                  : !invoiceData.emailExists
                    ? "text-muted-foreground cursor-not-allowed opacity-50"
                    : ""
              }
            >
              <FaEnvelope
                className={`mr-2 h-4 w-4 ${
                  invoiceData.emailSent
                    ? "text-green-500"
                    : !invoiceData.emailExists
                      ? "text-muted-foreground"
                      : "text-orange-500"
                }`}
              />
              <span>
                {invoiceData.emailSent
                  ? "Email Sent ✓"
                  : !invoiceData.emailExists
                    ? "No Email"
                    : "Send Email"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Modals */}
      <CallLogModal
        open={callLogOpen}
        onClose={() => setCallLogOpen(false)}
        context={{
          type: "job",
          id: invoiceData.invoiceId,
          title: invoiceData.jobTitle,
          clientName: invoiceData.invoiceId,
        }}
      />
      <CallHistoryModal
        open={callHistoryOpen}
        onClose={() => setCallHistoryOpen(false)}
        callHistory={invoiceData.callHistory || []}
        jobTitle={invoiceData.jobTitle}
      />
    </TableRow>
  );
};

export default InvoiceRow;

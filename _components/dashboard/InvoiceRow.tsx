"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { updateInvoiceScheduleStatus } from "../../app/lib/actions/actions";
import { sendCleaningReminderEmail } from "../../app/lib/actions/email.actions";
import { formatDateStringUTC } from "../../app/lib/utils";
import { DueInvoiceType } from "../../app/lib/typeDefinitions";
import { FaPhone, FaEllipsisV, FaCheck, FaEnvelope } from "react-icons/fa";
import { ClipboardList, Loader2, Link2, MessageSquare } from "lucide-react";
import { CALL_OUTCOME_LABELS } from "../../app/lib/callLogConstants";
import CallLogModal from "../database/CallLogModal";
import SchedulingLinkDialog from "./SchedulingLinkDialog";
import SendCleaningReminderDialog from "./SendCleaningReminderDialog";
import SchedulingRequestsDialog from "./SchedulingRequestsDialog";
import UnifiedCommunicationsModal from "../communications/UnifiedCommunicationsModal";

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
  const { user } = useUser();
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [schedulingLinkOpen, setSchedulingLinkOpen] = useState(false);
  const [schedulingRequestsOpen, setSchedulingRequestsOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [communicationsOpen, setCommunicationsOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isMarkingScheduled, setIsMarkingScheduled] = useState(false);

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
  const todayDatePart = new Date().toISOString().split("T")[0] || "";
  const followUpDatePart = lastCall?.followUpDate
    ? (lastCall.followUpDate instanceof Date
        ? lastCall.followUpDate.toISOString()
        : String(lastCall.followUpDate)
      ).split("T")[0] || ""
    : "";
  const needsFollowUp = !!followUpDatePart && followUpDatePart <= todayDatePart;
  const communicationsCount =
    (invoiceData.callHistory?.length || 0) +
    (invoiceData.emailHistory?.length || 0);

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
            <span
              className={`truncate font-medium ${
                invoiceData.emailSent
                  ? "text-green-600 dark:text-green-500"
                  : ""
              }`}
            >
              {invoiceData.jobTitle}
            </span>
            {invoiceData.emailSent && (
              <FaEnvelope className="h-3 w-3 shrink-0 text-green-500" />
            )}
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
                if (isMarkingScheduled) return;
                setIsMarkingScheduled(true);
                try {
                  await updateInvoiceScheduleStatus(invoiceData.invoiceId);
                  toast.success("Invoice marked as scheduled successfully");
                } catch (error) {
                  console.error("Error marking invoice as scheduled:", error);
                  toast.error("Failed to mark invoice as scheduled");
                } finally {
                  setIsMarkingScheduled(false);
                }
              }}
              disabled={isMarkingScheduled}
            >
              {isMarkingScheduled ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-green-500" />
              ) : (
                <FaCheck className="mr-2 h-4 w-4 text-green-500" />
              )}
              <span>
                {isMarkingScheduled ? "Marking..." : "Mark Scheduled"}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setCommunicationsOpen(true)}
              disabled={!invoiceData._id}
            >
              <MessageSquare className="mr-2 h-4 w-4 text-sky-600" />
              <span className="flex items-center gap-2">
                Communications
                {communicationsCount > 0 && (
                  <Badge variant="secondary" className="px-2 text-[10px]">
                    {communicationsCount}
                  </Badge>
                )}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Scheduling Link */}
            <DropdownMenuItem
              onClick={() => setSchedulingLinkOpen(true)}
              disabled={!invoiceData._id}
            >
              <Link2 className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Get Scheduling Link</span>
            </DropdownMenuItem>

            {Number(invoiceData.schedulingRequestsCount || 0) > 0 && (
              <DropdownMenuItem
                onClick={() => setSchedulingRequestsOpen(true)}
                disabled={!invoiceData._id}
              >
                <ClipboardList className="mr-2 h-4 w-4 text-emerald-500" />
                <span className="flex items-center gap-2">
                  Scheduling Requests
                  <Badge variant="secondary" className="px-2 text-[10px]">
                    {invoiceData.schedulingRequestsCount}
                  </Badge>
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              disabled={isSendingEmail || !invoiceData.emailExists}
              onClick={() => {
                if (isSendingEmail || !invoiceData.emailExists) {
                  return;
                }
                setSendEmailOpen(true);
              }}
              className={
                !invoiceData.emailExists
                  ? "text-muted-foreground cursor-not-allowed opacity-50"
                  : invoiceData.emailSent
                    ? "text-green-600 focus:text-green-600"
                    : ""
              }
            >
              {isSendingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-orange-500" />
              ) : (
                <FaEnvelope
                  className={`mr-2 h-4 w-4 ${
                    invoiceData.emailSent
                      ? "text-green-500"
                      : !invoiceData.emailExists
                        ? "text-muted-foreground"
                        : "text-orange-500"
                  }`}
                />
              )}
              <span>
                {isSendingEmail
                  ? "Sending..."
                  : invoiceData.emailSent
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
        onLogged={() => {
          router.refresh();
        }}
        context={{
          type: "job",
          id: invoiceData.invoiceId,
          title: invoiceData.jobTitle,
          clientName: invoiceData.invoiceId,
        }}
      />
      {invoiceData._id && (
        <SchedulingLinkDialog
          jobsDueSoonId={invoiceData._id.toString()}
          jobTitle={invoiceData.jobTitle}
          isOpen={schedulingLinkOpen}
          onClose={() => setSchedulingLinkOpen(false)}
        />
      )}
      {invoiceData._id && (
        <SchedulingRequestsDialog
          jobsDueSoonId={invoiceData._id.toString()}
          jobTitle={invoiceData.jobTitle}
          count={Number(invoiceData.schedulingRequestsCount || 0)}
          isOpen={schedulingRequestsOpen}
          onClose={() => setSchedulingRequestsOpen(false)}
        />
      )}
      <SendCleaningReminderDialog
        isOpen={sendEmailOpen}
        onClose={() => setSendEmailOpen(false)}
        onSend={async (includeSchedulingLink) => {
          try {
            setIsSendingEmail(true);
            await sendCleaningReminderEmail(
              invoiceData,
              includeSchedulingLink,
              user?.fullName || user?.firstName || user?.id || "user",
            );
            toast.success("Reminder email sent successfully");
            router.refresh();
          } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send reminder email");
          } finally {
            setIsSendingEmail(false);
          }
        }}
        jobTitle={invoiceData.jobTitle}
        isSending={isSendingEmail}
        emailAlreadySent={invoiceData.emailSent}
        emailHistory={invoiceData.emailHistory || []}
      />
      <UnifiedCommunicationsModal
        open={communicationsOpen}
        onClose={() => setCommunicationsOpen(false)}
        context={
          invoiceData._id
            ? {
                type: "jobsDueSoon",
                jobsDueSoonId: invoiceData._id.toString(),
                title: invoiceData.jobTitle,
              }
            : null
        }
      />
    </TableRow>
  );
};

export default InvoiceRow;

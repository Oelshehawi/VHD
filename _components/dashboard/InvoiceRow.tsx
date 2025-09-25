"use client";
import { useState, useRef, useEffect } from "react";
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
  FaTimes,
} from "react-icons/fa";
import { CALL_OUTCOME_LABELS } from "../../app/lib/callLogConstants";
import { useCallLog } from "./CallLogManager";

const InvoiceRow = ({ invoiceData }: { invoiceData: DueInvoiceType }) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openCallLog, openCallHistory } = useCallLog();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    <tr className="group transition-all duration-200 hover:bg-gray-50">
      <td
        className="cursor-pointer px-4 py-4 transition-all duration-200 hover:bg-darkGreen hover:text-white group-hover:shadow-sm"
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
              <FaPhone className="h-3 w-3 text-gray-400" />
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  needsFollowUp
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-blue-200 bg-blue-50 text-blue-600"
                }`}
              >
                {
                  CALL_OUTCOME_LABELS[
                    lastCall.outcome as keyof typeof CALL_OUTCOME_LABELS
                  ]
                }
              </span>
              <span className="text-gray-500">
                {formatDateStringUTC(lastCall.timestamp)}
              </span>
              {needsFollowUp && (
                <span className="animate-pulse font-medium text-red-600">
                  Follow-up due
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {formatDateStringUTC(invoiceData.dateDue)}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-center align-middle">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 ${
              needsFollowUp ? "text-red-600 hover:text-red-700" : ""
            }`}
            title="Actions"
          >
            <FaEllipsisV className="h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
              <button
                onClick={() => {
                  openCallLog({
                    type: "job",
                    id: invoiceData.invoiceId,
                    title: invoiceData.jobTitle,
                    clientName: invoiceData.invoiceId,
                  });
                  setIsDropdownOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FaPhone className="h-4 w-4 text-blue-500" />
                Log Call
              </button>

              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await updateInvoiceScheduleStatus(invoiceData.invoiceId);
                    toast.success("Invoice marked as scheduled successfully");
                  } catch (error) {
                    console.error("Error marking invoice as scheduled:", error);
                    toast.error("Failed to mark invoice as scheduled");
                  }
                  setIsDropdownOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FaCheck className="h-4 w-4 text-green-500" />
                Mark Scheduled
              </button>

              {invoiceData.callHistory &&
                invoiceData.callHistory.length > 0 && (
                  <button
                    onClick={() => {
                      openCallHistory(
                        invoiceData.callHistory || [],
                        invoiceData.jobTitle,
                      );
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <FaHistory className="h-4 w-4 text-purple-500" />
                    View Call History ({invoiceData.callHistory.length})
                  </button>
                )}

              <button
                className={`mt-1 flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2 pt-3 text-sm transition-colors ${
                  invoiceData.emailSent
                    ? "cursor-not-allowed text-green-700 opacity-60 hover:bg-green-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={async () => {
                  if (invoiceData.emailSent) return; // Prevent sending if already sent

                  try {
                    await sendCleaningReminderEmail(invoiceData);
                    toast.success("Reminder email sent successfully");
                  } catch (error) {
                    console.error("Error sending email:", error);
                    toast.error("Failed to send reminder email");
                  }
                  setIsDropdownOpen(false);
                }}
                disabled={invoiceData.emailSent}
              >
                <FaEnvelope
                  className={`h-4 w-4 ${
                    invoiceData.emailSent ? "text-green-500" : "text-orange-500"
                  }`}
                />
                {invoiceData.emailSent ? "Email Sent ✓" : "Send Email"}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default InvoiceRow;

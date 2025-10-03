// PendingJobsModal.jsx
"use client";

import { useState, useTransition } from "react";
import {
  PendingInvoiceType,
  PaymentInfo,
  PaymentReminderSettings,
} from "../../app/lib/typeDefinitions";
import { FaTimes, FaCog } from "react-icons/fa";
import { CgUnavailable } from "react-icons/cg";
import { motion, AnimatePresence } from "framer-motion";
import { updateInvoice } from "../../app/lib/actions/actions";
import { sendPaymentReminderEmail } from "../../app/lib/actions/reminder.actions";
import toast from "react-hot-toast";
import { formatAmount, formatDateStringUTC } from "../../app/lib/utils";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import Link from "next/link";
import PaymentModal from "../payments/PaymentModal";
import ReminderConfigModal from "./ReminderConfigModal";

interface ExtendedPendingInvoiceType extends PendingInvoiceType {
  emailExists?: boolean;
  paymentReminders?: PaymentReminderSettings;
}

interface PendingJobsModalProps {
  pendingInvoices: ExtendedPendingInvoiceType[];
  onClose: () => void;
}

const PendingJobsModal = ({
  pendingInvoices,
  onClose,
}: PendingJobsModalProps) => {
  const [invoices, setInvoices] = useState(pendingInvoices);
  const [isPending, startTransition] = useTransition();
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState<string | null>(
    null,
  );

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    if (newStatus === "paid") {
      // Show payment tracking modal
      setShowPaymentModal(invoiceId);
    } else {
      // Direct status update for non-paid statuses
      updateStatus(invoiceId, newStatus);
    }
  };

  const updateStatus = (
    invoiceId: string,
    newStatus: string,
    paymentInfo?: PaymentInfo,
  ) => {
    startTransition(async () => {
      try {
        const updateData: any = { status: newStatus };

        // Add payment info if provided
        if (paymentInfo && newStatus === "paid") {
          updateData.paymentInfo = {
            method: paymentInfo.method,
            datePaid: paymentInfo.datePaid,
            notes: paymentInfo.notes,
          };
        }

        const updateInvoiceStatus = updateInvoice.bind(null, invoiceId);
        await updateInvoiceStatus(updateData);

        setInvoices((prevInvoices) =>
          prevInvoices.map((invoice) =>
            invoice._id === invoiceId
              ? { ...invoice, status: newStatus }
              : invoice,
          ),
        );

        toast.success("Status updated successfully!");
        setShowPaymentModal(null);
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error updating status!");
      }
    });
  };

  const handlePaymentSubmit = (paymentData: PaymentInfo) => {
    if (showPaymentModal) {
      updateStatus(showPaymentModal, "paid", paymentData);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500 text-white hover:bg-green-600";
      case "overdue":
        return "bg-red-500 text-white hover:bg-red-600";
      default:
        return "bg-yellow-500 text-black hover:bg-yellow-600";
    }
  };

  

  const getReminderStatusBadge = (invoice: ExtendedPendingInvoiceType) => {
    const reminders = invoice.paymentReminders;

    if (!invoice.emailExists) {
      return (
        <div className="flex items-center justify-center space-x-1 rounded-lg bg-red-100 px-2 py-1 text-red-600">
          <CgUnavailable className="h-3 w-3" />
          <span className="text-xs font-medium">No Email</span>
        </div>
      );
    }

    if (!reminders || !reminders.enabled || reminders.frequency === "none") {
      return (
        <div className="flex items-center justify-center space-x-1 rounded-lg bg-gray-100 px-2 py-1 text-gray-600">
          <span className="text-xs font-medium">No Auto Reminders</span>
        </div>
      );
    }

    const nextReminder = reminders.nextReminderDate
      ? new Date(reminders.nextReminderDate)
      : null;
    const now = new Date();
    const isOverdue = nextReminder && nextReminder < now;

    let badgeColor = "bg-green-100 text-green-600";
    let statusText = `Every ${reminders.frequency.replace("days", "")} days`;

    if (isOverdue) {
      badgeColor = "bg-orange-100 text-orange-600";
      statusText = "Due for reminder";
    }

    return (
      <div
        className={`flex items-center justify-center space-x-1 rounded-lg px-2 py-1 ${badgeColor}`}
      >
        <span className="text-xs font-medium">{statusText}</span>
        {nextReminder && !isOverdue && (
          <span className="text-xs opacity-75">
            ({formatDateStringUTC(nextReminder.toISOString())})
          </span>
        )}
      </div>
    );
  };

  const createEmailSender = (invoiceId: string) => {
    const { isProcessing, debouncedSubmit } = useDebounceSubmit({
      onSubmit: async () => {
        const response = await sendPaymentReminderEmail(invoiceId);
        if (!response.success) {
          throw new Error(response.error || "Failed to send payment reminder");
        }
        // Update the invoice in the local state to reflect email sent
        setInvoices((prevInvoices) =>
          prevInvoices.map((invoice) =>
            invoice._id === invoiceId
              ? { ...invoice, paymentEmailSent: true }
              : invoice,
          ),
        );
      },
      successMessage: "Payment reminder email sent successfully",
      delay: 500,
    });

    return { isProcessing, debouncedSubmit };
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm md:p-0"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 relative h-full w-full overflow-y-auto rounded-lg bg-white shadow-xl md:h-auto md:max-h-[80vh] md:w-[600px]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
              <h2 className="text-xl font-bold text-gray-800">Pending Jobs</h2>
              <button
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={onClose}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-6">
                {invoices.length === 0 ? (
                  <p className="text-center text-gray-500">No pending jobs.</p>
                ) : (
                  invoices.map((invoice) => {
                    const { isProcessing, debouncedSubmit } = createEmailSender(
                      invoice._id as string,
                    );

                    return (
                      <motion.div
                        key={invoice._id as string}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
                          <div className="flex-1 space-y-3">
                            <Link href={`/invoices/${invoice._id}`}>
                              <h3 className="line-clamp-2 text-lg font-semibold text-gray-800 hover:text-darkGreen">
                                {invoice.jobTitle}
                              </h3>
                            </Link>

                            <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Invoice ID:</span>
                                <span className="rounded bg-gray-100 px-3 py-1.5 font-mono text-gray-800">
                                  {invoice.invoiceId}
                                </span>
                              </div>
                              <p className="flex items-center space-x-2">
                                <span className="font-medium">Date:</span>
                                <span>
                                  {formatDateStringUTC(invoice.dateIssued)}
                                </span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <span className="font-medium">Amount:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatAmount(
                                    invoice.amount + invoice.amount * 0.05,
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex w-full flex-col space-y-3 md:w-44">
                            <select
                              onChange={(e) =>
                                handleStatusChange(
                                  invoice._id as string,
                                  e.target.value,
                                )
                              }
                              value={invoice.status}
                              disabled={isPending}
                              className={`${getStatusStyles(
                                invoice.status,
                              )} w-full appearance-none rounded-lg border-0 px-4 py-3 text-center font-medium shadow-sm transition-all duration-200 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
                            >
                              <option
                                value="paid"
                                className="bg-green-500 py-12 text-white"
                              >
                                Paid
                              </option>
                              <option
                                value="pending"
                                className="text-black bg-yellow-500 py-12"
                              >
                                Pending
                              </option>
                            </select>

                            {/* Configure Reminders Button */}
                            <div className="mt-2 flex h-10 justify-center">
                              <button
                                onClick={() =>
                                  setShowReminderModal(invoice._id as string)
                                }
                                className="flex h-full w-full items-center justify-center space-x-2 rounded-lg bg-blue-500 px-4 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                title="Configure auto reminders"
                              >
                                <FaCog className="h-4 w-4" />
                                <span className="whitespace-nowrap text-sm font-medium">
                                  Configure Reminders
                                </span>
                              </button>
                            </div>

                            {/* Reminder Status Badge */}
                            <div className="mt-2 flex justify-center">
                              {getReminderStatusBadge(invoice)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!showPaymentModal}
        onClose={() => setShowPaymentModal(null)}
        onSubmit={handlePaymentSubmit}
        isLoading={isPending}
      />

      {/* Reminder Configuration Modal */}
      <ReminderConfigModal
        isOpen={!!showReminderModal}
        onClose={() => setShowReminderModal(null)}
        invoiceId={showReminderModal || ""}
        onSettingsUpdate={(invoiceId, settings) => {
          // Update the local state with new reminder settings
          setInvoices((prevInvoices) =>
            prevInvoices.map((invoice) =>
              invoice._id === invoiceId
                ? { ...invoice, paymentReminders: settings }
                : invoice,
            ),
          );
        }}
      />
    </>
  );
};

export default PendingJobsModal;

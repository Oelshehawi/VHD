// PendingJobsModal.jsx
"use client";

import { useState, useTransition } from "react";
import { PendingInvoiceType } from "../../app/lib/typeDefinitions";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { updateInvoice } from "../../app/lib/actions/actions";
import toast from "react-hot-toast";
import { formatAmount } from "../../app/lib/utils";

interface PendingJobsModalProps {
  pendingInvoices: PendingInvoiceType[];
  onClose: () => void;
}

const PendingJobsModal = ({
  pendingInvoices,
  onClose,
}: PendingJobsModalProps) => {
  const [invoices, setInvoices] = useState(pendingInvoices);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const updateInvoiceStatus = updateInvoice.bind(null, invoiceId);
        await updateInvoiceStatus({ status: newStatus });

        setInvoices((prevInvoices) =>
          prevInvoices.map((invoice) =>
            invoice._id === invoiceId
              ? { ...invoice, status: newStatus }
              : invoice,
          ),
        );

        toast.success("Status updated successfully!");
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error updating status!");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
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

  console.log(invoices);
  return (
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
          className="relative h-full w-full overflow-y-auto rounded-lg bg-white shadow-xl scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 md:h-auto md:max-h-[80vh] md:w-[600px]"
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
                invoices.map((invoice) => (
                  <motion.div
                    key={invoice._id as string}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {invoice.jobTitle}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Invoice ID:</span>
                            <span className="rounded bg-gray-100 px-3 py-1.5 font-mono text-gray-800">
                              {invoice.invoiceId}
                            </span>
                          </div>
                          <p className="flex items-center space-x-2">
                            <span className="font-medium">Date:</span>
                            <span>{invoice.dateIssued as string}</span>
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

                      <div className="w-full md:w-44">
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
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PendingJobsModal;

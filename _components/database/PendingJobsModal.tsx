// PendingJobsModal.jsx
"use client";

import { useState, useTransition } from "react";
import { PendingInvoiceType } from "../../app/lib/typeDefinitions";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { updateInvoice } from "../../app/lib/actions/actions";
import toast from "react-hot-toast";

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50 p-4 md:p-0"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative h-full w-full overflow-y-auto rounded bg-white shadow-lg md:h-auto md:max-h-[80vh] md:w-auto md:max-w-lg"
        >
          {/* Close Button */}
          <div className="sticky top-0 z-10 flex justify-end bg-white p-2">
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={onClose}
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold">Pending Jobs</h2>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <motion.div
                  key={invoice._id as string}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border-b pb-2"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">{invoice.jobTitle}</h3>
                      <p>Date Issued: {invoice.dateIssued as string}</p>
                      <p>Amount: ${invoice.amount + invoice.amount * 0.05}</p>
                    </div>
                    {/* Status Update Form */}
                    <form className="mt-2 md:mt-0">
                      <select
                        onChange={(e) =>
                          handleStatusChange(
                            invoice._id as string,
                            e.target.value,
                          )
                        }
                        value={invoice.status}
                        disabled={isPending}
                        className={`focus:shadow-outline w-full appearance-none rounded border border-gray-400 px-4 py-2 text-center leading-tight shadow hover:cursor-pointer hover:border-gray-500 focus:outline-none ${
                          invoice.status === "paid"
                            ? "bg-green-500 text-white"
                            : invoice.status === "overdue"
                              ? "bg-red-500 text-white"
                              : "text-black bg-yellow-500"
                        }`}
                      >
                        <option
                          className="bg-green-500 text-white"
                          value="paid"
                        >
                          Paid
                        </option>
                        <option
                          className="bg-red-500 text-white"
                          value="overdue"
                        >
                          Overdue
                        </option>
                        <option
                          className="text-black bg-yellow-500"
                          value="pending"
                        >
                          Pending
                        </option>
                      </select>
                    </form>
                  </div>
                </motion.div>
              ))}
              {invoices.length === 0 && (
                <p className="text-center text-gray-500">No pending jobs.</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PendingJobsModal;

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ClientType, InvoiceType } from "../../app/lib/typeDefinitions";
import { calculateSubtotal, calculateGST, getEmailForPurpose } from "../../app/lib/utils";

interface InvoiceConfirmationModalProps {
  invoice: InvoiceType | null;
  client: ClientType | null;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function InvoiceConfirmationModal({
  invoice,
  client,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: InvoiceConfirmationModalProps) {
  if (!isOpen || !invoice || !client) return null;

  // Get client email (use accounting email like the actual send function does)
  const clientEmail =
    getEmailForPurpose(client, "accounting") || client.email || "";

  // Calculate amounts
  const subtotal = calculateSubtotal(invoice.items);
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-6 border-b border-purple-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Send Invoice
            </h2>
            <p className="text-sm text-gray-600">
              Confirm sending invoice to client
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Invoice Details */}
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="space-y-3">
                  {/* Invoice Number */}
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">
                      Invoice Number
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {invoice.invoiceId}
                    </span>
                  </div>

                  {/* Job Title */}
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">
                      Job Title
                    </span>
                    <span className="text-sm font-semibold text-gray-900 text-right max-w-xs">
                      {invoice.jobTitle}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex justify-between items-start pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Sending to
                </label>
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 border border-blue-200">
                  <svg
                    className="h-5 w-5 text-blue-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0h-15m0 0H3.75A2.25 2.25 0 013 9v9a2.25 2.25 0 002.25 2.25h15m0 0H21a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25z"
                    />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      {client.clientName}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {clientEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
              <p className="text-sm text-amber-900">
                This will send the invoice to <span className="font-semibold">{client.clientName}</span> at{" "}
                <span className="font-semibold">{clientEmail}</span> and create an audit log entry.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 2.1a.6.6 0 01.556.607v4.972m0 0h4.5V2.1m-4.5 0a.6.6 0 00-.556-.607A59.765 59.765 0 003.269 2.1m10.404 5.172m0 0a1.125 1.125 0 01-2.228.519m2.228-.52a1.125 1.125 0 002.228.52M15 12H3m8.228-4.337A18.39 18.39 0 005.364 9.1M15 12H3m0 6h15m3 0h-3v6h3v-6z"
                    />
                  </svg>
                  Confirm & Send
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

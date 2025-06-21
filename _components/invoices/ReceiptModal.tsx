"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FaReceipt } from "react-icons/fa";
import GeneratePDF, { type ReceiptData } from "../pdf/GeneratePDF";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: Omit<ReceiptData, "datePaid" | "paymentMethod">;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(() => {
    // Get today's date in local timezone to avoid timezone issues
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const formatDate = (dateString: string) => {
    // Parse the date string as local date to avoid timezone issues
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString; // fallback if format is unexpected

    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);

    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const completeReceiptData: ReceiptData = {
    ...receiptData,
    datePaid: formatDate(paymentDate || ""),
    paymentMethod: paymentMethod,
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setPaymentMethod("Cash");
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setPaymentDate(`${year}-${month}-${day}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="bg-black/60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <FaReceipt className="mr-3 h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Generate Receipt
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Please provide payment details to generate the receipt for:
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {receiptData.jobTitle}
              </p>
              <p className="text-sm text-gray-500">{receiptData.location}</p>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="E-Transfer">E-Transfer</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online Payment">Online Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Payment Date */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Amount Summary */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">
                  ${receiptData.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (5%):</span>
                <span className="text-gray-900">
                  ${receiptData.gst.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-medium">
                <span className="text-gray-900">Total Amount:</span>
                <span className="text-green-600">
                  ${receiptData.totalAmount.toFixed(2)} CAD
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <GeneratePDF
                pdfData={{ type: "receipt", data: completeReceiptData }}
                fileName={`Receipt - ${receiptData.jobTitle}.pdf`}
                buttonText="Generate Receipt"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReceiptModal;

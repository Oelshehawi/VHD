"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { PaymentInfo } from "../../app/lib/typeDefinitions";
import { FaTimes, FaCreditCard, FaCalendar, FaStickyNote } from "react-icons/fa";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: PaymentInfo) => void;
  initialData?: Partial<PaymentInfo>;
  isLoading?: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  isLoading = false,
}: PaymentModalProps) {
  // Initialize with current local time for better UX, but will save as UTC
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [paymentData, setPaymentData] = useState<PaymentInfo>({
    method: initialData.method || "e-transfer",
    datePaid: initialData.datePaid || new Date(), // Keep as Date object
    notes: initialData.notes || "",
  });

  const [localDateTimeString, setLocalDateTimeString] = useState(
    initialData.datePaid 
      ? new Date(initialData.datePaid).toISOString().slice(0, 16)
      : getCurrentLocalDateTime()
  );

  const handleSubmit = () => {
    if (!paymentData.method) {
      toast.error("Please select a payment method");
      return;
    }

    // Convert the local datetime string to UTC Date object
    const localDate = new Date(localDateTimeString);
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));

    const finalPaymentData: PaymentInfo = {
      ...paymentData,
      datePaid: utcDate, // Save as UTC Date object
    };

    onSubmit(finalPaymentData);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDateTime = e.target.value;
    setLocalDateTimeString(localDateTime);
    
    // Update the paymentData with the corresponding Date object
    if (localDateTime) {
      const localDate = new Date(localDateTime);
      setPaymentData(prev => ({
        ...prev,
        datePaid: localDate
      }));
    }
  };

  if (!isOpen) return null;

  
  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <FaCreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                  <p className="text-sm text-gray-500">Record payment information</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Payment Method */}
            <div className="space-y-2">
              <div className="flex items-center">
                <FaCreditCard className="mr-2 h-4 w-4 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="ml-6">
                <select
                  value={paymentData.method}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      method: e.target.value as PaymentInfo["method"],
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <option value="e-transfer">E-Transfer</option>
                  <option value="eft">EFT</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Date Paid */}
            <div className="space-y-2">
              <div className="flex items-center">
                <FaCalendar className="mr-2 h-4 w-4 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700">
                  Date & Time Paid <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="ml-6">
                <input
                  type="datetime-local"
                  value={localDateTimeString}
                  onChange={handleDateChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Time shown in your local timezone, saved as UTC
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <div className="flex items-center">
                <FaStickyNote className="mr-2 h-4 w-4 text-gray-400" />
                <label className="block text-sm font-medium text-gray-700">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
              </div>
              <div className="ml-6">
                <textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Transaction ID, check number, reference, etc."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Mark as Paid"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
} 
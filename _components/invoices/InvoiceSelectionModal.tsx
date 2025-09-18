"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceSelectionModalProps {
  invoices: any[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (invoice: any) => void;
}

const InvoiceSelectionModal = ({
  invoices,
  isOpen,
  onClose,
  onSelect,
}: InvoiceSelectionModalProps) => {
  // Filter invoices to only show unique jobTitles (keeping the most recent for each)
  const [uniqueInvoices, setUniqueInvoices] = useState<any[]>([]);

  useEffect(() => {
    // Group invoices by location and keep only the most recent one for each location
    const locationMap = new Map();

    // Since invoices are already sorted by date (newest first),
    // the first one we encounter for each location will be the most recent
    invoices.forEach((invoice) => {
      if (!locationMap.has(invoice.location)) {
        locationMap.set(invoice.location.trim(), invoice);
      }
    });

    // Convert map values back to array
    setUniqueInvoices(Array.from(locationMap.values()));
  }, [invoices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1f293799] bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="z-50 w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">
            Select Invoice to Autofill
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {uniqueInvoices.length > 0 ? (
            <ul className="space-y-2">
              {uniqueInvoices.map((invoice) => (
                <li
                  key={invoice._id}
                  onClick={() => onSelect(invoice)}
                  className="cursor-pointer rounded-md border border-gray-300 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-darkGreen">
                      {invoice.invoiceId}
                    </span>
                    <span className="text-sm text-gray-500">
                      {invoice.dateIssued
                        ? new Date(invoice.dateIssued).toLocaleDateString()
                        : "No date"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-darkGreen">
                    Location: {invoice.location}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Job: {invoice.jobTitle}
                  </div>
                  {invoice.items && invoice.items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-medium text-gray-500">Services:</div>
                      {invoice.items.slice(0, 2).map((item: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600">
                          • {item.description}
                          {item.details && (
                            <span className="text-gray-500 italic"> ({item.details})</span>
                          )}
                        </div>
                      ))}
                      {invoice.items.length > 2 && (
                        <div className="text-xs text-gray-500 italic">
                          +{invoice.items.length - 2} more services...
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No invoices found
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSelectionModal;

"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { EstimateType } from "../../app/lib/typeDefinitions";
import {
  updateEstimateStatus,
} from "../../app/lib/actions/estimates.actions";
import {
  FaEdit,
  FaTrash,
  FaCopy,
  FaFileInvoiceDollar,
  FaEye,
  FaEllipsisV,
  FaSpinner,
} from "react-icons/fa";
import DeleteModal from "../DeleteModal";

interface EstimateActionsProps {
  estimate: EstimateType;
  onEdit: (estimate: EstimateType) => void;
  onRefresh: () => void;
}

export default function EstimateActions({
  estimate,
  onEdit,
  onRefresh,
}: EstimateActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });


  const handleStatusChange = async (newStatus: EstimateType["status"]) => {
    setLoading("status");
    try {
      await updateEstimateStatus(estimate._id.toString(), newStatus);
      toast.success("Status updated successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
      setShowDropdown(false);
    }
  };

  const generatePDF = async () => {
    setLoading("pdf");
    try {
      // Create a temporary iframe to load and auto-generate the PDF
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = `/estimates/${estimate._id}/pdf`;
      document.body.appendChild(iframe);

      // Clean up iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 3000);

      toast.success("PDF generation started");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(null);
      setShowDropdown(false);
    }
  };

  const handleDropdownToggle = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
      });
    }
    setShowDropdown(!showDropdown);
  };

  const handleDeleteClick = () => {
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    onRefresh();
  };

  return (
    <div className="relative overflow-visible">
      <button
        ref={buttonRef}
        onClick={handleDropdownToggle}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-darkGreen text-white transition-colors hover:bg-darkGreen/90 md:h-10 md:w-10"
        disabled={loading !== null}
      >
        {loading ? (
          <FaSpinner className="h-4 w-4 animate-spin md:h-5 md:w-5" />
        ) : (
          <FaEllipsisV className="h-4 w-4 md:h-5 md:w-5" />
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div
            className="ring-black fixed z-[9999] w-48 origin-top-right transform rounded-md bg-white py-1 shadow-lg ring-1 ring-opacity-5 focus:outline-none md:w-56"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <button
              onClick={() => {
                onEdit(estimate);
                setShowDropdown(false);
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FaEdit className="mr-3 h-4 w-4" />
              Edit
            </button>

            <button
              onClick={generatePDF}
              disabled={loading === "pdf"}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <FaEye className="mr-3 h-4 w-4" />
              Generate PDF
            </button>



            {estimate.status === "draft" && (
              <button
                onClick={() => handleStatusChange("sent")}
                disabled={loading === "status"}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <FaEye className="mr-3 h-4 w-4" />
                Mark as Sent
              </button>
            )}

            {estimate.status === "sent" && (
              <>
                <button
                  onClick={() => handleStatusChange("approved")}
                  disabled={loading === "status"}
                  className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  <FaFileInvoiceDollar className="mr-3 h-4 w-4" />
                  Mark as Approved
                </button>
                <button
                  onClick={() => handleStatusChange("rejected")}
                  disabled={loading === "status"}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <FaTrash className="mr-3 h-4 w-4" />
                  Mark as Rejected
                </button>
              </>
            )}

                

            <div className="border-t border-gray-100" />

            <button
              onClick={handleDeleteClick}
              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <FaTrash className="mr-3 h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Delete Modal */}
      <DeleteModal
        deleteText="Delete Estimate?"
        deleteDesc="Are you sure you want to delete this estimate? This action cannot be undone."
        deletionId={estimate._id.toString()}
        deletingValue="estimate"
        isOpen={showDeleteModal}
        onClose={handleDeleteModalClose}
      />
    </div>
  );
}

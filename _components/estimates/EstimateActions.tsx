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
  FaSearch,
} from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import Link from "next/link";

interface EstimateActionsProps {
  estimate: EstimateType;
  onEdit: (estimate: EstimateType) => void;
}

export default function EstimateActions({
  estimate,
  onEdit,
}: EstimateActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
    direction: 'down' as 'up' | 'down',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleStatusChange = async (newStatus: EstimateType["status"]) => {
    setLoading("status");
    try {
      await updateEstimateStatus(estimate._id.toString(), newStatus);
      toast.success("Status updated successfully");
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

  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 280; // Approximate height of dropdown with all items
    const dropdownWidth = 224; // 56 * 4 = 224px for md:w-56
    const spaceBelow = window.innerHeight - rect.bottom - 20; // 20px buffer
    const spaceAbove = rect.top - 20; // 20px buffer
    const spaceRight = window.innerWidth - rect.right;
    
    // Determine vertical direction
    const shouldGoUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    // Calculate position
    const top = shouldGoUp 
      ? rect.top - 8 + window.scrollY // Position just above the button with small gap
      : rect.bottom + 8 + window.scrollY;
    
    // Ensure dropdown stays within viewport horizontally
    let right = window.innerWidth - rect.right;
    if (spaceRight < dropdownWidth) {
      right = window.innerWidth - rect.left - rect.width;
    }
    
    setDropdownPosition({
      top,
      right,
      direction: shouldGoUp ? 'up' : 'down',
    });
  };

  const handleDropdownToggle = () => {
    if (!showDropdown) {
      calculateDropdownPosition();
    }
    setShowDropdown(!showDropdown);
  };

  const handleDeleteClick = () => {
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="relative">
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
          {/* Dropdown Menu - positioned absolutely to body */}
          <div
            ref={dropdownRef}
            className={`fixed z-[9999] w-48 rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none md:w-56 ${
              dropdownPosition.direction === 'up' ? 'transform -translate-y-full' : ''
            }`}
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <Link
              href={`/estimates/${estimate._id}`}
              onClick={() => setShowDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FaSearch className="mr-3 h-4 w-4" />
              View Details
            </Link>

            <button
              onClick={() => {
                onEdit(estimate);
                setShowDropdown(false);
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FaEdit className="mr-3 h-4 w-4" />
              Edit
            </button>

            <button
              onClick={generatePDF}
              disabled={loading === "pdf"}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <FaEye className="mr-3 h-4 w-4" />
              Generate PDF
            </button>

            {estimate.status === "draft" && (
              <button
                onClick={() => handleStatusChange("sent")}
                disabled={loading === "status"}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
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
                  className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                >
                  <FaFileInvoiceDollar className="mr-3 h-4 w-4" />
                  Mark as Approved
                </button>
                <button
                  onClick={() => handleStatusChange("rejected")}
                  disabled={loading === "status"}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <FaTrash className="mr-3 h-4 w-4" />
                  Mark as Rejected
                </button>
              </>
            )}

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={handleDeleteClick}
              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
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
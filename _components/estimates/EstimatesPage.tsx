"use client";

import { useState } from "react";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import EstimatesList from "./EstimatesList";
import EstimateFilters from "./EstimateFilters";
import Pagination from "../database/Pagination";
import { FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import DeleteModal from "../DeleteModal";
import { toast } from "react-hot-toast";
import { updateEstimateStatus } from "../../app/lib/actions/estimates.actions";
import AddEstimate from "./AddEstimate";

interface EstimatesPageProps {
  query: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  totalPages: number;
  clients: ClientType[];
  estimates: EstimateType[];
  statusCounts: {
    draft: number;
    sent: number;
    approved: number;
    rejected: number;
  };
}

export function EstimatesPage({
  query,
  status,
  dateFrom,
  dateTo,
  currentPage,
  totalPages,
  clients,
  estimates,
  statusCounts,
}: EstimatesPageProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEstimate, setDeletingEstimate] = useState<EstimateType | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = (estimate: EstimateType) => {
    setDeletingEstimate(estimate);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeletingEstimate(null);
  };

  const handleStatusChange = async (newStatus: EstimateType["status"]) => {
    if (!deletingEstimate) return;
    
    setLoading("status");
    try {
      await updateEstimateStatus(deletingEstimate._id.toString(), newStatus);
      toast.success("Status updated successfully");
      handleDeleteModalClose();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Header with Status Indicators */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Estimates
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1">
              <div className="text-sm font-semibold text-gray-600">{statusCounts.draft}</div>
              <div className="text-xs text-gray-500">Draft</div>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1">
              <div className="text-sm font-semibold text-blue-600">{statusCounts.sent}</div>
              <div className="text-xs text-blue-500">Sent</div>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1">
              <div className="text-sm font-semibold text-green-600">{statusCounts.approved}</div>
              <div className="text-xs text-green-500">Approved</div>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1">
              <div className="text-sm font-semibold text-red-600">{statusCounts.rejected}</div>
              <div className="text-xs text-red-500">Rejected</div>
            </div>
          </div>
        </div>
        <AddEstimate clients={clients} />
      </div>

      {/* Filters */}
      <EstimateFilters
        currentQuery={query}
        currentStatus={status}
        currentDateFrom={dateFrom}
        currentDateTo={dateTo}
        statusCounts={statusCounts}
      />

      {/* Estimates List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <EstimatesList
            estimates={estimates}
            currentPage={currentPage}
            totalPages={totalPages}
            onEdit={() => {}} // Edit is now handled inline in the detail page
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      )}

      {/* Delete Modal */}
      {deletingEstimate && (
        <DeleteModal
          deleteText="Delete Estimate?"
          deleteDesc="Are you sure you want to delete this estimate? This action cannot be undone."
          deletionId={deletingEstimate._id.toString()}
          deletingValue="estimate"
          isOpen={showDeleteModal}
          onClose={handleDeleteModalClose}
        />
      )}
    </>
  );
}

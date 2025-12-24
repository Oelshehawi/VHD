"use client";

import { useState } from "react";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import EstimatesList from "./EstimatesList";
import EstimateFilters from "./EstimateFilters";
import Pagination from "../database/Pagination";
import DeleteModal from "../DeleteModal";
import { toast } from "react-hot-toast";
import { updateEstimateStatus } from "../../app/lib/actions/estimates.actions";
import AddEstimate from "./AddEstimate";
import { Badge } from "../ui/badge";

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
  const [deletingEstimate, setDeletingEstimate] = useState<EstimateType | null>(
    null,
  );
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
          <h1 className="text-foreground text-xl font-bold md:text-2xl">
            Estimates
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-muted">
              Draft
            </Badge>
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-700 dark:text-blue-300"
            >
              Sent
            </Badge>
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-700 dark:text-green-300"
            >
              Approved
            </Badge>
            <Badge
              variant="destructive"
              className="border-red-200 bg-red-500/10 text-red-700 dark:text-red-300"
            >
              Rejected
            </Badge>
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
      <div className="min-h-0 flex-1 overflow-hidden">
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
        <div className="flex shrink-0 justify-center">
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

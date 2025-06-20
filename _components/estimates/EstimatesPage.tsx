"use client";

import { useState } from "react";
import { EstimateType, ClientType } from "../../app/lib/typeDefinitions";
import EstimateForm from "./EstimateForm";
import EstimatesList from "./EstimatesList";
import EstimateFilters from "./EstimateFilters";
import { FaPlus, FaTimes } from "react-icons/fa";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<EstimateType | null>(
    null,
  );

  const handleCreateNew = () => {
    setEditingEstimate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (estimate: EstimateType) => {
    setEditingEstimate(estimate);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEstimate(null);
  };

  return (
    <div className="flex flex-col gap-6 overflow-visible">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Estimates
        </h1>
        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-darkGreen px-4 py-2 text-white transition-colors hover:bg-darkGreen/90 sm:w-auto"
        >
          <FaPlus className="h-4 w-4" />
          New Estimate
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="text-xl font-bold text-gray-600 md:text-2xl">
            {statusCounts.draft}
          </div>
          <div className="text-xs text-gray-500 md:text-sm">Draft</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <div className="text-xl font-bold text-blue-600 md:text-2xl">
            {statusCounts.sent}
          </div>
          <div className="text-xs text-blue-500 md:text-sm">Sent</div>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-xl font-bold text-green-600 md:text-2xl">
            {statusCounts.approved}
          </div>
          <div className="text-xs text-green-500 md:text-sm">Approved</div>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <div className="text-xl font-bold text-red-600 md:text-2xl">
            {statusCounts.rejected}
          </div>
          <div className="text-xs text-red-500 md:text-sm">Rejected</div>
        </div>
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
      <EstimatesList
        estimates={estimates}
        currentPage={currentPage}
        totalPages={totalPages}
        onEdit={handleEdit}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleModalClose}
            />

            {/* Modal panel */}
            <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 sm:align-middle">
              {/* Close button */}
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  onClick={handleModalClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-darkGreen focus:ring-offset-2"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              {/* Modal content */}
              <div className="mt-3 sm:mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {editingEstimate ? "Edit Estimate" : "Create New Estimate"}
                  </h3>
                </div>
                <div className="max-h-[80vh] overflow-y-auto">
                  <EstimateForm
                    estimate={editingEstimate}
                    clients={clients}
                    onClose={handleModalClose}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

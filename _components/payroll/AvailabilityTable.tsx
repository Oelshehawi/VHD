"use client";

import { AvailabilityType } from "../../app/lib/typeDefinitions";
import { deleteAvailability } from "../../app/lib/actions/availability.actions";
import { useState } from "react";
import { format } from "date-fns";
import { formatTimeRange12hr } from "../../app/lib/utils/timeFormatUtils";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";
import {
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface AvailabilityTableProps {
  availability: AvailabilityType[];
  technicians?: { [key: string]: string }; // Map of technicianId to name
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityTable({
  availability,
  technicians = {},
}: AvailabilityTableProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<AvailabilityType | null>(null);

  const handleDeleteClick = (entry: AvailabilityType) => {
    setSelectedForDeletion(entry);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedForDeletion?._id) return;

    setLoading(true);
    setError("");

    try {
      const result = await deleteAvailability(selectedForDeletion._id as string);
      if (!result.success) {
        toast.error(result.message || "Failed to delete availability");
      } else {
        toast.success("Availability deleted successfully");
        setDeleteModalOpen(false);
        setSelectedForDeletion(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete availability");
    } finally {
      setLoading(false);
    }
  };

  if (availability.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No availability entries yet</p>
      </div>
    );
  }

  // Group by recurring and one-time
  const recurringEntries = availability.filter((a) => a.isRecurring);
  const oneTimeEntries = availability.filter((a) => !a.isRecurring);

  return (
    <>
      <div className="space-y-8">
        {/* Recurring Entries */}
        {recurringEntries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowPathIcon className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-800">Recurring</h3>
              <span className="text-xs font-medium text-gray-600">({recurringEntries.length})</span>
            </div>
            <div className="space-y-1.5">
              {recurringEntries.map((entry) => (
                <div
                  key={entry._id?.toString() || ""}
                  className="bg-indigo-50 border border-indigo-200 rounded p-2 hover:shadow-sm transition-shadow flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">
                      {technicians[entry.technicianId] || entry.technicianId}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {DAYS_OF_WEEK[entry.dayOfWeek || 0]} • {entry.isFullDay ? "All day" : formatTimeRange12hr(entry.startTime || "00:00", entry.endTime || "23:59")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(entry)}
                    disabled={loading}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* One-Time Entries */}
        {oneTimeEntries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-800">One-Time</h3>
              <span className="text-xs font-medium text-gray-600">({oneTimeEntries.length})</span>
            </div>
            <div className="space-y-1.5">
              {oneTimeEntries.map((entry) => (
                <div
                  key={entry._id?.toString() || ""}
                  className="bg-orange-50 border border-orange-200 rounded p-2 hover:shadow-sm transition-shadow flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">
                      {technicians[entry.technicianId] || entry.technicianId}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {entry.specificDate && format(new Date(entry.specificDate), "MMM d, yyyy")} • {entry.isFullDay ? "All day" : formatTimeRange12hr(entry.startTime || "00:00", entry.endTime || "23:59")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(entry)}
                    disabled={loading}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedForDeletion(null);
        }}
        deleteText="Delete Availability Entry"
        deleteDesc={`Are you sure you want to delete this availability entry for ${
          selectedForDeletion ? technicians[selectedForDeletion.technicianId] || selectedForDeletion.technicianId : ""
        }? This action cannot be undone.`}
        deletionId={selectedForDeletion?._id?.toString() || ""}
        deletingValue="availability"
      />
    </>
  );
}

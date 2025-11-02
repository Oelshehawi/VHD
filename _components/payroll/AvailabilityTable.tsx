"use client";

import { AvailabilityType } from "../../app/lib/typeDefinitions";
import { deleteAvailability } from "../../app/lib/actions/availability.actions";
import { useState } from "react";
import { format } from "date-fns";
import { formatTimeRange12hr } from "../../app/lib/utils/timeFormatUtils";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";

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

  const formatAvailabilityLabel = (entry: AvailabilityType): string => {
    if (entry.isRecurring) {
      const day = DAYS_OF_WEEK[entry.dayOfWeek || 0];
      if (entry.isFullDay) {
        return `Every ${day} (All day)`;
      }
      const timeRange = formatTimeRange12hr(entry.startTime || "00:00", entry.endTime || "23:59");
      return `Every ${day} (${timeRange})`;
    }

    if (entry.specificDate) {
      const date = new Date(entry.specificDate);
      const dateStr = format(date, "MMMM d, yyyy");
      if (entry.isFullDay) {
        return `${dateStr} (All day)`;
      }
      const timeRange = formatTimeRange12hr(entry.startTime || "00:00", entry.endTime || "23:59");
      return `${dateStr} (${timeRange})`;
    }

    return "Unknown";
  };

  if (availability.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No availability entries yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto max-h-[600px] border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 border-b z-10">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-700">Technician</th>
              <th className="p-3 text-left font-semibold text-gray-700">Unavailability</th>
              <th className="p-3 text-left font-semibold text-gray-700">Type</th>
              <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {availability.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No availability entries yet
                </td>
              </tr>
            ) : (
              availability.map((entry) => (
                <tr key={entry._id?.toString() || ""} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-700">
                    {technicians[entry.technicianId] || entry.technicianId}
                  </td>
                  <td className="p-3 text-gray-700">{formatAvailabilityLabel(entry)}</td>
                  <td className="p-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.isRecurring
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {entry.isRecurring ? "Recurring" : "One-time"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteClick(entry)}
                      disabled={loading}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

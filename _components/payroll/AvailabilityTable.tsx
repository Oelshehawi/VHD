"use client";

import { AvailabilityType } from "../../app/lib/typeDefinitions";
import { deleteAvailability } from "../../app/lib/actions/availability.actions";
import { useState } from "react";
import { format } from "date-fns";
import { formatTimeRange12hr } from "../../app/lib/utils/timeFormatUtils";
import DeleteModal from "../DeleteModal";
import toast from "react-hot-toast";
import { Trash2, Calendar, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] =
    useState<AvailabilityType | null>(null);

  const handleDeleteClick = (entry: AvailabilityType) => {
    setSelectedForDeletion(entry);
    setDeleteModalOpen(true);
  };

  if (availability.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg border py-12 text-center">
        <Calendar className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
        <p className="text-muted-foreground font-medium">
          No availability entries yet
        </p>
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
            <div className="mb-3 flex items-center gap-2">
              <RefreshCw className="text-primary h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">
                Recurring
              </h3>
              <span className="text-muted-foreground text-xs font-medium">
                ({recurringEntries.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {recurringEntries.map((entry) => (
                <div
                  key={entry._id?.toString() || ""}
                  className="bg-primary/5 border-primary/20 flex items-center justify-between gap-2 rounded border p-2 transition-shadow hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-xs font-semibold">
                      {technicians[entry.technicianId] || entry.technicianId}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {DAYS_OF_WEEK[entry.dayOfWeek || 0]} •{" "}
                      {entry.isFullDay
                        ? "All day"
                        : formatTimeRange12hr(
                            entry.startTime || "00:00",
                            entry.endTime || "23:59",
                          )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(entry)}
                    disabled={loading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* One-Time Entries */}
        {oneTimeEntries.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="text-warning h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">
                One-Time
              </h3>
              <span className="text-muted-foreground text-xs font-medium">
                ({oneTimeEntries.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {oneTimeEntries.map((entry) => (
                <div
                  key={entry._id?.toString() || ""}
                  className="bg-warning/5 border-warning/20 flex items-center justify-between gap-2 rounded border p-2 transition-shadow hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-xs font-semibold">
                      {technicians[entry.technicianId] || entry.technicianId}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {entry.specificDate &&
                        format(
                          new Date(entry.specificDate),
                          "MMM d, yyyy",
                        )}{" "}
                      •{" "}
                      {entry.isFullDay
                        ? "All day"
                        : formatTimeRange12hr(
                            entry.startTime || "00:00",
                            entry.endTime || "23:59",
                          )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(entry)}
                    disabled={loading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
          selectedForDeletion
            ? technicians[selectedForDeletion.technicianId] ||
              selectedForDeletion.technicianId
            : ""
        }? This action cannot be undone.`}
        deletionId={selectedForDeletion?._id?.toString() || ""}
        deletingValue="availability"
      />
    </>
  );
}

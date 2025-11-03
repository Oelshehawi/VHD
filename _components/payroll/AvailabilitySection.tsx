"use client";

import { AvailabilityType } from "../../app/lib/typeDefinitions";
import { AvailabilityTable } from "./AvailabilityTable";
import {
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface AvailabilitySectionProps {
  availability: AvailabilityType[];
  technicians: Record<string, string>;
}

export function AvailabilitySection({
  availability,
  technicians,
}: AvailabilitySectionProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDaysIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Technician Availability</h2>
        </div>
        <p className="text-gray-600 text-sm ml-9">
          Manage unavailability schedules and time-off requests
        </p>
      </div>

      {/* Availability Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Unavailability Schedule</h3>
          <p className="text-gray-600 text-sm mt-1">
            {availability.length > 0
              ? `${availability.length} total unavailability ${availability.length === 1 ? "entry" : "entries"}`
              : "No unavailability entries"}
          </p>
        </div>
        <AvailabilityTable
          availability={availability}
          technicians={technicians}
        />
      </div>
    </div>
  );
}

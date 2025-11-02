"use client";

import { useState } from "react";
import { AvailabilityType } from "../../app/lib/typeDefinitions";
import { AvailabilityTable } from "./AvailabilityTable";

interface AvailabilitySectionProps {
  availability: AvailabilityType[];
  technicians: Record<string, string>;
}

export function AvailabilitySection({
  availability,
  technicians,
}: AvailabilitySectionProps) {
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <div className="border-b pb-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Technician Availability</h2>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Unavailability Schedule</h3>
        <AvailabilityTable
          availability={availability}
          technicians={technicians}
        />
      </div>
    </div>
  );
}

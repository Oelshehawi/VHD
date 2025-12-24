"use client";

import { AvailabilityType } from "../../app/lib/typeDefinitions";
import { AvailabilityTable } from "./AvailabilityTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Calendar } from "lucide-react";

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
        <div className="mb-2 flex items-center gap-3">
          <Calendar className="text-primary h-6 w-6" />
          <h2 className="text-foreground text-2xl font-bold">
            Technician Availability
          </h2>
        </div>
        <p className="text-muted-foreground ml-9 text-sm">
          Manage unavailability schedules and time-off requests
        </p>
      </div>

      {/* Availability Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unavailability Schedule</CardTitle>
          <CardDescription>
            {availability.length > 0
              ? `${availability.length} total unavailability ${availability.length === 1 ? "entry" : "entries"}`
              : "No unavailability entries"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityTable
            availability={availability}
            technicians={technicians}
          />
        </CardContent>
      </Card>
    </div>
  );
}

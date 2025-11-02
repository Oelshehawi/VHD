import { AvailabilityType } from "../typeDefinitions";

/**
 * Check if a technician is unavailable on a specific date
 * Returns true if the technician is unavailable (has a blocking)
 */
export function isTechnicianUnavailable(
  availability: AvailabilityType[],
  technicianId: string,
  date: Date,
  startTime?: string, // HH:mm format
  endTime?: string,   // HH:mm format
): boolean {
  const dayOfWeek = date.getDay();
  const year = date.getFullYear();
  const month = date.getMonth();
  const dateNum = date.getDate();

  // Check for unavailability blocks for this technician
  for (const block of availability) {
    if (block.technicianId !== technicianId) continue;

    // Check for specific date blocks
    if (block.specificDate) {
      const blockDate = new Date(block.specificDate);
      if (
        blockDate.getFullYear() === year &&
        blockDate.getMonth() === month &&
        blockDate.getDate() === dateNum
      ) {
        // Date matches
        if (block.isFullDay) {
          return true; // Full day unavailable
        }

        // If times provided, check time conflict
        if (startTime && endTime) {
          const [blockStart] = block.startTime.split(":").map(Number);
          const [blockEnd] = block.endTime.split(":").map(Number);
          const [reqStart] = startTime.split(":").map(Number);
          const [reqEnd] = endTime.split(":").map(Number);

          // Check for time overlap
          if (reqStart && reqEnd && blockStart && blockEnd && reqStart < blockEnd && reqEnd > blockStart) {
            return true;
          }
        } else {
          return true; // No specific time, block applies to whole day
        }
      }
    }

    // Check for recurring patterns
    if (block.isRecurring && block.dayOfWeek === dayOfWeek) {
      if (block.isFullDay) {
        return true; // Full day recurring unavailable
      }

      // If times provided, check time conflict
      if (startTime && endTime) {
        const [blockStart] = block.startTime.split(":").map(Number);
        const [blockEnd] = block.endTime.split(":").map(Number);
        const [reqStart] = startTime.split(":").map(Number);
        const [reqEnd] = endTime.split(":").map(Number);

        // Check for time overlap
        if (reqStart && reqEnd && blockStart && blockEnd && reqStart < blockEnd && reqEnd > blockStart) {
          return true;
        }
      } else {
        return true; // No specific time, block applies to whole day
      }
    }
  }

  return false; // Technician is available
}

/**
 * Get all technicians unavailable on a specific date
 */
export function getUnavailableTechnicians(
  availability: AvailabilityType[],
  technicianIds: string[],
  date: Date,
  startTime?: string,
  endTime?: string,
): string[] {
  return technicianIds.filter(
    (id) =>
      isTechnicianUnavailable(availability, id, date, startTime, endTime),
  );
}

/**
 * Get unavailability info for a technician on a specific date
 */
export function getTechnicianUnavailabilityInfo(
  availability: AvailabilityType[],
  technicianId: string,
  date: Date,
): {
  isUnavailable: boolean;
  reason?: string;
  type?: "full-day" | "time-block";
  startTime?: string;
  endTime?: string;
} {
  const dayOfWeek = date.getDay();
  const year = date.getFullYear();
  const month = date.getMonth();
  const dateNum = date.getDate();

  for (const block of availability) {
    if (block.technicianId !== technicianId) continue;

    // Check specific date
    if (block.specificDate) {
      const blockDate = new Date(block.specificDate);
      if (
        blockDate.getFullYear() === year &&
        blockDate.getMonth() === month &&
        blockDate.getDate() === dateNum
      ) {
        return {
          isUnavailable: true,
          type: block.isFullDay ? "full-day" : "time-block",
          startTime: block.startTime,
          endTime: block.endTime,
          reason: block.isFullDay ? "Full day unavailable" : `Unavailable ${block.startTime}-${block.endTime}`,
        };
      }
    }

    // Check recurring
    if (block.isRecurring && block.dayOfWeek === dayOfWeek) {
      const dayName = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][dayOfWeek];

      return {
        isUnavailable: true,
        type: block.isFullDay ? "full-day" : "time-block",
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.isFullDay
          ? `Every ${dayName} (All day)`
          : `Every ${dayName} (${block.startTime}-${block.endTime})`,
      };
    }
  }

  return {
    isUnavailable: false,
  };
}

/**
 * Format availability for display
 */
export function formatAvailability(block: AvailabilityType): string {
  if (block.isRecurring) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[block.dayOfWeek || 0];
    if (block.isFullDay) {
      return `Every ${dayName}`;
    }
    return `Every ${dayName}, ${block.startTime}-${block.endTime}`;
  }

  if (block.specificDate) {
    const date = new Date(block.specificDate);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (block.isFullDay) {
      return dateStr;
    }
    return `${dateStr}, ${block.startTime}-${block.endTime}`;
  }

  return "Unknown";
}

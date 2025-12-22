/**
 * Convert 24-hour time format (HH:mm) to 12-hour format (h:mm AM/PM)
 * Example: "18:00" -> "6:00 PM"
 */
export function formatTime24to12hr(time24: string): string {
  if (!time24) return "";

  const [hoursStr, minutesStr] = time24.split(":");
  const hours = parseInt(hoursStr || "0", 10);
  const minutes = parseInt(minutesStr || "0", 10);

  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Format a time range in 12-hour format
 * Example: ("18:00", "21:00") -> "6:00 PM - 9:00 PM"
 */
export function formatTimeRange12hr(
  startTime: string,
  endTime: string,
): string {
  return `${formatTime24to12hr(startTime)} - ${formatTime24to12hr(endTime)}`;
}

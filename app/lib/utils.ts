import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns-tz";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Escapes special regex characters in a string to make it safe for MongoDB $regex queries
 * @param str - The string to escape
 * @returns Escaped string safe for use in regex patterns
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const formatDate = (dateString: any) => {
  const parts = dateString.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${month}/${day}/${year}`;
};

/**
 * Format a UTC date string in readable format exactly as stored (no timezone conversion)
 * @param dateInput - Date string in ISO format or Date object
 * @returns Formatted date string (e.g., "January 15, 2024")
 */

// This is how to display date correctly from our database.
export const formatDateStringUTC = (dateInput: string | Date): string => {
  let dateString: string | undefined;

  if (dateInput instanceof Date) {
    // Extract UTC date components directly
    const year = dateInput.getUTCFullYear();
    const month = String(dateInput.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getUTCDate()).padStart(2, "0");
    dateString = `${year}-${month}-${day}`;
  } else if (typeof dateInput === "string") {
    // Handle datetime strings like '3/5/2025, 12:00:00 AM'
    if (dateInput.includes(",")) {
      // Split by comma and take the date part
      const datePart = dateInput.split(",")[0] || "";
      // Parse the date part (e.g., '3/5/2025')
      const date = new Date(datePart);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        dateString = `${year}-${month}-${day}`;
      }
    } else if (dateInput.includes("T")) {
      // Handle ISO format with T
      dateString = dateInput.split("T")[0];
    } else {
      // Handle other date formats
      dateString = dateInput;
    }
  } else {
    console.warn("formatDateStringUTC received invalid input:", dateInput);
    return "Invalid Date";
  }

  if (!dateString) {
    console.warn("formatDateStringUTC could not parse date:", dateInput);
    return "Invalid Date";
  }

  const dateParts = dateString.split("-");
  if (dateParts.length !== 3) {
    console.warn(
      "formatDateStringUTC received invalid date format:",
      dateString,
    );
    return "Invalid Date";
  }

  const year = dateParts[0]!;
  const month = dateParts[1]!;
  const day = dateParts[2]!;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[parseInt(month, 10) - 1];
  return `${monthName} ${parseInt(day, 10)}, ${year}`;
};

/**
 * Format a UTC date string in readable format with time (no timezone conversion)
 * @param dateInput - Date string in ISO format or Date object
 * @returns Formatted date string with time (e.g., "January 15, 2024 at 3:45 PM")
 */
export const formatDateTimeStringUTC = (dateInput: string | Date): string => {
  let dateObj: Date;

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === "string") {
    dateObj = new Date(dateInput);
  } else {
    console.warn("formatDateTimeStringUTC received invalid input:", dateInput);
    return "Invalid Date";
  }

  if (isNaN(dateObj.getTime())) {
    console.warn("formatDateTimeStringUTC could not parse date:", dateInput);
    return "Invalid Date";
  }

  // Extract UTC date components
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[month];

  // Convert to 12-hour format
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");
  const ampm = isPM ? "PM" : "AM";

  return `${monthName} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`;
};

export function formatAmount(amount: number): string {
  const formatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^\w\s]/gi, "");
};

export const isNumberKey = (evt: any) => {
  var charCode = evt.which ? evt.which : evt.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault();
    return false;
  }
  return true;
};

export const formatDateToString = (dateInput: string | Date) => {
  // Handle both string and Date inputs
  let dateString: string | undefined;

  if (dateInput instanceof Date) {
    // Convert Date object to YYYY-MM-DD format
    dateString = dateInput.toISOString().split("T")[0];
  } else if (typeof dateInput === "string") {
    // If it's already a string, use it directly or extract date part if it's datetime
    dateString = dateInput.includes("T") ? dateInput.split("T")[0] : dateInput;
  } else {
    // Fallback for invalid input
    console.warn("formatDateToString received invalid input:", dateInput);
    return "Invalid Date";
  }

  const dateParts = dateString!.split("-");
  if (dateParts.length !== 3) {
    console.warn(
      "formatDateToString received invalid date format:",
      dateString,
    );
    return "Invalid Date";
  }

  const year = dateParts[0]!;
  const month = dateParts[1]!;
  const day = dateParts[2]!;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[parseInt(month as string, 10) - 1]; // subtract 1 because array is zero-indexed

  return `${monthName} ${parseInt(day as string, 10)}, ${year}`; // parseInt removes leading zeros from the day
};

export const isTextKey = (evt: any) => {
  var charCode = evt.which ? evt.which : evt.keyCode;
  if (
    (charCode > 64 && charCode < 91) ||
    (charCode > 96 && charCode < 123) ||
    charCode === 8
  ) {
    return true;
  } else {
    evt.preventDefault();
    return false;
  }
};

export const formatPhoneNumber = (phoneNumber: any) => {
  if (phoneNumber.length === 10) {
    return `(${phoneNumber.substring(0, 3)})-${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
  }
  return phoneNumber;
};

export const calculateDueDate = (issuedDate: any, freq: any) => {
  if (issuedDate && freq) {
    const dueDate = new Date(issuedDate);
    const monthsToAdd = Math.floor(12 / parseInt(freq));
    dueDate.setUTCMonth(dueDate.getUTCMonth() + monthsToAdd);

    return dueDate.toISOString().split("T")[0];
  }
  return;
};

export const monthNameToNumber = (monthName: string) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthNumber = monthNames.indexOf(monthName);
  return monthNumber >= 0 ? monthNumber + 1 : null; // Adding 1 to make it 1-indexed
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export const calculateSubtotal = (items: any[]) =>
  items.reduce((acc, item) => acc + item.price, 0);

export const calculateGST = (subtotal: number) => subtotal * 0.05;

export const formatDateFns = (date: string | Date): string => {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return format(parsedDate, "MMMM do, yyyy", { timeZone: "UTC" }); // e.g., "October 15th, 2024"
};

/**
 * Calculate job duration based on invoice price (business rule)
 * @param totalPrice - Total price of the invoice
 * @returns Duration in minutes
 */
export function calculateJobDurationFromPrice(totalPrice: number): number {
  if (totalPrice <= 350) return 90; // 1.5 hours
  if (totalPrice < 600) return 150; // 2.5 hours
  if (totalPrice <= 800) return 180; // 3 hours
  if (totalPrice <= 1000) return 210; // 3.5 hours
  if (totalPrice <= 1500) return 240; // 4 hours

  // For amounts over $1500, add 1 hour for every $300
  // Calculate how many $300 increments over $1500
  const overBase = totalPrice - 1500;
  const additionalHours = Math.ceil(overBase / 300);
  const totalHours = 4 + additionalHours;

  // Cap at 8 hours maximum
  const cappedHours = Math.min(totalHours, 8);

  return cappedHours * 60; // Convert to minutes
}

/**
 * Convert duration from minutes to hours (rounded up)
 * @param durationInMinutes - Duration in minutes
 * @returns Duration in hours (rounded up to nearest 0.5)
 */
export function convertMinutesToHours(durationInMinutes: number): number {
  const hours = durationInMinutes / 60;
  // Round to nearest 0.5 hour increment
  return Math.ceil(hours * 2) / 2;
}

/**
 * Convert minutes to payroll-friendly hours (2, 4, 6, 8, 12)
 * Rounds up to the next bucket to ensure adequate time allocation
 * @param minutes - Duration in minutes
 * @returns Bucket value in hours (2, 4, 6, 8, or 12)
 */
export function minutesToPayrollHours(minutes: number): number {
  const hours = minutes / 60;
  if (hours <= 2) return 2;
  if (hours <= 4) return 4;
  if (hours <= 6) return 6;
  if (hours <= 8) return 8;
  return 12;
}

/**
 * Convert hours to payroll-friendly hours (2, 4, 6, 8, 12)
 * Rounds up to the next bucket to ensure adequate time allocation
 * @param hours - Duration in hours (can be any number)
 * @returns Bucket value in hours (2, 4, 6, 8, or 12)
 */
export function hoursToPayrollHours(hours: number): number {
  if (hours <= 2) return 2;
  if (hours <= 4) return 4;
  if (hours <= 6) return 6;
  if (hours <= 8) return 8;
  return 12;
}

/**
 * Get the appropriate email for a specific purpose, with backward compatibility
 */
export function getEmailForPurpose(
  client: any,
  purpose: "scheduling" | "accounting" | "primary",
): string | null {
  // Handle old structure (single email field)
  if (typeof client.email === "string" && !client.emails) {
    return client.email;
  }

  // Handle new structure (multiple emails)
  if (client.emails) {
    switch (purpose) {
      case "accounting":
        return (
          client.emails.accounting || client.emails.primary || client.email
        );
      case "scheduling":
        return (
          client.emails.scheduling || client.emails.primary || client.email
        );
      case "primary":
      default:
        return client.emails.primary || client.email;
    }
  }

  // Fallback to single email field
  return client.email || null;
}

/**
 * Calculate payment duration from invoice issued date to payment date (UTC-based)
 * Fixes timezone issues by working with UTC date components only
 */
export function calculatePaymentDuration(
  dateIssued: Date | string,
  datePaid?: Date | string,
): { text: string; days: number | null } {
  if (!datePaid) {
    return { text: "Not paid yet", days: null };
  }

  // Extract UTC date strings to avoid timezone conversion issues
  let issuedDateStr: string;
  let paidDateStr: string;

  if (dateIssued instanceof Date) {
    issuedDateStr = dateIssued.toISOString().split("T")[0]!;
  } else {
    issuedDateStr = dateIssued.includes("T")
      ? dateIssued.split("T")[0]!
      : dateIssued;
  }

  if (datePaid instanceof Date) {
    paidDateStr = datePaid.toISOString().split("T")[0]!;
  } else {
    paidDateStr = datePaid.includes("T") ? datePaid.split("T")[0]! : datePaid;
  }

  // Parse dates as UTC (YYYY-MM-DD format)
  const issuedParts = issuedDateStr.split("-");
  const paidParts = paidDateStr.split("-");

  if (issuedParts.length !== 3 || paidParts.length !== 3) {
    console.warn("calculatePaymentDuration received invalid date format");
    return { text: "Invalid dates", days: null };
  }

  const issuedYear = parseInt(issuedParts[0]!, 10);
  const issuedMonth = parseInt(issuedParts[1]!, 10);
  const issuedDay = parseInt(issuedParts[2]!, 10);

  const paidYear = parseInt(paidParts[0]!, 10);
  const paidMonth = parseInt(paidParts[1]!, 10);
  const paidDay = parseInt(paidParts[2]!, 10);

  // Create UTC dates at midnight to avoid timezone issues
  const issuedUTC = new Date(Date.UTC(issuedYear, issuedMonth - 1, issuedDay));
  const paidUTC = new Date(Date.UTC(paidYear, paidMonth - 1, paidDay));

  const diffTime = paidUTC.getTime() - issuedUTC.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: "Paid same day", days: 0 };
  if (diffDays === 1) return { text: "Paid next day", days: 1 };
  if (diffDays < 0)
    return {
      text: `Paid ${Math.abs(diffDays)} days early`,
      days: diffDays,
    };
  return { text: `Paid after ${diffDays} days`, days: diffDays };
}

/**
 * Get display text for payment method
 */
export function getPaymentMethodDisplay(method: string): string {
  switch (method) {
    case "eft":
      return "EFT";
    case "e-transfer":
      return "E-Transfer";
    case "cheque":
      return "Cheque";
    case "credit-card":
      return "Credit Card";
    case "other":
      return "Other";
    default:
      return method;
  }
}

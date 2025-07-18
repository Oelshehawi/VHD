import clsx from "clsx";
import { format } from "date-fns-tz";
import { twMerge } from "tailwind-merge";

export const formatDate = (dateString: any) => {
  const parts = dateString.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${month}/${day}/${year}`;
};

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    year: "numeric", // numeric year (e.g., '2023')
    month: "2-digit", // abbreviated month name (e.g., 'Oct')
    day: "2-digit", // numeric day of the month (e.g., '25')
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-CA",
    dateTimeOptions
  );

  const formattedDateDay: string = new Date(dateString).toLocaleString(
    "en-CA",
    dateDayOptions
  );

  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-CA",
    dateOptions
  );

  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-CA",
    timeOptions
  );

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
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

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export function encryptId(id: string) {
  return btoa(id);
}

export const getTransactionStatus = (date: Date) => {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  return date > twoDaysAgo ? "Processing" : "Success";
};

export const formatDateToString = (dateString: string) => {
  const [year, month, day] = dateString.split("-");

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

export const formatLocalDateTime = (localeString: string) => {
  const parsedDate = new Date(localeString);
  if (isNaN(parsedDate.getTime())) {
    return "";
  }
  return format(parsedDate, "yyyy-MM-dd'T'HH:mm");
};

export const calculateSubtotal = (items: any[]) =>
  items.reduce((acc, item) => acc + item.price, 0);

export const calculateGST = (subtotal: number) => subtotal * 0.05;

export const formatDateFns = (date: string | Date): string => {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  return format(parsedDate, "MMMM do, yyyy", { timeZone: "UTC" }); // e.g., "October 15th, 2024"
};


// Will take in a UTC date and keeep the date in the utc date
export const formatDateFnsUTC = (date: string | Date): string => {
  return format(date, "MMMM do, yyyy", { timeZone: "UTC" }); // e.g., "October 15th, 2024"
};

/**
 * Calculate job duration based on invoice price (business rule)
 * @param totalPrice - Total price of the invoice
 * @returns Duration in minutes
 */
export function calculateJobDurationFromPrice(totalPrice: number): number {
  if (totalPrice <= 350) return 90;  // 1.5 hours
  if (totalPrice < 600) return 150;  // 2.5 hours
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





import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export const formatDate = (dateString) => {
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

export const isNumberKey = (evt) => {
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

export const formatDateToString = (dateString) => {
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

  const monthName = monthNames[parseInt(month, 10) - 1]; // subtract 1 because array is zero-indexed

  return `${monthName} ${parseInt(day, 10)}, ${year}`; // parseInt removes leading zeros from the day
};

export const isTextKey = (evt) => {
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

export const formatPhoneNumber = (phoneNumber) => {
  if (phoneNumber.length === 10) {
    return `(${phoneNumber.substring(0, 3)})-${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
  }
  return phoneNumber;
};

export const calculateDueDate = (issuedDate, freq) => {
  if (issuedDate && freq) {
    const dueDate = new Date(issuedDate);
    const monthsToAdd = Math.floor(12 / parseInt(freq));
    dueDate.setUTCMonth(dueDate.getUTCMonth() + monthsToAdd);

    return dueDate.toISOString().split("T")[0];
  }
  return;
};

export const monthNameToNumber = (monthName) => {
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

export const generatePagination = (currentPage, totalPages) => {
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

export const formatLocalDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
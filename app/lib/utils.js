export const formatDate = (dateString) => {
  const parts = dateString.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${month}/${day}/${year}`;
};

export const isNumberKey = (evt) => {
  var charCode = evt.which ? evt.which : evt.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault();
    return false;
  }
  return true;
};

export const formatDateToString = (dateString) => {
  const [year, month, day] = dateString.split('-');

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = monthNames[parseInt(month, 10) - 1]; // subtract 1 because array is zero-indexed

  return `${monthName} ${parseInt(day, 10)}, ${year}`; // parseInt removes leading zeros from the day
}

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

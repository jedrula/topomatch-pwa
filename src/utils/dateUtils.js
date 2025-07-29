/**
 * Utility functions for date formatting and handling
 */

/**
 * Formats a date for display, handling various input formats including Firestore timestamps
 * @param {Date|Object|string|number} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "Unknown";

  let dateObj;

  // Handle different timestamp formats
  if (date.toDate) {
    // Firestore Timestamp with toDate method
    dateObj = date.toDate();
  } else if (date._seconds !== undefined) {
    // Serialized Firestore Timestamp with _seconds and _nanoseconds
    dateObj = new Date(date._seconds * 1000 + (date._nanoseconds || 0) / 1000000);
  } else {
    // Regular date string or number
    dateObj = new Date(date);
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn("Invalid date received:", date);
    return "Invalid date";
  }

  // Default formatting options
  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Formats a date in short format (for lists and compact displays)
 * @param {Date|Object|string|number} date - The date to format
 * @returns {string} Short formatted date string
 */
export const formatDateShort = (date) => {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Checks if two dates are the same day (ignoring time)
 * @param {Date|Object|string|number} date1 - First date
 * @param {Date|Object|string|number} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
export const isSameDate = (date1, date2) => {
  if (!date1 || !date2) return false;

  // Convert both dates to Date objects
  let dateObj1, dateObj2;

  // Handle date1
  if (date1.toDate) {
    dateObj1 = date1.toDate();
  } else if (date1._seconds !== undefined) {
    dateObj1 = new Date(date1._seconds * 1000 + (date1._nanoseconds || 0) / 1000000);
  } else {
    dateObj1 = new Date(date1);
  }

  // Handle date2
  if (date2.toDate) {
    dateObj2 = date2.toDate();
  } else if (date2._seconds !== undefined) {
    dateObj2 = new Date(date2._seconds * 1000 + (date2._nanoseconds || 0) / 1000000);
  } else {
    dateObj2 = new Date(date2);
  }

  // Check if dates are valid
  if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) {
    return false;
  }

  // Compare year, month, and day
  return (
    dateObj1.getFullYear() === dateObj2.getFullYear() &&
    dateObj1.getMonth() === dateObj2.getMonth() &&
    dateObj1.getDate() === dateObj2.getDate()
  );
};

/**
 * Checks if two dates/timestamps are exactly the same (including time)
 * @param {Date|Object|string|number} date1 - First date
 * @param {Date|Object|string|number} date2 - Second date
 * @returns {boolean} True if dates are exactly the same
 */
export const isSameDateTime = (date1, date2) => {
  if (!date1 || !date2) return false;

  // Convert both dates to Date objects
  let dateObj1, dateObj2;

  // Handle date1
  if (date1.toDate) {
    dateObj1 = date1.toDate();
  } else if (date1._seconds !== undefined) {
    dateObj1 = new Date(date1._seconds * 1000 + (date1._nanoseconds || 0) / 1000000);
  } else {
    dateObj1 = new Date(date1);
  }

  // Handle date2
  if (date2.toDate) {
    dateObj2 = date2.toDate();
  } else if (date2._seconds !== undefined) {
    dateObj2 = new Date(date2._seconds * 1000 + (date2._nanoseconds || 0) / 1000000);
  } else {
    dateObj2 = new Date(date2);
  }

  // Check if dates are valid
  if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) {
    return false;
  }

  // Compare exact timestamps
  return dateObj1.getTime() === dateObj2.getTime();
};

/**
 * Formats a date relative to now (e.g., "2 days ago", "yesterday")
 * @param {Date|Object|string|number} date - The date to format
 * @returns {string} Relative date string
 */
export const formatDateRelative = (date) => {
  if (!date) return "Unknown";

  let dateObj;
  if (date.toDate) {
    dateObj = date.toDate();
  } else if (date._seconds !== undefined) {
    dateObj = new Date(date._seconds * 1000 + (date._nanoseconds || 0) / 1000000);
  } else {
    dateObj = new Date(date);
  }

  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const diffInMs = now - dateObj;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return formatDateShort(date);
  }
};

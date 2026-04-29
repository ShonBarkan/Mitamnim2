/**
 * Utility functions for handling and grouping activity dates.
 */

/**
 * Formats a date string to a human-readable day label.
 * @param {string} dateStr - ISO date string
 * @returns {string} "Today", "Yesterday" or "DD/MM/YYYY"
 */
export const getDayLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(date, today)) return "היום";
  if (isSameDay(date, yesterday)) return "אתמול";

  return date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Groups a flat list of activity logs by their date.
 * @param {Array} logs - Array of activity log objects
 * @returns {Object} { "DateLabel": [logs...] }
 */
export const groupLogsByDate = (logs) => {
  if (!logs || !Array.isArray(logs)) return {};

  return logs.reduce((groups, log) => {
    const dateLabel = getDayLabel(log.timestamp);
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(log);
    return groups;
  }, {});
};

/**
 * Formats a timestamp to HH:mm.
 * @param {string} dateStr 
 * @returns {string} HH:mm
 */
export const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};
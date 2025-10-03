/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * (not UTC to avoid date shifting issues)
 */
export function formatDateForAPI(date: Date | null | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayForAPI(): string {
  return formatDateForAPI(new Date());
}

/**
 * Get date N days ago in YYYY-MM-DD format (local timezone)
 */
export function getDaysAgoForAPI(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForAPI(date);
}


/**
 * Formats a number as Philippine peso currency with proper comma separation
 * @param amount - The numeric amount to format (null/undefined defaults to 0)
 * @returns Formatted currency string (e.g., "₱1,234.56")
 */
export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a number with commas but no currency symbol
 * @param amount - The numeric amount to format (null/undefined defaults to 0)
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

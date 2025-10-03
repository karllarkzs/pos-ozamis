/**
 * Formats a number as Philippine peso currency with proper comma separation
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "₱1,234.56")
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a number with commas but no currency symbol
 * @param amount - The numeric amount to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(amount: number): string {
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

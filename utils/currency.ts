/**
 * Currency formatting utilities for Indian Rupees (₹)
 */

/**
 * Formats a number as Indian Rupees with proper formatting
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "₹1,234.56")
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: {
    showDecimals?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showDecimals = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '₹0.00';
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? minimumFractionDigits : 0,
    maximumFractionDigits: showDecimals ? maximumFractionDigits : 0,
  }).format(numAmount);

  return formatted;
}

/**
 * Formats a number as Indian Rupees without the currency symbol (just the number with formatting)
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Formats a price range (e.g., "From ₹1,234.56" or "₹1,234.56 - ₹2,345.67")
 */
export function formatPriceRange(
  min: number,
  max?: number
): string {
  if (max && max !== min) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  return `From ${formatCurrency(min)}`;
}







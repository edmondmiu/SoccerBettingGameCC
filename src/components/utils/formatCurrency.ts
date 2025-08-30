export function formatCurrency(amount: number, includeDecimals: boolean = false): string {
  // Handle edge cases
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return includeDecimals ? '0.00' : '0';
  }
  
  // Ensure we have a positive number to work with
  const absAmount = Math.abs(amount);
  const roundedAmount = includeDecimals ? Math.round(absAmount * 100) / 100 : Math.floor(absAmount);
  
  // For numbers less than 1000, never use locale formatting - just return the string
  if (roundedAmount < 1000) {
    if (includeDecimals) {
      return roundedAmount.toFixed(2);
    } else {
      return roundedAmount.toString();
    }
  }
  
  // For numbers 1000 and above, use locale formatting with commas
  try {
    return roundedAmount.toLocaleString('en-US', {
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
      useGrouping: true
    });
  } catch (error) {
    // Fallback if toLocaleString fails
    return includeDecimals ? roundedAmount.toFixed(2) : roundedAmount.toString();
  }
}

// Helper function specifically for button text (always integers, no decimals)
export function formatCurrencyForButton(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return '0';
  }
  
  const roundedAmount = Math.floor(Math.abs(amount));
  
  if (roundedAmount < 1000) {
    return roundedAmount.toString();
  }
  
  try {
    return roundedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    });
  } catch (error) {
    return roundedAmount.toString();
  }
}
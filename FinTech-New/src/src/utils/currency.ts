export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'BDT':
      return '৳';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'EUR':
      return '€';
    case 'CAD':
      return 'C$';
    default:
      return currency;
  }
};

export const formatCurrency = (amount: number, currency: string) => {
  const symbol = getCurrencySymbol(currency);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol'
  }).format(Math.abs(amount)).replace(currency, symbol);
}; 
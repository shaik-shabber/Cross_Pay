const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
];

const getCurrencyByCode = (code) => {
  return CURRENCIES.find((c) => c.code === code);
};

export { CURRENCIES, getCurrencyByCode };
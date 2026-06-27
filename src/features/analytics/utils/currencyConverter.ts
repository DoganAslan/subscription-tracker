const EXCHANGE_RATES: Record<string, number> = {
  TRY: 1,
  USD: 32.5,
  EUR: 35.2,
  GBP: 41.5,
  CAD: 23.8,
  AUD: 21.5,
  JPY: 0.21,
  CHF: 36.1,
  CNY: 4.5,
  SEK: 3.1,
  NZD: 19.8,
  MXN: 1.9,
  SGD: 24.1,
  HKD: 4.1,
  NOK: 3.0,
  KRW: 0.024,
  DKK: 4.7,
  INR: 0.39,
  RUB: 0.35,
  ZAR: 1.7
};

export const convertToTRY = (amount: number, currency: string): number => {
  const rate = EXCHANGE_RATES[currency.toUpperCase()] || 1;
  return amount * rate;
};

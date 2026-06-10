import AsyncStorage from '@react-native-async-storage/async-storage';

// API documentation: https://api.frankfurter.app/
const API_URL = 'https://api.frankfurter.app/latest?base=USD';

// Hardcoded static fallback rates relative to USD (approximate values)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  TRY: 32.50,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 156.0,
  CAD: 1.36,
  AUD: 1.51,
  CHF: 0.90,
  CNY: 7.24,
  SEK: 10.50,
  NZD: 1.63,
  MXN: 16.80,
  SGD: 1.35,
  HKD: 7.81,
  NOK: 10.60,
  KRW: 1360.0,
  DKK: 6.85,
  INR: 83.50,
  RUB: 91.0,
  ZAR: 18.50,
};

class CurrencyService {
  private rates: Record<string, number> = { ...FALLBACK_RATES };
  private lastFetch: number = 0;
  private readonly CACHE_KEY = '@subscription_tracker_currency_rates';
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    this.loadCachedRates();
  }

  private async loadCachedRates() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        this.rates = { ...FALLBACK_RATES, ...rates };
        this.lastFetch = timestamp;
      }
      this.fetchRates(); // Fire and forget update
    } catch (error) {
      console.warn('Failed to load cached rates:', error);
      this.fetchRates();
    }
  }

  public async fetchRates() {
    const now = Date.now();
    // Only fetch once per day
    if (now - this.lastFetch < this.CACHE_DURATION) {
      return;
    }

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data && data.rates) {
        // Frankfurter doesn't include the base currency in the rates object
        const newRates = { ...data.rates, USD: 1.0 };
        this.rates = { ...FALLBACK_RATES, ...newRates };
        this.lastFetch = now;
        
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify({
          rates: newRates,
          timestamp: now
        }));
      }
    } catch (error) {
      console.warn('Currency API fetch failed. Using fallbacks/cached rates.', error);
    }
  }

  public convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    const rateFrom = this.rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
    const rateTo = this.rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1;
    
    // Convert to USD first (base), then to target
    const amountInUSD = amount / rateFrom;
    return amountInUSD * rateTo;
  }
}

export const currencyService = new CurrencyService();

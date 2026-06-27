import AsyncStorage from '@react-native-async-storage/async-storage';

// Inverted Default Rates: Value of 1 TRY in Foreign Currency
export let CURRENCY_RATES: Record<string, number> = {
  TRY: 1.0, USD: 0.03, EUR: 0.027, GBP: 0.023, CAD: 0.042,
  AUD: 0.046, CHF: 0.027, CNY: 0.22, SEK: 0.32, KRW: 41.6,
  SAR: 0.11, AED: 0.11, INR: 2.56, RUB: 2.77, BRL: 0.16,
};

const CACHE_KEY = '@submate_rates_v1';
const CACHE_TIMESTAMP_KEY = '@submate_rates_ts_v1';
const TTL_MILLISECONDS = 12 * 60 * 60 * 1000; // 12 Hours

export const getMarketRatesWithCache = async (baseCurrency: string = 'TRY') => {
  let rates = null;
  try {
    // 1. Check Local Cache & Timestamp
    const cachedRates = await AsyncStorage.getItem(CACHE_KEY);
    const cachedTime = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedRates && cachedTime) {
      const cacheAge = Date.now() - parseInt(cachedTime, 10);

      // If cache is younger than 12 hours, serve immediately
      if (cacheAge < TTL_MILLISECONDS) {
        const ageInMinutes = Math.round(cacheAge / (1000 * 60));
        console.log(`Serving cached exchange rates (Age: ${ageInMinutes} mins). Network bypassed.`);
        rates = JSON.parse(cachedRates);
      }
    }

    if (!rates) {
      // 2. Cache expired or empty -> Fetch live from API
      console.log("Cache expired or empty. Fetching live rates from ExchangeRate-API...");
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      const data = await response.json();

      if (data && data.rates) {
        // 3. Save fresh snapshot to disk
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.rates));
        await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        rates = data.rates;
      } else if (cachedRates) {
        // 4. If live fetch returned malformed data, fallback to stale cache
        rates = JSON.parse(cachedRates);
      }
    }
  } catch (error) {
    // 5. OFFLINE FALLBACK: User has no internet. Serve stale cache safely without crashing.
    console.warn("Offline mode detected. Serving stale cache fallback.");
    const staleCache = await AsyncStorage.getItem(CACHE_KEY);
    if (staleCache) rates = JSON.parse(staleCache);
  }

  // 6. Absolute Doomsday Fallback (Prevents division by zero crashes)
  if (!rates) {
    rates = { TRY: 1, USD: 0.03, EUR: 0.027, GBP: 0.023 };
  }

  // Atomically update memory map
  CURRENCY_RATES = { ...CURRENCY_RATES, ...rates };
  return rates;
};

// Legacy sync function export alias so anything importing it still works before being swapped
export const syncLiveExchangeRates = async () => {
  await getMarketRatesWithCache('TRY');
};

export const convertCurrency = (amount: number, from: string, to: string): number => {
  const fromKey = String(from).toUpperCase().trim();
  const toKey = String(to).toUpperCase().trim();
  if (fromKey === toKey) return amount;
  
  const rateFromTRY = CURRENCY_RATES[fromKey] || 1;
  const rateToTRY = CURRENCY_RATES[toKey] || 1;
  
  // Cross-rate calculation based on 1 unit of base (TRY)
  return (amount / rateFromTRY) * rateToTRY;
};

import AsyncStorage from '@react-native-async-storage/async-storage';

// Inverted Default Rates: Value of 1 TRY in Foreign Currency
export let CURRENCY_RATES: Record<string, number> = {
  TRY: 1.0, USD: 0.03, EUR: 0.027, GBP: 0.023, CAD: 0.042,
  AUD: 0.046, CHF: 0.027, CNY: 0.22, SEK: 0.32, KRW: 41.6,
  SAR: 0.11, AED: 0.11, INR: 2.56, RUB: 2.77, BRL: 0.16,
};

const CACHE_KEY = '@submate_rates_v2';
const CACHE_EXPIRY_KEY = '@submate_rates_expiry_v2';

export const getMarketRatesWithDynamicCache = async (baseCurrency: string = 'TRY') => {
  let finalRates = null;
  try {
    // 1. Check Local Cache & Dynamic Expiry Timestamp
    const cachedRates = await AsyncStorage.getItem(CACHE_KEY);
    const cachedExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);

    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (cachedRates && cachedExpiry) {
      const expiryTimestamp = parseInt(cachedExpiry, 10);

      // If current time is strictly BEFORE the server's next scheduled update, cache is 100% valid
      if (nowInSeconds < expiryTimestamp) {
        const remainingMinutes = Math.round((expiryTimestamp - nowInSeconds) / 60);
        console.log(`⚡ Serving dynamically cached rates. Next remote sync in: ${remainingMinutes} mins. Network bypassed.`);
        finalRates = JSON.parse(cachedRates);
      }
    }

    if (!finalRates) {
      // 2. Cache is expired or empty -> Fetch live from API
      console.log(`🌐 Cache expired or empty. Syncing with remote API updates for ${baseCurrency}...`);
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      const data = await response.json();

      if (data && data.rates && data.time_next_update_unix) {
        // 3. EXTRACT DYNAMIC TTL FROM API METADATA
        // The server explicitly tells us exactly when the next data window opens
        const remoteExpiryTimestamp = data.time_next_update_unix; 
        
        // 4. Save snapshots to hardware disk
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.rates));
        await AsyncStorage.setItem(CACHE_EXPIRY_KEY, remoteExpiryTimestamp.toString());
        
        const dynamicWindowMinutes = Math.round((remoteExpiryTimestamp - nowInSeconds) / 60);
        console.log(`💾 Saved fresh rates. Cache locked dynamically for the next ${dynamicWindowMinutes} minutes based on server window.`);
        
        finalRates = data.rates;
      } else if (cachedRates) {
        // 5. Fallback mechanisms if live fetch fails or is malformed
        finalRates = JSON.parse(cachedRates);
      }
    }
  } catch (error) {
    console.warn("📴 Dynamic Engine: Offline mode triggered. Serving stale fallback cache.");
    const staleCache = await AsyncStorage.getItem(CACHE_KEY);
    if (staleCache) finalRates = JSON.parse(staleCache);
  }

  // Doomsday absolute fallback to prevent division by zero rendering crashes
  if (!finalRates) {
    finalRates = { TRY: 1, USD: 0.03, EUR: 0.027, GBP: 0.023 };
  }

  // Atomically update memory map for local synchronous conversions
  CURRENCY_RATES = { ...CURRENCY_RATES, ...finalRates };
  return finalRates;
};

// Legacy sync function export alias so anything importing it still works before being swapped
export const syncLiveExchangeRates = async () => {
  await getMarketRatesWithDynamicCache('TRY');
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

export const SUPPORTED_CURRENCIES = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'Amerikan Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
  { code: 'CAD', symbol: 'CA$', name: 'Kanada Doları' },
  { code: 'AUD', symbol: 'A$', name: 'Avustralya Doları' },
  { code: 'JPY', symbol: '¥', name: 'Japon Yeni' },
  { code: 'CHF', symbol: 'CHF', name: 'İsviçre Frangı' },
  { code: 'CNY', symbol: 'CN¥', name: 'Çin Yüanı' },
  { code: 'SAR', symbol: 'SAR', name: 'Suudi Riyali' },
  { code: 'AED', symbol: 'AED', name: 'BAE Dirhemi' },
  { code: 'RUB', symbol: '₽', name: 'Rus Rublesi' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaycan Manatı' },
  { code: 'SEK', symbol: 'kr', name: 'İsveç Kronu' },
  { code: 'NOK', symbol: 'kr', name: 'Norveç Kronu' },
  { code: 'DKK', symbol: 'kr', name: 'Danimarka Kronu' },
  { code: 'PLN', symbol: 'zł', name: 'Polonya Zlotisi' },
  { code: 'HUF', symbol: 'Ft', name: 'Macar Forinti' },
  { code: 'ILS', symbol: '₪', name: 'İsrail Şekeli' },
  { code: 'BRL', symbol: 'R$', name: 'Brezilya Reali' }
] as const;

export interface ExchangeRates {
  EUR: number;
  USD: number;
  TRY: number;
  [key: string]: number;
}

// 1. IEEE-754 Residual Drift Shield
export const exactAdd = (a: number, b: number): number => {
  return Math.round((a + b) * 100) / 100;
};




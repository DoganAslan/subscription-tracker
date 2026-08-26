import AsyncStorage from '@react-native-async-storage/async-storage';

// Inverted Default Rates: Value of 1 TRY in Foreign Currency
export let CURRENCY_RATES: Record<string, number> = {
  TRY: 1.0, USD: 0.03, EUR: 0.027, GBP: 0.023, CAD: 0.042,
  AUD: 0.046, CHF: 0.027, CNY: 0.22, SEK: 0.32, KRW: 41.6,
  SAR: 0.11, AED: 0.11, INR: 2.56, RUB: 2.77, BRL: 0.16,
};

const CACHE_KEY = '@submate_rates_v2';
const CACHE_EXPIRY_KEY = '@submate_rates_expiry_v2';
let inFlightRateRequest: Promise<ExchangeRates> | null = null;

const sanitizeRates = (candidate: unknown): Record<string, number> | null => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const validEntries: [string, number][] = [];
  for (const [currency, rate] of Object.entries(candidate as Record<string, unknown>)) {
    if (
      /^[A-Z]{3}$/.test(currency)
      && typeof rate === 'number'
      && Number.isFinite(rate)
      && rate > 0
    ) {
      validEntries.push([currency, rate]);
    }
  }
  return validEntries.length > 0 ? Object.fromEntries(validEntries) : null;
};

const loadMarketRates = async (): Promise<ExchangeRates> => {
  let finalRates: Record<string, number> | null = null;
  let cachedRates: string | null = null;
  try {
    // 1. Check Local Cache & Dynamic Expiry Timestamp
    cachedRates = await AsyncStorage.getItem(CACHE_KEY);
    const cachedExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);

    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (cachedRates && cachedExpiry) {
      const expiryTimestamp = parseInt(cachedExpiry, 10);

      // If current time is strictly BEFORE the server's next scheduled update, cache is 100% valid
      if (nowInSeconds < expiryTimestamp) {
        finalRates = sanitizeRates(JSON.parse(cachedRates));
      }
    }

    if (!finalRates) {
      // 2. Cache is expired or empty -> Fetch live from API with 4s timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      let response: Response;
      try {
        response = await fetch('https://open.er-api.com/v6/latest/TRY', { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}`);
      const data = await response.json() as { rates?: unknown; time_next_update_unix?: unknown };
      const remoteRates = sanitizeRates(data.rates);

      if (remoteRates && typeof data.time_next_update_unix === 'number') {
        // 3. EXTRACT DYNAMIC TTL FROM API METADATA
        // The server explicitly tells us exactly when the next data window opens
        const remoteExpiryTimestamp = data.time_next_update_unix;
        
        // 4. Save snapshots to hardware disk
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remoteRates));
        await AsyncStorage.setItem(CACHE_EXPIRY_KEY, remoteExpiryTimestamp.toString());

        finalRates = remoteRates;
      } else if (cachedRates) {
        // 5. Fallback mechanisms if live fetch fails or is malformed
        finalRates = sanitizeRates(JSON.parse(cachedRates));
      }
    }
  } catch (error) {
    console.warn('Exchange-rate sync failed; cached rates will be used.', error);
    const staleCache = cachedRates ?? await AsyncStorage.getItem(CACHE_KEY);
    if (staleCache) {
      try {
        finalRates = sanitizeRates(JSON.parse(staleCache));
      } catch {
        finalRates = null;
      }
    }
  }

  // Doomsday absolute fallback to prevent division by zero rendering crashes
  if (!finalRates) {
    finalRates = { TRY: 1, USD: 0.03, EUR: 0.027, GBP: 0.023 };
  }

  // Atomically update memory map for local synchronous conversions
  const mergedRates = { ...CURRENCY_RATES, ...finalRates } as ExchangeRates;
  CURRENCY_RATES = mergedRates;
  return mergedRates;
};

export const getMarketRatesWithDynamicCache = async (_baseCurrency: string = 'TRY'): Promise<ExchangeRates> => {
  if (inFlightRateRequest) return inFlightRateRequest;
  inFlightRateRequest = loadMarketRates();
  try {
    return await inFlightRateRequest;
  } finally {
    inFlightRateRequest = null;
  }
};

// Legacy sync function export alias so anything importing it still works before being swapped
export const syncLiveExchangeRates = async () => {
  await getMarketRatesWithDynamicCache();
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


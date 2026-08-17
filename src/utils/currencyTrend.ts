// src/utils/currencyTrend.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@submate_rate_trends';

export interface CurrencyTrendCache {
  timestamp: string;
  rates: Record<string, number>;
}

export function calculateInflationAdjustedSpend(
  monthlyAmount: number,
  annualInflationRatePercent: number = 45.0
): { nominalYearly: number; realAdjustedYearly: number; inflationCost: number } {
  const nominalYearly = monthlyAmount * 12;
  const inflationMultiplier = 1 + (annualInflationRatePercent / 100);
  const realAdjustedYearly = nominalYearly * inflationMultiplier;
  const inflationCost = realAdjustedYearly - nominalYearly;

  return {
    nominalYearly: Number(nominalYearly.toFixed(2)),
    realAdjustedYearly: Number(realAdjustedYearly.toFixed(2)),
    inflationCost: Number(inflationCost.toFixed(2)),
  };
}

export async function saveRateTrendCache(rates: Record<string, number>): Promise<void> {
  try {
    const payload: CurrencyTrendCache = {
      timestamp: new Date().toISOString(),
      rates,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save rate trend cache:', e);
  }
}

export async function getRateTrendCache(): Promise<CurrencyTrendCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrencyTrendCache;
  } catch (e) {
    return null;
  }
}

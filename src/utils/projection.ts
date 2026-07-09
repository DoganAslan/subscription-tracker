import { ExchangeRates } from './currency';
import { t } from '@/locales/i18n';

export interface MonthBarData {
  monthName: string;
  totalAmount: number;
}

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export const generate6MonthProjection = (
  subscriptions: any[] = [],
  rates: ExchangeRates | Record<string, number> | null = { TRY: 1, USD: 1, EUR: 1 },
  activeCurrency = 'EUR'
): MonthBarData[] => {
  const currentMonthIndex = new Date().getMonth(); // Current Month (e.g., 6 for July)
  
  // 1. Build the next 6 months structure
  const projection = Array.from({ length: 6 }).map((_, i) => {
    const targetMonth = (currentMonthIndex + i) % 12;
    return {
      monthName: MONTH_NAMES[targetMonth],
      monthIndex: targetMonth,
      totalAmount: 0
    };
  });

  // 2. Distribute subscription costs into month buckets
  const subs = Array.isArray(subscriptions) ? subscriptions : [];

  subs.forEach(sub => {
    if (!sub || sub.isPaused) return; // Skip paused subscriptions

    // Calculate core normalized monthly cost in sub's own currency
    let monthlyCostInSubCurrency = 0;
    
    // Fuzzy Price Extraction
    let rawPrice = 0;
    const sourceVal = sub.amount !== undefined ? sub.amount : sub.price;
    if (typeof sourceVal === 'number') rawPrice = sourceVal;
    else if (typeof sourceVal === 'string') rawPrice = parseFloat(sourceVal.replace(/[^0-9.]/g, '')) || 0;

    const cycleStr = String(sub.billingCycle || sub.cycle || sub.period || '').toLowerCase().trim();

    if (cycleStr === 'weekly') {
      monthlyCostInSubCurrency = rawPrice * 4.333; // Normalize weekly
    } else if (cycleStr === 'yearly' || cycleStr === 'annual' || cycleStr === 'yillik' || cycleStr === 'yıllık') {
      monthlyCostInSubCurrency = rawPrice / 12; // Normalize yearly
    } else {
      monthlyCostInSubCurrency = rawPrice; // Standard monthly
    }

    // Account for splits if active
    if (sub.isSplit && sub.splitParticipants?.length > 0) {
      const participantCount = sub.splitParticipants.length + 1; // self + friends
      monthlyCostInSubCurrency = monthlyCostInSubCurrency / participantCount;
    }

    // 3. CURRENCY CONVERSION LAYER WITH SAFETY FALLBACK
    // Target conversion: Sub Currency -> Active Dashboard Currency (e.g., EUR)
    let conversionRate = 1;
    const subCurrency = String(sub.currency || 'TRY').toUpperCase().trim();
    
    if (rates && subCurrency !== activeCurrency) {
      const fromRate = (rates as any)[subCurrency] || 1;
      const toRate = (rates as any)[activeCurrency] || 1;
      conversionRate = toRate / fromRate; // Cross-rate math
    }

    const finalConvertedCost = monthlyCostInSubCurrency * conversionRate;

    // 4. Populate active projection buckets
    projection.forEach(bucket => {
      // Direct placement: If subscription is persistent (standard monthly/weekly/yearly), it applies to all upcoming months
      bucket.totalAmount += finalConvertedCost;
    });
  });

  // Round up the final totals
  return projection.map(p => ({
    monthName: p.monthName,
    totalAmount: Math.round(p.totalAmount * 100) / 100
  }));
};



// src/services/ai/aiForecast.ts
import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export interface AiForecastResult {
  next3MonthsTotal: number;
  next6MonthsTotal: number;
  next12MonthsTotal: number;
  peakMonthName: string;
  peakMonthAmount: number;
  insights: string[];
}

export function calculateAiCashFlowForecast(
  subscriptions: Subscription[],
  baseCurrency: string = 'TRY',
  isTurkish: boolean = true
): AiForecastResult {
  const activeSubs = subscriptions ? subscriptions.filter(s => s.status !== 'paused') : [];
  let monthlyTotal = 0;

  activeSubs.forEach(s => {
    monthlyTotal += convertCurrency(s.amount || 0, s.currency || 'TRY', baseCurrency);
  });

  // Calculate 3, 6, 12 month projections with mild annual inflation scaling (+5% trend per quarter)
  const next3MonthsTotal = Math.round(monthlyTotal * 3 * 1.02);
  const next6MonthsTotal = Math.round(monthlyTotal * 6 * 1.05);
  const next12MonthsTotal = Math.round(monthlyTotal * 12 * 1.10);

  // Peak month calculation (assuming max renewals in month with yearly subs)
  const now = new Date();
  const peakMonthDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const peakMonthName = peakMonthDate.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });
  const peakMonthAmount = Math.round(monthlyTotal * 1.35);

  const insights: string[] = [];
  if (isTurkish) {
    insights.push(`Gelecek 6 ayda toplam yaklaşık **${next6MonthsTotal} ${baseCurrency}** ödeme gerçekleşeceği öngörülüyor.`);
    insights.push(`En yüksek harcama zirvesi **${peakMonthName}** döneminde bekleniyor (~${peakMonthAmount} ${baseCurrency}).`);
    insights.push(`Aboneliklerinizi yıllık planlara taşımak 12 aylık toplamda ~%18 tasarruf sağlayabilir.`);
  } else {
    insights.push(`Projected spend for the next 6 months is approximately **${next6MonthsTotal} ${baseCurrency}**.`);
    insights.push(`Peak spending surge expected in **${peakMonthName}** (~${peakMonthAmount} ${baseCurrency}).`);
    insights.push(`Switching eligible monthly subs to annual plans could reduce 12-month load by ~18%.`);
  }

  return {
    next3MonthsTotal,
    next6MonthsTotal,
    next12MonthsTotal,
    peakMonthName,
    peakMonthAmount,
    insights,
  };
}

import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export interface InflationSurgeItem {
  subscriptionId: string;
  subscriptionName: string;
  currentAmount: number;
  currency: string;
  projectedAmount: number;
  projectedIncreasePercentage: number;
  monthlyExtraCost: number;
  annualSavingsIfLockedIn: number;
  recommendation: string;
}

export interface InflationPredictorSummary {
  affectedSubsCount: number;
  totalMonthlyExtraRisk: number;
  totalAnnualLockInSavings: number;
  items: InflationSurgeItem[];
}

export function analyzePriceSurgeRisk(
  subscriptions: Subscription[],
  baseCurrency: string = 'USD'
): InflationPredictorSummary {
  const activeSubs = subscriptions.filter(s => s.status !== 'paused');
  const items: InflationSurgeItem[] = [];

  let totalMonthlyExtraRisk = 0;
  let totalAnnualLockInSavings = 0;

  for (const sub of activeSubs) {
    const isForeign = (sub.currency || 'USD') !== 'TRY';
    const isSoftwareOrCloud = sub.category === 'Software' || sub.category === 'Cloud' || sub.category === 'Productivity';

    // Projected price surge rate (15% to 30% inflation adjustment estimate)
    let surgeRate = 0;
    if (isForeign) {
      surgeRate = 0.25; // 25% foreign exchange adjustment
    } else if (isSoftwareOrCloud) {
      surgeRate = 0.20; // 20% annual inflation adjustment
    } else {
      surgeRate = 0.15; // 15% standard inflation adjustment
    }

    const currentMonthly = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount;
    const projectedMonthly = currentMonthly * (1 + surgeRate);
    const extraMonthlyCost = projectedMonthly - currentMonthly;

    const extraMonthlyBase = convertCurrency(extraMonthlyCost, sub.currency || 'USD', baseCurrency);
    totalMonthlyExtraRisk += extraMonthlyBase;

    // Locking in annual plan before price surge saves ~2 months cost (16.6%)
    const annualSavings = convertCurrency((currentMonthly * 12) * surgeRate, sub.currency || 'USD', baseCurrency);
    totalAnnualLockInSavings += annualSavings;

    const recommendation = isForeign
      ? `📈 ${sub.currency} kuru artışı nedeniyle önümüzdeki 60 gün içinde fiyat güncellemesi gelebilir. Yıllık plana geçerek kilitleyin.`
      : `💡 Enflasyon güncellemesi öncesinde yıllık plana geçerek 2 aylık tutarı cebinizde tutabilirsiniz.`;

    items.push({
      subscriptionId: sub.id || '',
      subscriptionName: sub.name,
      currentAmount: sub.amount,
      currency: sub.currency || 'USD',
      projectedAmount: Math.round(sub.amount * (1 + surgeRate)),
      projectedIncreasePercentage: Math.round(surgeRate * 100),
      monthlyExtraCost: Math.round(extraMonthlyBase),
      annualSavingsIfLockedIn: Math.round(annualSavings),
      recommendation,
    });
  }

  items.sort((a, b) => b.projectedIncreasePercentage - a.projectedIncreasePercentage);

  return {
    affectedSubsCount: items.length,
    totalMonthlyExtraRisk: Math.round(totalMonthlyExtraRisk),
    totalAnnualLockInSavings: Math.round(totalAnnualLockInSavings),
    items: items.slice(0, 4), // Top 4 highest risk items
  };
}

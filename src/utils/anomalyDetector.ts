// src/utils/anomalyDetector.ts
import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from './currency';

export interface BudgetAnomaly {
  id: string;
  type: 'price_surge' | 'category_spike';
  subName: string;
  previousAmount?: number;
  currentAmount: number;
  currency: string;
  percentageIncrease?: number;
  message: string;
}

export function detectBudgetAnomalies(
  subscriptions: Subscription[],
  baseCurrency: string = 'TRY',
  isTurkish: boolean = true
): BudgetAnomaly[] {
  const anomalies: BudgetAnomaly[] = [];
  if (!subscriptions || subscriptions.length === 0) return anomalies;

  const activeSubs = subscriptions.filter(s => s.status !== 'paused');

  activeSubs.forEach(sub => {
    // Check price history for price surge
    if (sub.priceHistory && sub.priceHistory.length >= 2) {
      const sorted = [...sub.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = sorted[0].amount;
      const previous = sorted[1].amount;

      if (latest > previous) {
        const increasePct = Math.round(((latest - previous) / previous) * 100);
        anomalies.push({
          id: `anomaly-surge-${sub.id}`,
          type: 'price_surge',
          subName: sub.name,
          previousAmount: previous,
          currentAmount: latest,
          currency: sub.currency || 'TRY',
          percentageIncrease: increasePct,
          message: isTurkish
            ? `"${sub.name}" aboneliğinde %${increasePct} fiyat artışı tespit edildi (${previous} → ${latest} ${sub.currency}).`
            : `Detected %${increasePct} price surge on "${sub.name}" (${previous} → ${latest} ${sub.currency}).`,
        });
      }
    }

    // High single sub spend anomaly (e.g. > 1500 TRY)
    const convertedMonthly = convertCurrency(sub.amount || 0, sub.currency || 'TRY', baseCurrency);
    if (convertedMonthly >= 1500) {
      anomalies.push({
        id: `anomaly-high-${sub.id}`,
        type: 'category_spike',
        subName: sub.name,
        currentAmount: sub.amount,
        currency: sub.currency || 'TRY',
        message: isTurkish
          ? `"${sub.name}" yüksek tutarlı bir kalem (${convertedMonthly.toFixed(0)} ${baseCurrency}/ay). İptal/paket düşürme seçeneklerini değerlendirin.`
          : `"${sub.name}" is a heavy subscription line (${convertedMonthly.toFixed(0)} ${baseCurrency}/mo). Consider downgrading or pausing.`,
      });
    }
  });

  return anomalies;
}

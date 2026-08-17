// src/utils/heatmap.ts
import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from './currency';

export interface DayHeatmapData {
  dayNumber: number;
  totalSpent: number;
  subscriptions: Subscription[];
  intensityLevel: 0 | 1 | 2 | 3;
}

export function generateMonthlyHeatmap(
  subscriptions: Subscription[],
  baseCurrency: string = 'TRY'
): DayHeatmapData[] {
  const days: DayHeatmapData[] = [];
  const activeSubs = subscriptions ? subscriptions.filter(s => s.status !== 'paused') : [];

  // Map spending per day 1 to 31
  const dayMap: Record<number, { total: number; subs: Subscription[] }> = {};
  for (let d = 1; d <= 31; d++) {
    dayMap[d] = { total: 0, subs: [] };
  }

  activeSubs.forEach(sub => {
    if (!sub.renewalDate) return;
    const rawDate = typeof (sub.renewalDate as any)?.toDate === 'function'
      ? (sub.renewalDate as any).toDate()
      : new Date(sub.renewalDate as any);

    if (isNaN(rawDate.getTime())) return;
    const day = rawDate.getDate();

    if (day >= 1 && day <= 31) {
      const converted = convertCurrency(sub.amount || 0, sub.currency || 'TRY', baseCurrency);
      dayMap[day].total += converted;
      dayMap[day].subs.push(sub);
    }
  });

  // Calculate max daily spend for scaling
  const maxSpend = Math.max(...Object.values(dayMap).map(v => v.total), 0);

  for (let d = 1; d <= 31; d++) {
    const totalSpent = dayMap[d].total;
    let intensityLevel: 0 | 1 | 2 | 3 = 0;

    if (totalSpent > 0) {
      if (maxSpend > 0) {
        const ratio = totalSpent / maxSpend;
        if (ratio > 0.66) intensityLevel = 3;
        else if (ratio > 0.33) intensityLevel = 2;
        else intensityLevel = 1;
      } else {
        intensityLevel = 1;
      }
    }

    days.push({
      dayNumber: d,
      totalSpent: Number(totalSpent.toFixed(2)),
      subscriptions: dayMap[d].subs,
      intensityLevel,
    });
  }

  return days;
}

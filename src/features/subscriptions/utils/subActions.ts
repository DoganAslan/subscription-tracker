// src/features/subscriptions/utils/subActions.ts
import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export function bulkToggleSubscriptions(
  subscriptions: Subscription[],
  targetStatus: 'active' | 'paused'
): Subscription[] {
  if (!subscriptions) return [];
  return subscriptions.map(sub => ({
    ...sub,
    status: targetStatus,
  }));
}

export function filterSubscriptionsByTag(
  subscriptions: Subscription[],
  tag: string
): Subscription[] {
  if (!subscriptions || !tag) return subscriptions || [];
  const cleanTag = tag.trim().toLowerCase();
  return subscriptions.filter(sub => {
    const nameMatch = sub.name.toLowerCase().includes(cleanTag);
    const categoryMatch = sub.category?.toLowerCase().includes(cleanTag);
    const notesMatch = sub.notes?.toLowerCase().includes(cleanTag);
    return nameMatch || categoryMatch || notesMatch;
  });
}

export function calculateRolloverProjections(
  subscriptions: Subscription[],
  projectionMonths: number = 6,
  baseCurrency: string = 'TRY'
): { monthName: string; totalAmount: number }[] {
  const activeSubs = subscriptions ? subscriptions.filter(s => s.status !== 'paused') : [];
  const results: { monthName: string; totalAmount: number }[] = [];
  const now = new Date();

  for (let i = 0; i < projectionMonths; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = targetDate.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });

    let monthTotal = 0;
    activeSubs.forEach(sub => {
      const monthlyAmount = convertCurrency(sub.amount || 0, sub.currency || 'TRY', baseCurrency);
      monthTotal += monthlyAmount;
    });

    results.push({
      monthName,
      totalAmount: Number(monthTotal.toFixed(2)),
    });
  }

  return results;
}

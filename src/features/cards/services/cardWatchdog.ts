// src/features/cards/services/cardWatchdog.ts
import { Card, Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export interface CardHealthAnalysis {
  totalMonthlySpent: number;
  forecast7DaysSpent: number;
  limit: number;
  usedPercentage: number;
  isNearLimit: boolean; // >= 80%
  isOverLimit: boolean; // >= 100%
  isOverdrawRisk: boolean; // 7-day upcoming renewals threaten limit
  expiryFormatted: string;
  isExpiringSoon: boolean; // < 60 days
  isExpired: boolean;
}

export function analyzeCardHealth(
  card: Card,
  subscriptions: Subscription[],
  baseCurrency: string = 'TRY'
): CardHealthAnalysis {
  // 1. Calculate assigned monthly subscriptions total in card currency
  const assignedSubs = subscriptions.filter(
    s => s.status !== 'paused' && (s.cardId === card.id || s.assignedCardId === card.id)
  );

  let totalSpent = 0;
  let forecast7DaysSpent = 0;
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  assignedSubs.forEach(sub => {
    const subAmount = sub.amount || 0;
    const subCurrency = sub.currency || 'TRY';
    const converted = convertCurrency(subAmount, subCurrency, card.currency || baseCurrency);
    totalSpent += converted;

    // Check if renewal falls within 7 days
    if (sub.renewalDate) {
      const renDate = typeof (sub.renewalDate as any)?.toDate === 'function'
        ? (sub.renewalDate as any).toDate()
        : new Date(sub.renewalDate as any);

      if (!isNaN(renDate.getTime()) && renDate >= now && renDate <= next7Days) {
        forecast7DaysSpent += converted;
      }
    }
  });

  const limit = card.monthlyLimit || 0;
  const usedPercentage = limit > 0 ? Math.min(100, (totalSpent / limit) * 100) : 0;
  const isNearLimit = limit > 0 && usedPercentage >= 80 && usedPercentage < 100;
  const isOverLimit = limit > 0 && usedPercentage >= 100;
  const isOverdrawRisk = limit > 0 && (totalSpent + forecast7DaysSpent > limit);

  // 2. Expiry calculation
  let expiryFormatted = '--';
  let isExpiringSoon = false;
  let isExpired = false;

  if (card.expiryDate) {
    expiryFormatted = card.expiryDate;
    const parts = card.expiryDate.split('/');
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(`20${parts[1]}`, 10);

      if (!isNaN(month) && !isNaN(year)) {
        const expDate = new Date(year, month, 0); // Last day of expiry month
        const diffMs = expDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays < 0) {
          isExpired = true;
        } else if (diffDays <= 60) {
          isExpiringSoon = true;
        }
      }
    }
  } else if (card.expiryMonth && card.expiryYear) {
    const monthStr = String(card.expiryMonth).padStart(2, '0');
    const yearStr = String(card.expiryYear).slice(-2);
    expiryFormatted = `${monthStr}/${yearStr}`;
  }

  return {
    totalMonthlySpent: Number(totalSpent.toFixed(2)),
    forecast7DaysSpent: Number(forecast7DaysSpent.toFixed(2)),
    limit,
    usedPercentage: Math.round(usedPercentage),
    isNearLimit,
    isOverLimit,
    isOverdrawRisk,
    expiryFormatted,
    isExpiringSoon,
    isExpired,
  };
}

export function getOptimalCardForSubscription(
  cards: Card[],
  subscriptions: Subscription[],
  _subCurrency: string = 'TRY'
): { recommendedCard: Card | null; reason: string } {
  if (!cards || cards.length === 0) {
    return { recommendedCard: null, reason: 'Kayıtlı kart bulunamadı.' };
  }

  // Rank cards by available monthly limit capacity
  let bestCard: Card | null = null;
  let lowestUsage = Infinity;

  cards.forEach(card => {
    const health = analyzeCardHealth(card, subscriptions);
    if (!health.isExpired && health.usedPercentage < lowestUsage) {
      lowestUsage = health.usedPercentage;
      bestCard = card;
    }
  });

  if (bestCard) {
    return {
      recommendedCard: bestCard,
      reason: `%${lowestUsage} ile en yüksek boş limite sahip kart.`,
    };
  }

  return { recommendedCard: cards[0], reason: 'Varsayılan kart önerildi.' };
}

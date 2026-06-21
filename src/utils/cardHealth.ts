import { Card, Subscription } from '@/services/firebase/types';

/**
 * Calculates the total cost of all active subscriptions linked to a specific card for the current month.
 * Note: If a subscription is yearly, it divides the cost by 12. If weekly, it multiplies by 4.33, etc.
 */
export function getCardExpenses(cardId: string, subscriptions: Subscription[]): number {
  return subscriptions
    .filter(sub => sub.cardId === cardId && sub.status !== 'paused')
    .reduce((total, sub) => {
      let monthlyCost = sub.amount;
      
      switch (sub.billingCycle) {
        case 'weekly':
          monthlyCost = sub.amount * 4.333; // average weeks in a month
          break;
        case 'quarterly':
          monthlyCost = sub.amount / 3;
          break;
        case 'biannually':
          monthlyCost = sub.amount / 6;
          break;
        case 'yearly':
          monthlyCost = sub.amount / 12;
          break;
        case 'biennially':
          monthlyCost = sub.amount / 24;
          break;
        case 'monthly':
        default:
          monthlyCost = sub.amount;
          break;
      }
      
      return total + monthlyCost;
    }, 0);
}

/**
 * Safety check logic that flags a card as "Unhealthy" if totalExpenses > card.limit.
 * Also checks if the card is expired or nearing expiration.
 */
export function getCardHealthStatus(card: Card, subscriptions: Subscription[]): {
  isHealthy: boolean;
  totalExpenses: number;
  reason?: 'limit_exceeded' | 'expired' | 'nearing_expiry';
} {
  const totalExpenses = getCardExpenses(card.id!, subscriptions);
  
  if (totalExpenses > card.limit) {
    return { isHealthy: false, totalExpenses, reason: 'limit_exceeded' };
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  // Expiration check
  if (card.expiryYear < currentYear || (card.expiryYear === currentYear && card.expiryMonth < currentMonth)) {
    return { isHealthy: false, totalExpenses, reason: 'expired' };
  }
  
  // Nearing expiration (e.g. within 1 month)
  if (card.expiryYear === currentYear && card.expiryMonth === currentMonth) {
    return { isHealthy: false, totalExpenses, reason: 'nearing_expiry' };
  }
  
  return { isHealthy: true, totalExpenses };
}

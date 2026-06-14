import { Subscription, BillingCycle } from '@/services/firebase/types';
import { currencyService } from '@/services/currencyService';

export const getMonthlyCost = (amount: number, cycle: BillingCycle): number => {
  switch (cycle) {
    case 'weekly': return amount * (52 / 12);
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'biannually': return amount / 6;
    case 'yearly': return amount / 12;
    case 'biennially': return amount / 24;
    default: return amount;
  }
};

export const getYearlyCost = (amount: number, cycle: BillingCycle): number => {
  switch (cycle) {
    case 'weekly': return amount * 52;
    case 'monthly': return amount * 12;
    case 'quarterly': return amount * 4;
    case 'biannually': return amount * 2;
    case 'yearly': return amount;
    case 'biennially': return amount / 2;
    default: return amount;
  }
};

export interface DashboardMetrics {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
  mostExpensive: Subscription | null;
  upcomingRenewals: Subscription[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export const calculateMetrics = (subscriptions: Subscription[], baseCurrency: string = 'TRY'): DashboardMetrics => {
  if (!subscriptions || subscriptions.length === 0) {
    return {
      monthlyTotal: 0,
      yearlyTotal: 0,
      activeCount: 0,
      mostExpensive: null,
      upcomingRenewals: [],
      categoryBreakdown: []
    };
  }

  let monthlyTotal = 0;
  let yearlyTotal = 0;
  let mostExpensive: Subscription | null = null;
  let maxMonthlyCost = -1;
  const categoryMap: Record<string, number> = {};
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  const getNextRenewalDate = (currentRenewal: Date, cycle: BillingCycle): Date => {
    let nextDate = new Date(currentRenewal);
    // Move the date forward until it's today or in the future
    while (nextDate < today) {
      if (cycle === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (cycle === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (cycle === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (cycle === 'biannually') {
        nextDate.setMonth(nextDate.getMonth() + 6);
      } else if (cycle === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (cycle === 'biennially') {
        nextDate.setFullYear(nextDate.getFullYear() + 2);
      }
    }
    return nextDate;
  };

  const upcomingRenewals: Subscription[] = [];

  subscriptions.forEach(sub => {
    if (sub.status === 'paused') {
      return;
    }

    const convertedAmount = currencyService.convert(sub.amount, sub.currency || 'USD', baseCurrency);
    
    const monthlyCost = getMonthlyCost(convertedAmount, sub.billingCycle);
    const yearlyCost = getYearlyCost(convertedAmount, sub.billingCycle);

    monthlyTotal += monthlyCost;
    yearlyTotal += yearlyCost;

    if (monthlyCost > maxMonthlyCost) {
      maxMonthlyCost = monthlyCost;
      mostExpensive = sub;
    }

    categoryMap[sub.category] = (categoryMap[sub.category] || 0) + monthlyCost;

    const rawRenewal = sub.renewalDate.toDate();
    const nextRenewal = getNextRenewalDate(rawRenewal, sub.billingCycle);
    
    if (nextRenewal <= next30Days) {
      // Clone the subscription with the projected future date for accurate UI display
      // Needs type assertion since we are replacing the Timestamp with a plain Date momentarily 
      // or we can recreate the Timestamp. Let's just assign the original Timestamp equivalent.
      // Wait, we don't have access to Timestamp constructor here without importing.
      // The UI uses .toDate(), so if we overwrite it with an object that has .toDate(), it works.
      upcomingRenewals.push({
        ...sub,
        renewalDate: { toDate: () => nextRenewal, toMillis: () => nextRenewal.getTime() } as any
      });
    }
  });

  upcomingRenewals.sort((a, b) => a.renewalDate.toMillis() - b.renewalDate.toMillis());

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthlyTotal,
    yearlyTotal,
    activeCount: subscriptions.length,
    mostExpensive,
    upcomingRenewals,
    categoryBreakdown
  };
};

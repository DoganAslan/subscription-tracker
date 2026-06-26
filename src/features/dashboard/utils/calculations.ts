import { Subscription, BillingCycle } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';
import { parseSafeDate, getMidnight, addMonthsClamped } from '@/utils/dateHelpers';

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
  monthlyRecoverable: number;
  monthlyNetTotal: number;
  activeCount: number;
  mostExpensive: Subscription | null;
  upcomingRenewals: Subscription[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export const getNextRenewalDate = (currentRenewal: Date | any, cycle: BillingCycle): Date => {
  const parsedRenewal = parseSafeDate(currentRenewal);
  let nextDate = new Date(parsedRenewal);
  const originalDay = nextDate.getDate();
  const today = getMidnight(new Date());

  // Move the date forward until it's today or in the future
  while (getMidnight(nextDate).getTime() < today.getTime()) {
    if (cycle === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (cycle === 'monthly') {
      nextDate = addMonthsClamped(nextDate, 1, originalDay);
    } else if (cycle === 'quarterly') {
      nextDate = addMonthsClamped(nextDate, 3, originalDay);
    } else if (cycle === 'biannually') {
      nextDate = addMonthsClamped(nextDate, 6, originalDay);
    } else if (cycle === 'yearly') {
      nextDate = addMonthsClamped(nextDate, 12, originalDay);
    } else if (cycle === 'biennially') {
      nextDate = addMonthsClamped(nextDate, 24, originalDay);
    } else {
      break; // Safe exit loop fallback
    }
  }
  return nextDate;
};

export const calculateMetrics = (subscriptions: Subscription[], baseCurrency: string = 'TRY'): DashboardMetrics => {
  if (!subscriptions || subscriptions.length === 0) {
    return {
      monthlyTotal: 0,
      yearlyTotal: 0,
      monthlyRecoverable: 0,
      monthlyNetTotal: 0,
      activeCount: 0,
      mostExpensive: null,
      upcomingRenewals: [],
      categoryBreakdown: []
    };
  }

  let monthlyTotal = 0;
  let yearlyTotal = 0;
  let monthlyRecoverable = 0;
  let mostExpensive: Subscription | null = null;
  let maxMonthlyCost = -1;
  const categoryMap: Record<string, number> = {};
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);



  const upcomingRenewals: Subscription[] = [];

  subscriptions.forEach(sub => {
    if (sub.status === 'paused') {
      return;
    }

    const convertedAmount = convertCurrency(sub.amount, sub.currency || 'USD', baseCurrency);
    
    const monthlyCost = getMonthlyCost(convertedAmount, sub.billingCycle);
    const yearlyCost = getYearlyCost(convertedAmount, sub.billingCycle);

    monthlyTotal += monthlyCost;
    yearlyTotal += yearlyCost;

    const hasActiveSplit = sub.isSplit === true || String(sub.isSplit).toLowerCase() === 'true';

    if (hasActiveSplit && Array.isArray(sub.splitParticipants)) {
      sub.splitParticipants.forEach(p => {
        // 3. Absolute sanitation: strip any accidental letters/symbols and force to float
        const cleanAmountString = String(p.amount).replace(/[^0-9.]/g, '');
        const rawNum = parseFloat(cleanAmountString) || 0;
        const friendAmountConverted = convertCurrency(rawNum, sub.currency || 'USD', baseCurrency);
        const friendMonthlyCost = getMonthlyCost(friendAmountConverted, sub.billingCycle);
        monthlyRecoverable += friendMonthlyCost;
      });
    }

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
    monthlyRecoverable,
    monthlyNetTotal: Math.max(0, monthlyTotal - monthlyRecoverable),
    activeCount: subscriptions.length,
    mostExpensive,
    upcomingRenewals,
    categoryBreakdown
  };
};

export const getContractDoomStatus = (contractEndDate?: Date | string | null): { isDoomed: boolean; daysLeft: number | null } => {
  if (!contractEndDate) return { isDoomed: false, daysLeft: null };
  // Strictly apply Stage 1.2 rules: normalize both 'now' and 'target' to midnight 00:00:00 to prevent DST drift.
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(contractEndDate);
  target.setHours(0,0,0,0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    isDoomed: diffDays >= 0 && diffDays <= 30, // Trigger alarm if 30 days or less remaining!
    daysLeft: diffDays
  };
};

export interface FinancialHealthResult {
  score: number; // Clamped strictly between 0 and 100
  statusKey: string; // i18n key for status title
  adviceKeys: string[]; // Array of i18n keys for triggered warnings
}

export const calculateVampireScore = (subscriptions: any[], totalMonthlyCostTL: number): FinancialHealthResult => {
  if (!subscriptions || subscriptions.length === 0) {
    return { score: 100, statusKey: 'health.statusExcellent', adviceKeys: [] };
  }

  let currentScore = 100;
  const triggeredAdvice: string[] = [];

  // RULE 1: Contract Doom (Stage 4.1 check)
  const doomedCount = subscriptions.filter(s => !s.isPaused && getContractDoomStatus(s.contractEndDate).isDoomed).length;
  if (doomedCount > 0) {
    currentScore -= (doomedCount * 15);
    triggeredAdvice.push('health.adviceDoom');
  }

  // RULE 2: Date Clash (3 or more active subs renewing on the exact same day of the month)
  const dayCounts: { [key: number]: number } = {};
  subscriptions.filter(s => !s.isPaused).forEach(s => {
    const day = new Date(s.startDate).getDate();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const hasClash = Object.values(dayCounts).some(count => count >= 3);
  if (hasClash) {
    currentScore -= 20;
    triggeredAdvice.push('health.adviceClash');
  }

  // RULE 3: Duplicate Category Overkill (if category field exists and has >1 sub)
  if (subscriptions[0]?.category) {
    const catCounts: { [key: string]: number } = {};
    subscriptions.filter(s => !s.isPaused).forEach(s => {
      catCounts[s.category] = (catCounts[s.category] || 0) + 1;
    });
    if (Object.values(catCounts).some(c => c > 1)) {
      currentScore -= 25;
      triggeredAdvice.push('health.adviceDuplicate');
    }
  }

  // RULE 4: Heavy Financial Load threshold
  if (totalMonthlyCostTL > 1500) {
    currentScore -= 10;
  }

  // Clamp strictly 0 - 100
  const finalScore = Math.max(0, Math.min(100, Math.round(currentScore)));

  let status = 'health.statusExcellent';
  if (finalScore < 50) status = 'health.statusCritical';
  else if (finalScore < 80) status = 'health.statusGood';

  return {
    score: finalScore,
    statusKey: status,
    adviceKeys: triggeredAdvice
  };
};

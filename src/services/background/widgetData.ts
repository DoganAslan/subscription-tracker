export type WidgetSubscription = {
  name: string;
  amount: number | string;
  currency?: string;
  billingCycle?: string;
  renewalDate?: unknown;
  status?: string;
};

export type WidgetData = {
  monthlyTotal: string;
  nextPaymentName: string;
  nextPaymentDate: string;
  nextPaymentMeta: string;
  activeCount: number;
  labels: {
    monthlyTotal: string;
    nextPayment: string;
    activeSubscriptions: string;
    appName: string;
  };
};

type BuildWidgetDataOptions = {
  subscriptions: WidgetSubscription[];
  baseCurrency: string;
  currencySymbol: string;
  isTurkish: boolean;
  now?: Date;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
};

const MONTHLY_FACTORS: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  biannually: 1 / 6,
  yearly: 1 / 12,
  biennially: 1 / 24,
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value);
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : new Date(date);
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonthsClamped(date: Date, months: number, originalDay: number): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
}

function getNextOccurrence(value: unknown, cycle: string, now: Date): Date | null {
  let nextDate = toDate(value);
  if (!nextDate) return null;

  const originalDay = nextDate.getDate();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let safetyCounter = 0;

  while (nextDate.getTime() < startOfToday.getTime() && safetyCounter < 1_000) {
    safetyCounter += 1;
    if (cycle === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (cycle === 'monthly') nextDate = addMonthsClamped(nextDate, 1, originalDay);
    else if (cycle === 'quarterly') nextDate = addMonthsClamped(nextDate, 3, originalDay);
    else if (cycle === 'biannually') nextDate = addMonthsClamped(nextDate, 6, originalDay);
    else if (cycle === 'yearly') nextDate = addMonthsClamped(nextDate, 12, originalDay);
    else if (cycle === 'biennially') nextDate = addMonthsClamped(nextDate, 24, originalDay);
    else return null;
  }

  return nextDate;
}

function getRelativeDueLabel(date: Date, now: Date, isTurkish: boolean): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const differenceInDays = Math.round(
    (startOfDueDay.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (differenceInDays === 0) return isTurkish ? 'Bugün' : 'Today';
  if (differenceInDays === 1) return isTurkish ? 'Yarın' : 'Tomorrow';
  return isTurkish ? `${differenceInDays} gün sonra` : `in ${differenceInDays} days`;
}

export function buildWidgetData({
  subscriptions,
  baseCurrency,
  currencySymbol,
  isTurkish,
  now = new Date(),
  convertAmount,
}: BuildWidgetDataOptions): WidgetData {
  const activeSubscriptions = Array.isArray(subscriptions)
    ? subscriptions.filter(subscription => subscription.status !== 'paused')
    : [];

  const monthlyTotal = activeSubscriptions.reduce((total, subscription) => {
    const amount = typeof subscription.amount === 'number'
      ? subscription.amount
      : Number.parseFloat(subscription.amount) || 0;
    const converted = convertAmount(amount, subscription.currency || 'TRY', baseCurrency);
    const monthlyFactor = MONTHLY_FACTORS[subscription.billingCycle || 'monthly'] ?? 1;
    return total + (Number.isFinite(converted) ? converted * monthlyFactor : 0);
  }, 0);

  let nextPaymentName = isTurkish ? 'Yaklaşan ödeme yok' : 'No upcoming payment';
  let nextPaymentDate = '--';
  let nextPaymentMeta = isTurkish
    ? 'Yeni abonelik eklediğinde burada görünür.'
    : 'It will appear here after you add a subscription.';

  const nextPayment = activeSubscriptions
    .map(subscription => ({
      subscription,
      date: getNextOccurrence(
        subscription.renewalDate,
        subscription.billingCycle || 'monthly',
        now,
      ),
    }))
    .filter((item): item is { subscription: WidgetSubscription; date: Date } => Boolean(item.date))
    .sort((left, right) => left.date.getTime() - right.date.getTime())[0];

  if (nextPayment) {
    nextPaymentName = nextPayment.subscription.name;
    nextPaymentDate = nextPayment.date.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
    nextPaymentMeta = getRelativeDueLabel(nextPayment.date, now, isTurkish);
  }

  return {
    monthlyTotal: `${currencySymbol}${monthlyTotal.toFixed(2)}`,
    nextPaymentName,
    nextPaymentDate,
    nextPaymentMeta,
    activeCount: activeSubscriptions.length,
    labels: {
      monthlyTotal: isTurkish ? 'AYLIK TOPLAM' : 'MONTHLY TOTAL',
      nextPayment: isTurkish ? 'SIRADAKİ ÖDEME' : 'NEXT PAYMENT',
      activeSubscriptions: isTurkish ? 'aktif abonelik' : 'active subscriptions',
      appName: 'SUBMATE',
    },
  };
}


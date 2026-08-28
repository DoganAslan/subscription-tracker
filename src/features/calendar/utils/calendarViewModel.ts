import { calculateSubscriptionCost } from '@/domain/subscriptions/billing';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';
import { getRenewalsInRange } from '@/domain/subscriptions/recurrence';
import type { Subscription } from '@/services/firebase/types';
import type { ExchangeRates } from '@/utils/currency';
import type { CalendarPayment, CalendarViewModel } from '../types';

export type BuildCalendarViewModelInput = {
  subscriptions?: readonly Subscription[] | null;
  selectedDate: Date;
  baseCurrency: string;
  rates: Readonly<ExchangeRates>;
};

const startOfMonth = (year: number, monthIndex: number): Date => new Date(year, monthIndex, 1);
const endOfMonth = (year: number, monthIndex: number): Date => new Date(year, monthIndex + 1, 0);

const buildCalendarDays = (year: number, monthIndex: number): (number | null)[] => {
  const firstWeekDay = startOfMonth(year, monthIndex).getDay();
  const mondayFirstOffset = firstWeekDay === 0 ? 6 : firstWeekDay - 1;
  const numberOfDays = endOfMonth(year, monthIndex).getDate();

  return [
    ...Array.from<null>({ length: mondayFirstOffset }).fill(null),
    ...Array.from({ length: numberOfDays }, (_, index) => index + 1),
  ];
};

export function buildCalendarViewModel({
  subscriptions = [],
  selectedDate,
  baseCurrency,
  rates,
}: BuildCalendarViewModelInput): CalendarViewModel {
  const year = selectedDate.getFullYear();
  const monthIndex = selectedDate.getMonth();
  const monthStart = startOfMonth(year, monthIndex);
  const monthEnd = endOfMonth(year, monthIndex);
  const activeSubscriptions = [...(subscriptions ?? [])]
    .filter(subscription => !normalizeSubscriptionState(subscription).isPaused);
  const paymentCountByDay = new Map<number, number>();
  const dailyPayments: CalendarPayment[] = [];
  let monthlyTotal = 0;

  for (const subscription of activeSubscriptions) {
    const dueDates = getRenewalsInRange(subscription, { start: monthStart, end: monthEnd });
    if (dueDates.length === 0) continue;

    const amountInBaseCurrency = calculateSubscriptionCost(subscription, {
      baseCurrency,
      rates,
    }).billingGross;
    monthlyTotal += amountInBaseCurrency * dueDates.length;

    for (const dueDate of dueDates) {
      const dueDay = dueDate.getDate();
      paymentCountByDay.set(dueDay, (paymentCountByDay.get(dueDay) ?? 0) + 1);

      if (dueDay === selectedDate.getDate()) {
        dailyPayments.push({ subscription, dueDate, amountInBaseCurrency });
      }
    }
  }

  dailyPayments.sort((left, right) => (
    left.subscription.name.localeCompare(right.subscription.name)
  ));

  return {
    year,
    monthIndex,
    calendarDays: buildCalendarDays(year, monthIndex),
    paymentCountByDay,
    monthlyTotal,
    activeCount: activeSubscriptions.length,
    dailyPayments,
  };
}

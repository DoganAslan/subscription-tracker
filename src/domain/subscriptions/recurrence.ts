import type { BillingCycle } from '@/services/firebase/types';

export interface RecurringSubscription {
  billingCycle: BillingCycle;
  renewalDate: unknown;
  status?: 'active' | 'paused';
  isPaused?: boolean | null;
  isTrial?: boolean | null;
  isFreeTrial?: boolean | null;
  trialEndDate?: unknown;
}

export interface RenewalRange {
  start: unknown;
  end: unknown;
}

type RenewalOccurrence = {
  date: Date;
  index: number;
};

const MONTHS_PER_CYCLE: Readonly<Record<Exclude<BillingCycle, 'weekly'>, number>> = {
  monthly: 1,
  quarterly: 3,
  biannually: 6,
  yearly: 12,
  biennially: 24,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RENEWALS_PER_RANGE = 10_000;

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const createLocalDate = (year: number, month: number, day: number): Date => {
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month, day);
  return date;
};

const toLocalMidnight = (date: Date): Date => createLocalDate(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
);

const isValidCalendarDate = (year: number, month: number, day: number): boolean => {
  const date = createLocalDate(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
};

const dateFromValue = (value: unknown): Date | null => {
  if (value instanceof Date) return new Date(value.getTime());

  if (value && typeof value === 'object') {
    try {
      if (!('toDate' in value)) return null;
      const toDate = value.toDate;
      if (typeof toDate !== 'function') return null;
      const converted = toDate.call(value);
      return converted instanceof Date ? new Date(converted.getTime()) : null;
    } catch {
      return null;
    }
  }

  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const calendarDate = typeof value === 'string'
    ? /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value)
    : null;
  if (typeof value === 'string' && calendarDate) {
    const year = Number(calendarDate[1]);
    const month = Number(calendarDate[2]) - 1;
    const day = Number(calendarDate[3]);
    if (!isValidCalendarDate(year, month, day)) return null;
    if (value.length === 10) return createLocalDate(year, month, day);
  }

  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : null;
};

export function parseSubscriptionDate(value: unknown): Date | null {
  const parsed = dateFromValue(value);
  return parsed && isValidDate(parsed) ? toLocalMidnight(parsed) : null;
}

const isPaused = (subscription: RecurringSubscription): boolean => (
  subscription.status === 'paused' || subscription.isPaused === true
);

const isTrial = (subscription: RecurringSubscription): boolean => (
  subscription.isTrial === true || subscription.isFreeTrial === true
);

const getAnchor = (subscription: RecurringSubscription, from: Date): Date | null => {
  const renewalAnchor = parseSubscriptionDate(subscription.renewalDate);
  if (!renewalAnchor) return null;

  const trialEnd = parseSubscriptionDate(subscription.trialEndDate);
  if (isTrial(subscription) && trialEnd && trialEnd.getTime() >= from.getTime()) {
    return trialEnd;
  }

  return renewalAnchor;
};

const localDayNumber = (date: Date): number => Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
) / DAY_MS;

const monthIndex = (date: Date): number => date.getFullYear() * 12 + date.getMonth();

const daysInMonth = (year: number, month: number): number => createLocalDate(year, month + 1, 0).getDate();

const getMonthOccurrence = (anchor: Date, monthsToAdd: number): Date | null => {
  const targetMonth = monthIndex(anchor) + monthsToAdd;
  const year = Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const date = createLocalDate(year, month, Math.min(anchor.getDate(), daysInMonth(year, month)));
  return isValidDate(date) ? date : null;
};

const getOccurrence = (anchor: Date, cycle: BillingCycle, index: number): Date | null => {
  if (cycle === 'weekly') {
    const date = createLocalDate(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + index * 7);
    return isValidDate(date) ? date : null;
  }

  return getMonthOccurrence(anchor, MONTHS_PER_CYCLE[cycle] * index);
};

const getFirstOccurrenceOnOrAfter = (
  anchor: Date,
  cycle: BillingCycle,
  from: Date,
): RenewalOccurrence | null => {
  if (cycle === 'weekly') {
    const daysSinceAnchor = localDayNumber(from) - localDayNumber(anchor);
    const index = daysSinceAnchor <= 0 ? 0 : Math.ceil(daysSinceAnchor / 7);
    const date = getOccurrence(anchor, cycle, index);
    return date ? { date, index } : null;
  }

  const months = MONTHS_PER_CYCLE[cycle];
  const monthDelta = monthIndex(from) - monthIndex(anchor);
  let index = monthDelta <= 0 ? 0 : Math.floor(monthDelta / months);
  let date = getOccurrence(anchor, cycle, index);
  if (!date) return null;

  if (date.getTime() < from.getTime()) {
    index += 1;
    date = getOccurrence(anchor, cycle, index);
  }

  return date ? { date, index } : null;
};

const getRangeLimit = (cycle: BillingCycle, start: Date, end: Date): number => {
  if (cycle === 'weekly') {
    return Math.floor((localDayNumber(end) - localDayNumber(start)) / 7) + 1;
  }

  return Math.floor((monthIndex(end) - monthIndex(start)) / MONTHS_PER_CYCLE[cycle]) + 1;
};

export function getNextRenewal(
  subscription: RecurringSubscription,
  from: unknown,
): Date | null {
  if (isPaused(subscription)) return null;

  const reference = parseSubscriptionDate(from);
  if (!reference) return null;

  const anchor = getAnchor(subscription, reference);
  if (!anchor) return null;

  return getFirstOccurrenceOnOrAfter(anchor, subscription.billingCycle, reference)?.date ?? null;
}

export function getRenewalsInRange(
  subscription: RecurringSubscription,
  range: RenewalRange,
): Date[] {
  if (isPaused(subscription)) return [];

  const start = parseSubscriptionDate(range.start);
  const end = parseSubscriptionDate(range.end);
  if (!start || !end || end.getTime() < start.getTime()) return [];

  const anchor = getAnchor(subscription, start);
  if (!anchor) return [];

  const first = getFirstOccurrenceOnOrAfter(anchor, subscription.billingCycle, start);
  if (!first) return [];

  const renewals: Date[] = [];
  const limit = getRangeLimit(subscription.billingCycle, start, end);
  if (limit > MAX_RENEWALS_PER_RANGE) return [];
  for (let offset = 0; offset < limit; offset += 1) {
    const renewal = getOccurrence(anchor, subscription.billingCycle, first.index + offset);
    if (!renewal || renewal.getTime() > end.getTime()) break;
    renewals.push(renewal);
  }

  return renewals;
}

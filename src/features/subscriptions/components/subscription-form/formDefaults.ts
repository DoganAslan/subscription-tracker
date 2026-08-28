import type { Subscription } from '@/services/firebase/types';
import type { SubscriptionFormInput } from '../../schemas/subscription.schema';

export type SubscriptionFormInitialData = Partial<Subscription>;

export type SubscriptionFormDefaults = Omit<SubscriptionFormInput, 'splitMembers' | 'priceHistory'> & {
  id?: Subscription['id'];
  splitMembers: NonNullable<SubscriptionFormInput['splitMembers']>;
  priceHistory: NonNullable<SubscriptionFormInput['priceHistory']>;
};

const toFormDate = (value: unknown, fallback: Date): Date => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getTime());

  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === 'function') {
      const parsed = toDate.call(value);
      if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) return new Date(parsed.getTime());
    }
  }

  const parsed = value ? new Date(String(value)) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date(fallback.getTime());
};

export const createSubscriptionFormDefaults = (
  initialData?: SubscriptionFormInitialData,
): SubscriptionFormDefaults => {
  const now = new Date();

  return {
    id: initialData?.id,
    name: initialData?.name ?? '',
    category: initialData?.category ?? '',
    amount: initialData?.amount ?? 0,
    currency: initialData?.currency ?? 'USD',
    billingCycle: initialData?.billingCycle ?? 'monthly',
    renewalDate: toFormDate(initialData?.renewalDate, now),
    status: initialData?.status ?? 'active',
    pauseEndDate: initialData?.pauseEndDate
      ? toFormDate(initialData.pauseEndDate, now)
      : null,
    reminderOffset: initialData?.reminderOffset ?? '1_day',
    isTrial: initialData?.isTrial ?? initialData?.isFreeTrial ?? false,
    trialEndDate: toFormDate(initialData?.trialEndDate, now),
    hasContract: initialData?.hasContract ?? false,
    contractEndDate: toFormDate(initialData?.contractEndDate, new Date(now.getTime() + 365 * 86400000)),
    notes: initialData?.notes ?? '',
    usageFrequency: initialData?.usageFrequency,
    lastUsedDate: initialData?.lastUsedDate,
    usageScore: initialData?.usageScore,
    usageLogDates: initialData?.usageLogDates ? [...initialData.usageLogDates] : undefined,
    cardId: initialData?.cardId ?? null,
    isSplit: initialData?.isSplit ?? false,
    splitMembers: initialData?.splitMembers ? initialData.splitMembers.map((member) => ({ ...member })) : [],
    priceHistory: initialData?.priceHistory ? initialData.priceHistory.map((entry) => ({ ...entry })) : [],
  };
};

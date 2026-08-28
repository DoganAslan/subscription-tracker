import { useCallback, useRef, useState } from 'react';
import {
  calculateSubscriptionCost,
  type CostedSubscription,
} from '@/domain/subscriptions/billing';
import type { Subscription } from '@/services/firebase/types';
import type { ExchangeRates } from '@/utils/currency';
import type { SubscriptionFormData } from '../../../schemas/subscription.schema';

export interface BudgetProjection {
  monthlyGross: number;
  monthlyNet: number;
}

export interface SubscriptionBudgetProjectionInput {
  subscriptions: readonly Subscription[];
  candidate: SubscriptionFormData;
  editingSubscriptionId?: string | null;
  baseCurrency: string;
  rates: Readonly<ExchangeRates>;
}

export interface BudgetGuardDependencies {
  budget: number | null;
  project: (candidate: SubscriptionFormData) => BudgetProjection;
  confirm: (projection: BudgetProjection) => Promise<boolean>;
  submit: (candidate: SubscriptionFormData) => void | Promise<void>;
}

const roundMoney = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100;

const normalizeCandidate = (candidate: SubscriptionFormData): CostedSubscription => ({
  amount: candidate.amount,
  currency: candidate.currency,
  billingCycle: candidate.billingCycle,
  status: candidate.status,
  isPaused: false,
  isSplit: candidate.isSplit,
  splitMembers: candidate.splitMembers.map((member) => ({
    id: member.id ?? '',
    name: member.name ?? '',
    phone: member.phone ?? '',
    shareAmount: typeof member.shareAmount === 'number' && Number.isFinite(member.shareAmount)
      ? member.shareAmount
      : 0,
    isPaid: member.isPaid ?? false,
  })),
});

export const projectSubscriptionBudget = ({
  subscriptions,
  candidate,
  editingSubscriptionId,
  baseCurrency,
  rates,
}: SubscriptionBudgetProjectionInput): BudgetProjection => {
  const includedSubscriptions = editingSubscriptionId
    ? subscriptions.filter((subscription) => subscription.id !== editingSubscriptionId)
    : subscriptions;
  const costs = [...includedSubscriptions, normalizeCandidate(candidate)].map((subscription) => (
    calculateSubscriptionCost(subscription, { baseCurrency, rates })
  ));

  return {
    monthlyGross: roundMoney(costs.reduce((total, cost) => total + cost.monthlyGross, 0)),
    monthlyNet: roundMoney(costs.reduce((total, cost) => total + cost.monthlyNet, 0)),
  };
};

const hasApplicableBudget = (budget: number | null): budget is number => (
  typeof budget === 'number' && Number.isFinite(budget) && budget > 0
);

export const useBudgetGuard = ({
  budget,
  project,
  confirm,
  submit,
}: BudgetGuardDependencies) => {
  const [isPending, setIsPending] = useState(false);
  const isRunning = useRef(false);

  const submitWithBudgetGuard = useCallback(async (candidate: SubscriptionFormData): Promise<void> => {
    if (isRunning.current) return;

    isRunning.current = true;
    setIsPending(true);
    try {
      if (hasApplicableBudget(budget)) {
        const projection = project(candidate);
        if (projection.monthlyNet > budget && !await confirm(projection)) return;
      }

      await submit(candidate);
    } finally {
      isRunning.current = false;
      setIsPending(false);
    }
  }, [budget, confirm, project, submit]);

  return { isPending, submit: submitWithBudgetGuard };
};

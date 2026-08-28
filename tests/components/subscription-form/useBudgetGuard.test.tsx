import { act, renderHook, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import type { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import {
  type BudgetProjection,
  useBudgetGuard,
} from '@/features/subscriptions/components/subscription-form/hooks/useBudgetGuard';

const candidate: SubscriptionFormData = {
  name: 'Netflix',
  category: 'Entertainment',
  amount: 20,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: new Date('2026-09-01T00:00:00.000Z'),
  status: 'active',
  reminderOffset: '1_day',
  isTrial: false,
  hasContract: false,
  notes: null,
  isSplit: false,
  splitMembers: [],
  priceHistory: [],
};

const underBudgetProjection: BudgetProjection = { monthlyGross: 90, monthlyNet: 90 };
const overBudgetProjection: BudgetProjection = { monthlyGross: 120, monthlyNet: 120 };

describe('useBudgetGuard', () => {
  it('submits immediately once when no applicable budget exists', async () => {
    const submit = jest.fn(async () => undefined);
    const project = jest.fn(() => overBudgetProjection);
    const confirm = jest.fn(async () => true);
    const hook = await renderHook(() => useBudgetGuard({ budget: null, project, confirm, submit }));

    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(submit).toHaveBeenCalledTimes(1);
    expect(project).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([Number.NaN, 0, -1])('submits without confirmation when budget is %p', async (budget) => {
    const submit = jest.fn(async () => undefined);
    const confirm = jest.fn(async () => true);
    const hook = await renderHook(() => useBudgetGuard({
      budget,
      project: () => overBudgetProjection,
      confirm,
      submit,
    }));

    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(submit).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('submits once below budget without confirmation', async () => {
    const submit = jest.fn(async () => undefined);
    const confirm = jest.fn(async () => true);
    const hook = await renderHook(() => useBudgetGuard({
      budget: 100,
      project: () => underBudgetProjection,
      confirm,
      submit,
    }));

    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(submit).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('compares the monthly net total to budget rather than monthly gross', async () => {
    const submit = jest.fn(async () => undefined);
    const confirm = jest.fn(async () => true);
    const hook = await renderHook(() => useBudgetGuard({
      budget: 100,
      project: () => ({ monthlyGross: 140, monthlyNet: 80 }),
      confirm,
      submit,
    }));

    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(submit).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('does not submit when an over-budget confirmation is cancelled', async () => {
    const submit = jest.fn(async () => undefined);
    const confirm = jest.fn(async () => false);
    const hook = await renderHook(() => useBudgetGuard({
      budget: 100,
      project: () => overBudgetProjection,
      confirm,
      submit,
    }));

    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(confirm).toHaveBeenCalledWith(overBudgetProjection);
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits exactly once after an over-budget confirmation', async () => {
    const submit = jest.fn(async () => undefined);
    const confirm = jest.fn(async () => true);
    const hook = await renderHook(() => useBudgetGuard({
      budget: 100,
      project: () => overBudgetProjection,
      confirm,
      submit,
    }));

    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('ignores a second submit while confirmation is pending', async () => {
    let resolveConfirmation: ((value: boolean) => void) | undefined;
    const confirm = jest.fn(() => new Promise<boolean>((resolve) => {
      resolveConfirmation = resolve;
    }));
    const submit = jest.fn(async () => undefined);
    const hook = await renderHook(() => useBudgetGuard({
      budget: 100,
      project: () => overBudgetProjection,
      confirm,
      submit,
    }));

    let firstAttempt!: Promise<void>;
    let secondAttempt!: Promise<void>;
    await act(async () => {
      firstAttempt = hook.result.current.submit(candidate);
      secondAttempt = hook.result.current.submit(candidate);
      await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    });

    await act(async () => {
      resolveConfirmation?.(true);
      await Promise.all([firstAttempt, secondAttempt]);
    });

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('ignores a second submit while the asynchronous submit is pending', async () => {
    let releaseSubmit: (() => void) | undefined;
    const submit = jest.fn(() => new Promise<void>((resolve) => {
      releaseSubmit = resolve;
    }));
    const hook = await renderHook(() => useBudgetGuard({
      budget: 100,
      project: () => underBudgetProjection,
      confirm: async () => true,
      submit,
    }));

    let firstAttempt!: Promise<void>;
    let secondAttempt!: Promise<void>;
    await act(async () => {
      firstAttempt = hook.result.current.submit(candidate);
      secondAttempt = hook.result.current.submit(candidate);
      await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    });

    await act(async () => {
      releaseSubmit?.();
      await Promise.all([firstAttempt, secondAttempt]);
    });

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('releases its lock when submit rejects so a retry can run', async () => {
    let attempts = 0;
    const submit = jest.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('network unavailable');
    });
    const hook = await renderHook(() => useBudgetGuard({
      budget: Number.NaN,
      project: () => underBudgetProjection,
      confirm: async () => true,
      submit,
    }));

    let rejection: unknown;
    await act(async () => {
      try {
        await hook.result.current.submit(candidate);
      } catch (error) {
        rejection = error;
      }
    });
    expect(rejection).toEqual(new Error('network unavailable'));
    await act(async () => {
      await hook.result.current.submit(candidate);
    });

    expect(submit).toHaveBeenCalledTimes(2);
  });
});

import { describe, expect, it } from '@jest/globals';
import { getAssignedCardId } from '@/domain/subscriptions/cardAssignment';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';

describe('normalizeSubscriptionState', () => {
  it('normalizes canonical paused status', () => {
    expect(normalizeSubscriptionState({ status: 'paused', isPaused: false })).toEqual({
      isPaused: true,
      isTrial: false,
    });
  });

  it('normalizes legacy paused and free-trial flags', () => {
    expect(normalizeSubscriptionState({ isPaused: true, isFreeTrial: true })).toEqual({
      isPaused: true,
      isTrial: true,
    });
  });
});

describe('getAssignedCardId', () => {
  it('prefers the canonical card identifier', () => {
    expect(getAssignedCardId({ cardId: 'canonical', assignedCardId: 'legacy' })).toBe('canonical');
  });

  it('falls back to the legacy assigned card identifier', () => {
    expect(getAssignedCardId({ assignedCardId: 'legacy' })).toBe('legacy');
  });

  it('returns null without an assigned card', () => {
    expect(getAssignedCardId({})).toBeNull();
  });
});

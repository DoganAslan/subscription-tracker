export interface SubscriptionStateInput {
  status?: 'active' | 'paused' | null;
  isPaused?: boolean | null;
  isTrial?: boolean | null;
  isFreeTrial?: boolean | null;
}

export function normalizeSubscriptionState(input: SubscriptionStateInput) {
  return {
    isPaused: input.status === 'paused' || input.isPaused === true,
    isTrial: input.isTrial === true || input.isFreeTrial === true,
  };
}

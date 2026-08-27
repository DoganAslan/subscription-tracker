export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  list: (userId: string) => [...subscriptionKeys.all, 'list', userId] as const,
};

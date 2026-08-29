export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (userId: string) => [...cardKeys.lists(), userId] as const,
};

export function getAssignedCardId(input: {
  cardId?: string | null;
  assignedCardId?: string | null;
}): string | null {
  return input.cardId || input.assignedCardId || null;
}

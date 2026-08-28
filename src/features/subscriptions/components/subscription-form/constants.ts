import { sanitizeTextInput } from '@/utils/sanitizers';
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_NAME_MAX_LENGTH,
} from '../../schemas/subscription.schema';

export const SUBSCRIPTION_CATEGORY_OPTIONS = SUBSCRIPTION_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

export const normalizeSubscriptionNameInput = (value: string): string =>
  sanitizeTextInput(value, SUBSCRIPTION_NAME_MAX_LENGTH);

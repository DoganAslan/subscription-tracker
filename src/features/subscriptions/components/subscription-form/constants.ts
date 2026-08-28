import { SUBSCRIPTION_CATEGORIES } from '../../schemas/subscription.schema';

export const SUBSCRIPTION_CATEGORY_OPTIONS = SUBSCRIPTION_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

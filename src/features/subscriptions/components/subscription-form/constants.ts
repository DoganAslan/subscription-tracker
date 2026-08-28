import { sanitizeTextInput } from '@/utils/sanitizers';
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_NAME_MAX_LENGTH,
} from '../../schemas/subscription.schema';

export const SUBSCRIPTION_CATEGORY_OPTIONS = SUBSCRIPTION_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

const SUBSCRIPTION_CATEGORY_HINTS = [
  { en: 'Netflix, Disney+, Cable', tr: 'Netflix, Disney+, kablolu TV' },
  { en: 'Spotify, Apple Music, Audible', tr: 'Spotify, Apple Music, Audible' },
  { en: 'Notion, Claude, Github, Adobe', tr: 'Notion, Claude, GitHub, Adobe' },
  { en: 'Google One, iCloud, VPN, Web Hosting', tr: 'Google One, iCloud, VPN, web barındırma' },
  { en: 'Gym memberships, Strava, Meditation apps', tr: 'Spor salonu, Strava, meditasyon uygulamaları' },
  { en: 'Budgeting tools, Trading platforms, Insurance', tr: 'Bütçe uygulamaları, yatırım platformları, sigorta' },
  { en: 'Coursera, Udemy, Language apps', tr: 'Coursera, Udemy, dil uygulamaları' },
  { en: 'Game Pass, PlayStation Plus, Gaming memberships', tr: 'Game Pass, PlayStation Plus, oyun üyelikleri' },
  { en: 'Amazon Prime, shopping clubs', tr: 'Amazon Prime ve alışveriş kulüpleri' },
  { en: 'Digital newspapers and magazines', tr: 'Dijital gazete ve dergiler' },
  { en: 'Food and grocery delivery memberships', tr: 'Yemek ve market teslimat üyelikleri' },
  { en: 'Other recurring services', tr: 'Diğer düzenli hizmetler' },
] as const;

export const getSubscriptionCategoryHint = (value: string, isTurkish: boolean): string | undefined => {
  const index = SUBSCRIPTION_CATEGORIES.findIndex((category) => category === value);
  if (index < 0) return undefined;
  return SUBSCRIPTION_CATEGORY_HINTS[index]?.[isTurkish ? 'tr' : 'en'];
};

export const normalizeSubscriptionNameInput = (value: string): string =>
  sanitizeTextInput(value, SUBSCRIPTION_NAME_MAX_LENGTH);

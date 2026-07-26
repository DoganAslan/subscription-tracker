export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryDark: string;
  danger: string;
  success: string;
  warning: string;
  heroGradient: readonly [string, string, string];
  cardBg: string;
}

export const lightColors: ThemeColors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceSubtle: '#F9FAFB',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  heroGradient: ['#2563EB', '#1D4ED8', '#1E40AF'] as const,
  cardBg: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  background: '#0B0F19',
  surface: '#1E293B',
  surfaceSubtle: '#111827',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  heroGradient: ['#3B82F6', '#1D4ED8', '#1E40AF'] as const,
  cardBg: '#1E293B',
};

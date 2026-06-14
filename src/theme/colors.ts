export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
}

export const lightColors: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#3B82F6',
  danger: '#EF4444',
  success: '#10B981',
};

export const darkColors: ThemeColors = {
  background: '#0B0F19',
  surface: '#1F2937',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#374151',
  primary: '#3B82F6',
  danger: '#EF4444',
  success: '#10B981',
};

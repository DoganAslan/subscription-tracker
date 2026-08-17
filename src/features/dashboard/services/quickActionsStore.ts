// src/features/dashboard/services/quickActionsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuickActionItem {
  id: string;
  titleTr: string;
  titleEn: string;
  icon: string;
  color: string;
  badgeColorBg: string;
  actionType: 'route' | 'action_csv' | 'action_vault';
  routePath?: string;
  enabled: boolean;
}

export const ALL_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'add-sub',
    titleTr: 'Abonelik Ekle',
    titleEn: 'Add Sub',
    icon: 'add',
    color: '#2563EB',
    badgeColorBg: 'rgba(37, 99, 235, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/subscriptions/add',
    enabled: true,
  },
  {
    id: 'split-share',
    titleTr: 'Ortak Ödeme',
    titleEn: 'Shared Payments',
    icon: 'swap-horizontal',
    color: '#10B981',
    badgeColorBg: 'rgba(16, 185, 129, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/subscriptions',
    enabled: true,
  },
  {
    id: 'cards',
    titleTr: 'Kartlar & Limit',
    titleEn: 'Cards',
    icon: 'card',
    color: '#F59E0B',
    badgeColorBg: 'rgba(245, 158, 11, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/wallet',
    enabled: true,
  },
  {
    id: 'analytics',
    titleTr: 'Analizler',
    titleEn: 'Analytics',
    icon: 'stats-chart',
    color: '#EC4899',
    badgeColorBg: 'rgba(236, 72, 153, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/analytics',
    enabled: true,
  },
  {
    id: 'calendar',
    titleTr: 'Takvim',
    titleEn: 'Calendar',
    icon: 'calendar',
    color: '#3B82F6',
    badgeColorBg: 'rgba(59, 130, 246, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/calendar',
    enabled: false,
  },
  {
    id: 'badges',
    titleTr: 'Başarılar',
    titleEn: 'Badges',
    icon: 'trophy',
    color: '#EAB308',
    badgeColorBg: 'rgba(234, 179, 8, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/analytics',
    enabled: false,
  },
  {
    id: 'settings',
    titleTr: 'Ayarlar',
    titleEn: 'Settings',
    icon: 'settings-outline',
    color: '#64748B',
    badgeColorBg: 'rgba(100, 116, 139, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/settings',
    enabled: false,
  },
  {
    id: 'ai-forecast',
    titleTr: 'YZ Tahmin',
    titleEn: 'AI Forecast',
    icon: 'sparkles',
    color: '#A855F7',
    badgeColorBg: 'rgba(168, 85, 247, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/analytics',
    enabled: false,
  },
  {
    id: 'simulator',
    titleTr: 'Simülatör',
    titleEn: 'Simulator',
    icon: 'calculator',
    color: '#06B6D4',
    badgeColorBg: 'rgba(6, 182, 212, 0.12)',
    actionType: 'route',
    routePath: '/(tabs)/analytics',
    enabled: false,
  },
  {
    id: 'vault',
    titleTr: 'JSON Yedekle',
    titleEn: 'Backup JSON',
    icon: 'shield-checkmark',
    color: '#10B981',
    badgeColorBg: 'rgba(16, 185, 129, 0.12)',
    actionType: 'action_vault',
    enabled: false,
  },
  {
    id: 'export-csv',
    titleTr: 'CSV Dışa Aktar',
    titleEn: 'Export CSV',
    icon: 'document-text',
    color: '#F97316',
    badgeColorBg: 'rgba(249, 115, 22, 0.12)',
    actionType: 'action_csv',
    enabled: false,
  },
];

const STORAGE_KEY = '@user_custom_quick_actions';

export async function getSavedQuickActions(): Promise<QuickActionItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_QUICK_ACTIONS;
    const savedIds: string[] = JSON.parse(raw);
    return ALL_QUICK_ACTIONS.map(item => ({
      ...item,
      enabled: savedIds.includes(item.id),
    }));
  } catch (e) {
    console.error('Failed to load custom quick actions', e);
    return ALL_QUICK_ACTIONS;
  }
}

export async function saveQuickActionIds(enabledIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabledIds));
  } catch (e) {
    console.error('Failed to save custom quick actions', e);
  }
}

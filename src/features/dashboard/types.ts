import type { Subscription } from '@/services/firebase/types';

export type DashboardContractAlert = {
  subscriptionId: string | null;
  subscriptionName: string;
  daysLeft: number;
  severity: 'warning' | 'critical';
};

export type DashboardCategoryBreakdown = {
  category: string;
  amount: number;
  percentage: number;
};

export type DashboardViewModel = {
  isSearching: boolean;
  listSubscriptions: Subscription[];
  filteredSubscriptions: Subscription[];
  upcomingSubscriptions: Subscription[];
  monthlyTotal: number;
  categoryBreakdown: DashboardCategoryBreakdown[];
  contractAlerts: DashboardContractAlert[];
  trialAlerts: Subscription[];
};

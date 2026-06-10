import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id?: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: Timestamp;
  status?: 'active' | 'paused';
  reminderOffset?: 'none' | '1_day' | '3_days' | '1_week';
  isFreeTrial?: boolean;
  trialEndDate?: Timestamp;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

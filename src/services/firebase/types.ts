import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly' | 'biennially';

export interface Subscription {
  id?: string | null;
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: Timestamp;
  status?: 'active' | 'paused' | null;
  reminderOffset?: 'none' | '1_day' | '3_days' | '1_week' | null;
  isFreeTrial?: boolean | null;
  trialEndDate?: Timestamp | null;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

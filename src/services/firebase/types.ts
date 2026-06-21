import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly' | 'biennially';

export interface Card {
  id?: string | null;
  userId: string;
  name: string; // e.g., "My Papara Virtual"
  type: 'visa' | 'mastercard' | 'troy' | 'amex' | 'other';
  lastFourDigits?: string; // Optional, just for user recognition (e.g., "4321")
  limit: number; // Monthly limit simulator
  expiryMonth: number; // For card health checks
  expiryYear: number;
  color: string; // Hex code for custom card UI styling
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  cardId?: string | null; // References Card.id
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

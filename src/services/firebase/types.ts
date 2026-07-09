import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SplitMember {
  id: string;
  name: string;
  phone: string; // e.g., "905321234567" (Numbers only for wa.me link)
  shareAmount: number; // e.g., 60.00
  isPaid: boolean;
}

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly' | 'biennially';

export interface Card {
  id?: string | null;
  userId: string;
  name: string; // e.g., "My Papara Virtual"
  type: 'visa' | 'mastercard' | 'troy' | 'amex' | 'other';
  lastFourDigits?: string; // Optional, just for user recognition (e.g., "4321")
  expiryMonth: number; // For card health checks
  expiryYear: number;
  color: string; // Hex code for custom card UI styling
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP'; // Native currency for the card
  isPinned?: boolean;
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
  pauseEndDate?: Timestamp | null;
  reminderOffset?: 'none' | '1_day' | '3_days' | '1_week' | null;
  isFreeTrial?: boolean | null;
  trialEndDate?: Timestamp | null;
  contractEndDate?: Date | string | null;
  notes: string | null;
  usageFrequency?: 'high' | 'medium' | 'low' | 'none';
  lastUsedDate?: string;
  usageScore?: number;
  isTrial?: boolean;
  trialEndDate?: string;
  cardId?: string | null; // References Card.id
  assignedCardId?: string; // Links to CardWidget ID
  isSplit?: boolean;
  splitMembers?: SplitMember[];
  priceHistory?: { amount: number; date: string }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly'; // CRITICAL for projection math
  category: string;
  paymentDate: string; // ISO String or Day of Month
  assignedCardId?: string; // Links to CardWidget ID
  contractEndDate?: string; // ISO String for Doom-Alarm trigger
  isPaused?: boolean;
  isSplit?: boolean;
  splitMembers?: SplitMember[];
  isTrial?: boolean;
  trialEndDate?: string;
  notificationId?: string | null;
}

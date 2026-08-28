import type { ReactNode } from 'react';
import type { Subscription } from '@/services/firebase/types';
import type { SubscriptionFormData } from '../../schemas/subscription.schema';

export type SubscriptionFormSubmit = (data: SubscriptionFormData) => void | Promise<void>;

export interface SubscriptionFormProps {
  initialData?: Subscription;
  onSubmit: SubscriptionFormSubmit;
  isLoading: boolean;
  submitLabel: string;
  onDelete?: () => void;
  hideHero?: boolean;
  externalAmount?: number;
  children?: ReactNode;
}

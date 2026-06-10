import { z } from 'zod';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().length(3, 'Must be a 3-letter code').default('USD'),
  billingCycle: z.enum(['weekly', 'monthly', 'yearly']),
  renewalDate: z.date(),
  status: z.enum(['active', 'paused']).optional().default('active'),
  reminderOffset: z.enum(['none', '1_day', '3_days', '1_week']).optional().default('1_day'),
  isFreeTrial: z.boolean().optional().default(false),
  trialEndDate: z.date().optional(),
  notes: z.string().optional(),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

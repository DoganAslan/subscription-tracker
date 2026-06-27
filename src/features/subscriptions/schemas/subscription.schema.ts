import { z } from 'zod';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().length(3, 'Must be a 3-letter code').default('USD'),
  billingCycle: z.enum(['weekly', 'monthly', 'quarterly', 'biannually', 'yearly', 'biennially']),
  renewalDate: z.date(),
  status: z.enum(['active', 'paused']).optional().default('active'),
  reminderOffset: z.enum(['none', '1_day', '3_days', '1_week']).optional().default('1_day'),
  isFreeTrial: z.boolean().default(false).optional().nullable(),
  trialEndDate: z.date().optional().nullable(),
  hasContract: z.boolean().default(false).optional().nullable(),
  contractEndDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  usageFrequency: z.enum(['high', 'medium', 'low', 'none']).optional(),
  lastUsedDate: z.string().optional(),
  usageScore: z.number().optional(),
  isTrial: z.boolean().optional(),
  trialEndDate: z.date().optional(),
  cardId: z.string().optional().nullable(),
  isSplit: z.boolean().default(false).optional(),
  splitParticipants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional().or(z.literal('')),
    percentage: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
    amount: z.union([z.string(), z.number()]).optional().or(z.literal('')),
    hasPaid: z.boolean().default(false).optional()
  })).optional().default([])
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

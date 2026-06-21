import { z } from 'zod';

export const cardSchema = z.object({
  name: z.string().min(1, 'Card name is required').max(50, 'Name is too long'),
  type: z.enum(['visa', 'mastercard', 'troy', 'amex', 'other']),
  lastFourDigits: z.string().regex(/^\d{0,4}$/, 'Must be up to 4 digits').optional(),
  limit: z.number().min(0, 'Limit must be positive'),
  expiryMonth: z.number().min(1, 'Invalid month').max(12, 'Invalid month'),
  expiryYear: z.number().min(new Date().getFullYear(), 'Year cannot be in the past').max(new Date().getFullYear() + 20, 'Invalid year'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code'),
});

export type CardFormData = z.infer<typeof cardSchema>;

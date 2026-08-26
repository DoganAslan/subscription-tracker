import { describe, expect, it } from '@jest/globals';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';

describe('Expo Jest test harness', () => {
  it('imports TypeScript production code through the application alias', () => {
    expect(getMonthlyCost(1200, 'yearly')).toBe(100);
  });
});

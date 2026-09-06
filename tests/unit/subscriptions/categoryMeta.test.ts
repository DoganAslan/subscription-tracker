import { describe, expect, it } from '@jest/globals';
import { getBillingCycleLabel, getCategoryLabel } from '@/utils/categoryMeta';

describe('subscription category localization', () => {
  it('keeps productivity and utilities as distinct Turkish options', () => {
    expect(getCategoryLabel('Productivity', true)).toBe('Üretkenlik & Yazılım');
    expect(getCategoryLabel('Utilities & Cloud', true)).toBe('Bulut & Hizmetler');
  });

  it('localizes stored billing-cycle keys', () => {
    expect(getBillingCycleLabel('monthly', true)).toBe('Aylık');
    expect(getBillingCycleLabel('yearly', false)).toBe('Yearly');
  });
});

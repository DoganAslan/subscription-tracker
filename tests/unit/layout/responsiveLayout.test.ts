import { getResponsiveLayout } from '@/components/layout/responsiveLayout';

describe('getResponsiveLayout', () => {
  it('uses one column and compact gutters on a narrow iPhone', () => {
    expect(getResponsiveLayout(375)).toEqual({
      mode: 'compact',
      gutter: 16,
      columns: 1,
      contentMaxWidth: 1180,
    });
  });

  it('uses two columns and larger gutters on iPad width', () => {
    expect(getResponsiveLayout(820)).toEqual({
      mode: 'regular',
      gutter: 24,
      columns: 2,
      contentMaxWidth: 1180,
    });
  });

  it('keeps very narrow devices usable', () => {
    expect(getResponsiveLayout(320).gutter).toBe(12);
  });
});

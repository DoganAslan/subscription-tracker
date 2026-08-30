import {
  getResponsiveLayout,
  getTabBarGeometry,
  getTabBarIndicatorTarget,
} from '@/components/layout/responsiveLayout';

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

describe('getTabBarGeometry', () => {
  it('subtracts horizontal safe-area insets', () => {
    expect(getTabBarGeometry(390, 0, 0).availableWidth).toBe(366);
    expect(getTabBarGeometry(390, 8, 12).availableWidth).toBe(346);
  });

  it('caps the floating bar on iPad', () => {
    expect(getTabBarGeometry(1366, 0, 0).availableWidth).toBe(1180);
  });
});

describe('getTabBarIndicatorTarget', () => {
  it('uses the current tab width after a resize', () => {
    const tabBarState = { tabWidth: 73 };

    expect(getTabBarIndicatorTarget(3, tabBarState)).toBe(219);

    tabBarState.tabWidth = 200;

    expect(getTabBarIndicatorTarget(3, tabBarState)).toBe(600);
  });
});

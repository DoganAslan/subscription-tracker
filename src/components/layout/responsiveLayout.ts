export type ResponsiveMode = 'compact' | 'regular';

export interface ResponsiveLayout {
  mode: ResponsiveMode;
  gutter: 12 | 16 | 24;
  columns: 1 | 2;
  contentMaxWidth: 1180;
}

export const getResponsiveLayout = (width: number): ResponsiveLayout => ({
  mode: width >= 768 ? 'regular' : 'compact',
  gutter: width < 360 ? 12 : width >= 768 ? 24 : 16,
  columns: width >= 768 ? 2 : 1,
  contentMaxWidth: 1180,
});

export const getTabBarGeometry = (
  windowWidth: number,
  leftInset: number,
  rightInset: number,
) => {
  const outerMargin = 12;
  const availableWidth = Math.min(
    1180,
    Math.max(0, windowWidth - leftInset - rightInset - outerMargin * 2),
  );

  return { availableWidth, outerMargin };
};

export type ResponsiveGridWidth = '100%' | '48.4%' | '31.8%';

type ResponsiveGridOptions = {
  screenWidth: number;
  itemIndex: number;
  itemCount: number;
  maxColumns?: 1 | 2 | 3;
};

export const getResponsiveColumnCount = (
  screenWidth: number,
  maxColumns: 1 | 2 | 3 = 3,
): 1 | 2 | 3 => {
  if (maxColumns >= 3 && screenWidth >= 900) return 3;
  if (maxColumns >= 2 && screenWidth >= 600) return 2;
  return 1;
};

export const getResponsiveGridItemWidth = ({
  screenWidth,
  itemIndex,
  itemCount,
  maxColumns = 3,
}: ResponsiveGridOptions): ResponsiveGridWidth => {
  const columns = getResponsiveColumnCount(screenWidth, maxColumns);
  if (columns === 1) return '100%';

  const remainder = itemCount % columns;
  const isIncompleteLastRow = remainder > 0 && itemIndex >= itemCount - remainder;

  if (isIncompleteLastRow) {
    if (remainder === 1) return '100%';
    return '48.4%';
  }

  return columns === 3 ? '31.8%' : '48.4%';
};

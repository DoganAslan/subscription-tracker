import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';

interface Props {
  breakdown: { category: string; amount: number; percentage: number }[];
  monthlyTotal: number;
}

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4', '#EC4899', '#EAB308'];

export const CategoryBreakdownCard = React.memo(function CategoryBreakdownCard({ breakdown, monthlyTotal }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  // Total spend
  const totalSpend = monthlyTotal > 0 ? monthlyTotal : breakdown.reduce((sum, item) => sum + item.amount, 0);

  const hasData = breakdown.length > 0;
  
  // Custom SVG Solid Pie Math
  const chartSize = 150;
  const center = chartSize / 2;
  const radius = center / 2; // Math to create a solid pie
  const strokeWidth = center; // Stroke covers from center to edge
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;
  const svgSlices = breakdown.map((item, index) => {
    const pct = totalSpend > 0 ? item.amount / totalSpend : 0;
    const strokeDashoffset = circumference - (pct * circumference);
    const rotation = cumulativePercentage * 360;
    cumulativePercentage += pct;
    
    return (
      <Circle
        key={item.category}
        cx={center}
        cy={center}
        r={radius}
        stroke={VIBRANT_COLORS[index % VIBRANT_COLORS.length]}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(${rotation} ${center} ${center})`}
        fill="transparent"
      />
    );
  });

  return (
    <Animated.View entering={FadeInUp.duration(600).springify()} style={dynamicStyles.cardContainer}>
      <View style={dynamicStyles.headerRow}>
        <Text style={dynamicStyles.cardTitle}>{t('home.categoryBreakdown')}</Text>
      </View>
      
      {hasData === false ? (
        <Text style={dynamicStyles.emptyText}>{t('common.error') /* or appropriate empty text */}</Text>
      ) : (
        <View style={dynamicStyles.contentColumn}>
          
          {/* TOP SECTION: Large Centered Donut Chart */}
          <Animated.View entering={ZoomIn.duration(800).delay(200)} style={dynamicStyles.topSection}>
            <View style={dynamicStyles.pieContainer}>
              <View style={[dynamicStyles.chartSquareWrapper, { width: chartSize, height: chartSize }]}>
                {Platform.OS === 'web' && typeof window === 'undefined' ? (
                  <View style={dynamicStyles.ssrFallback}>
                    <Text style={{ color: colors.text }}>{t('global.loading')}</Text>
                  </View>
                ) : (
                  <View pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'}>
                    <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
                      <G transform={`rotate(-90 ${center} ${center})`}>
                        {svgSlices}
                      </G>
                    </Svg>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* BOTTOM SECTION: Progress Metric Bars */}
          <View style={dynamicStyles.categoryList}>
            {breakdown.map((item, index) => {
              const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0;
              const color = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
              
              return (
                <Animated.View entering={FadeInDown.duration(500).delay(300 + index * 100)} key={item.category} style={dynamicStyles.categoryRow}>
                  
                  {/* Info Row */}
                  <View style={dynamicStyles.catInfoRow}>
                    <View style={dynamicStyles.catLeft}>
                      <Text style={dynamicStyles.catName} numberOfLines={1}>{item.category}</Text>
                      <View style={[dynamicStyles.pillBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[dynamicStyles.pillText, { color: color }]}>%{pct}</Text>
                      </View>
                    </View>
                    <Text style={dynamicStyles.catAmount}>
                      {item.amount.toFixed(0)} {baseCurrency}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={dynamicStyles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>

                </Animated.View>
              );
            })}
          </View>

        </View>
      )}
    </Animated.View>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Reduced from 24
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  contentColumn: {
    flexDirection: 'column',
    width: '100%',
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Reduced from 32
    marginTop: 0, // Reduced from 8
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  catInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  catName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    flexShrink: 1,
    marginRight: 10,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  catAmount: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  progressBarBg: {
    height: 4, // Reduced from 8
    backgroundColor: colors.border,
    borderRadius: 9999,
    width: '100%',
    overflow: 'hidden',
  },
  ssrFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartSquareWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 8,
  }
});

const styles = StyleSheet.create({
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
  }
});

import React from 'react';
import { View, Text, Dimensions, Platform, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Props {
  breakdown: { category: string; amount: number; percentage: number }[];
  monthlyTotal: number;
}

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4', '#EC4899', '#EAB308'];
const screenWidth = Dimensions.get('window').width;

export const CategoryBreakdownCard = React.memo(function CategoryBreakdownCard({ breakdown, monthlyTotal }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  // Total spend
  const totalSpend = monthlyTotal > 0 ? monthlyTotal : breakdown.reduce((sum, item) => sum + item.amount, 0);

  const chartData = breakdown.map((item, index) => {
    const color = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
    return {
      name: item.category,
      amount: item.amount,
      color: color,
      legendFontColor: 'transparent', // Hide the native legend text
      legendFontSize: 0 // Hide the native legend font
    };
  });

  const hasData = breakdown.length > 0;
  
  // Clean pie chart size
  const chartSize = 120;

  return (
    <View style={dynamicStyles.cardContainer}>
      <View style={dynamicStyles.headerRow}>
        <Text style={dynamicStyles.cardTitle}>{t('home.categoryBreakdown')}</Text>
      </View>
      
      {hasData === false ? (
        <Text style={dynamicStyles.emptyText}>{t('common.error') /* or appropriate empty text */}</Text>
      ) : (
        <View style={dynamicStyles.contentColumn}>
          
          {/* TOP SECTION: Pie Chart (Left) + Category List (Right) */}
          <View style={dynamicStyles.topSection}>
            <View style={dynamicStyles.pieContainer}>
              <View style={[dynamicStyles.chartWrapper, { width: chartSize, height: chartSize }]}>
                {Platform.OS === 'web' && typeof window === 'undefined' ? (
                  <View style={dynamicStyles.ssrFallback}>
                    <Text style={{ color: colors.text }}>Loading...</Text>
                  </View>
                ) : (
                  <View pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'}>
                    <PieChart
                      data={chartData}
                      width={chartSize}
                      height={chartSize}
                      hasLegend={false}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft={Platform.OS === 'ios' ? '30' : '30'} 
                      absolute={true}
                    />
                  </View>
                )}
                
                {/* Donut Hole perfectly centered */}
                <View style={dynamicStyles.donutHole}>
                  <Text style={dynamicStyles.donutHoleText}>Total</Text>
                </View>
              </View>
            </View>

            {/* Right: Compact Category List */}
            <View style={dynamicStyles.categoryList}>
              {breakdown.map((item, index) => {
                const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0;
                const color = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
                
                return (
                  <View key={item.category} style={dynamicStyles.categoryRow}>
                    <View style={dynamicStyles.catLeft}>
                      <View style={[dynamicStyles.catDot, { backgroundColor: color }]} />
                      <Text style={dynamicStyles.catName} numberOfLines={1}>
                        {item.category}
                      </Text>
                    </View>
                    <Text style={dynamicStyles.catPercent}>%{pct}</Text>
                    <Text style={dynamicStyles.catAmount}>
                      {item.amount.toFixed(0)} {baseCurrency}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
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
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieContainer: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    flex: 1,
    marginLeft: 24,
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  catLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  catName: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 14,
    flexShrink: 1,
  },
  catPercent: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
    marginRight: 8,
  },
  catAmount: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    width: 60,
    textAlign: 'right',
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
  chartWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutHole: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutHoleText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

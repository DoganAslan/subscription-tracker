import React from 'react';
import { View, Text, Dimensions, Platform, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useBudgetStore } from '@/store/useBudgetStore';

interface Props {
  breakdown: { category: string; amount: number; percentage: number }[];
  monthlyTotal: number;
}

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4', '#EC4899', '#EAB308'];

export function CategoryBreakdownCard({ breakdown, monthlyTotal }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const budgetCaps = useBudgetStore(state => state.budgetCaps);
  
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
  const chartSize = 140;

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>Spending by Category</Text>
      
      {hasData === false ? (
        <Text style={styles.emptyText}>No data available.</Text>
      ) : (
        <View style={styles.contentRow}>
          
          {/* LEFT SIDE: DONUT CHART */}
          <View style={[styles.chartWrapper, { width: chartSize, height: chartSize }]}>
            {Platform.OS === 'web' && typeof window === 'undefined' ? (
              <View style={styles.ssrFallback}>
                <Text style={{ color: '#FFFFFF' }}>Loading chart...</Text>
              </View>
            ) : (
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
                paddingLeft={Platform.OS === 'ios' ? '35' : '35'} // Magic offset to center the pie internally
                absolute={true}
              />
            )}
            
            {/* Donut Hole perfectly centered */}
            <View style={styles.donutHole}>
              <Text style={styles.donutHoleText}>Total</Text>
            </View>
          </View>

          {/* RIGHT SIDE: CUSTOM LEGEND & BARS */}
          <View style={styles.legendWrapper}>
            {breakdown.map((item, index) => {
              const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0;
              
              const cap = budgetCaps[item.category];
              const isOverBudget = cap !== undefined && cap > 0 && item.amount > cap;
              const color = isOverBudget ? '#EF4444' : VIBRANT_COLORS[index % VIBRANT_COLORS.length];
              
              return (
                <View key={item.category} style={styles.listItem}>
                  <View style={styles.listRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.colorDot, { backgroundColor: color }]} />
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {item.category} - {pct}%
                      </Text>
                      {isOverBudget && (
                        <Ionicons name="warning-outline" size={14} color="#EF4444" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.amountRow}>
                    <Text style={styles.amountText}>
                      {item.amount.toFixed(2)} <Text style={styles.currencyCode}>{baseCurrency}</Text>
                      {isOverBudget && <Text style={{ color: '#EF4444', fontSize: 11, marginLeft: 6 }}> (Over Limit)</Text>}
                    </Text>
                  </View>
                  
                  <View style={styles.progressTrack}>
                    <View 
                      style={[
                        styles.progressBar,
                        { 
                          backgroundColor: color, 
                          width: `${Math.max(pct, 2)}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
          
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262A35',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1F2937', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutHoleText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  legendWrapper: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  listItem: {
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    color: '#E5E7EB',
    fontWeight: '500',
    fontSize: 13,
    flexShrink: 1,
  },
  amountRow: {
    marginBottom: 6,
    paddingLeft: 18, // align with text, bypassing dot
  },
  amountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  currencyCode: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: 'normal',
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 18,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  }
});

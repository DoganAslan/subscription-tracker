import React, { useState } from 'react';
import { View, Text, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Subscription } from '@/services/firebase/types';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

interface Props {
  breakdown: { category: string; amount: number; percentage: number }[];
  monthlyTotal: number;
  subscriptions?: Subscription[];
}

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4', '#EC4899', '#EAB308'];

const getCategoryMeta = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('müzik') || c.includes('music')) return { icon: 'musical-notes-outline', color: '#10B981' };
  if (c.includes('eğlence') || c.includes('entertainment') || c.includes('film') || c.includes('video')) return { icon: 'film-outline', color: '#8B5CF6' };
  if (c.includes('üretkenlik') || c.includes('productivity') || c.includes('iş') || c.includes('work')) return { icon: 'briefcase-outline', color: '#3B82F6' };
  if (c.includes('yazılım') || c.includes('cloud') || c.includes('tools') || c.includes('araç')) return { icon: 'code-slash-outline', color: '#F59E0B' };
  if (c.includes('sağlık') || c.includes('health') || c.includes('spor') || c.includes('fitness')) return { icon: 'fitness-outline', color: '#EF4444' };
  return { icon: 'grid-outline', color: '#6B7280' };
};

export const CategoryBreakdownCard = React.memo(function CategoryBreakdownCard({ breakdown, monthlyTotal, subscriptions = [] }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const totalSpend = monthlyTotal > 0 ? monthlyTotal : breakdown.reduce((sum, item) => sum + item.amount, 0);
  const hasData = breakdown.length > 0;
  
  // Custom Donut Chart Math
  const chartSize = 180;
  const center = chartSize / 2;
  const radius = 62;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;
  const svgSlices = breakdown.map((item, index) => {
    const pct = totalSpend > 0 ? item.amount / totalSpend : 0;
    const strokeDashoffset = circumference - (pct * circumference);
    const rotation = cumulativePercentage * 360;
    cumulativePercentage += pct;
    const color = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
    const isHoveredOrSelected = (hoveredCategory || selectedCategory) === item.category;

    const circleProps = Platform.OS === 'web' ? {
      onClick: () => handleCategoryPress(item.category),
      onMouseEnter: () => setHoveredCategory(item.category),
      onMouseLeave: () => setHoveredCategory(null),
      style: { cursor: 'pointer', transition: 'all 0.2s ease' }
    } : {
      onPress: () => handleCategoryPress(item.category)
    };

    return (
      <Circle
        key={item.category}
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={isHoveredOrSelected ? strokeWidth + 6 : strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(${rotation} ${center} ${center})`}
        fill="transparent"
        {...circleProps}
      />
    );
  });

  const handleCategoryPress = (categoryName: string) => {
    triggerHaptic('selection');
    setSelectedCategory(prev => (prev === categoryName ? null : categoryName));
  };

  const handleSubPress = (subId: string) => {
    triggerHaptic('impactLight');
    router.push(`/(tabs)/subscriptions/${subId}`);
  };

  const activeHoverItem = breakdown.find(b => b.category === (hoveredCategory || selectedCategory));

  return (
    <Animated.View entering={FadeInUp.duration(600).springify()} style={dynamicStyles.cardContainer}>
      <View style={dynamicStyles.headerRow}>
        <Text style={dynamicStyles.cardTitle}>{t.dashboard?.categoryBreakdown || 'Category Breakdown'}</Text>
        {(selectedCategory || hoveredCategory) && (
          <TouchableOpacity onPress={() => { setSelectedCategory(null); setHoveredCategory(null); }} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{isTurkish ? 'Filtreyi sıfırla' : 'Reset filter'}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!hasData ? (
        <Text style={dynamicStyles.emptyText}>{isTurkish ? 'Henüz kategori verisi yok.' : 'No category data recorded yet.'}</Text>
      ) : (
        <View style={dynamicStyles.contentColumn}>
          {/* TOP SECTION: Interactive Donut Chart with Center Text */}
          <Animated.View entering={ZoomIn.duration(800).delay(200)} style={dynamicStyles.topSection}>
            <View style={dynamicStyles.pieContainer}>
              <View style={[dynamicStyles.chartSquareWrapper, { width: chartSize, height: chartSize }]}>
                {Platform.OS === 'web' && typeof window === 'undefined' ? (
                  <View style={dynamicStyles.ssrFallback}>
                    <Text style={{ color: colors.text }}>{t.global.loading}</Text>
                  </View>
                ) : (
                  <>
                    <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
                      <G transform={`rotate(-90 ${center} ${center})`}>
                        {svgSlices}
                      </G>
                    </Svg>

                    {/* Donut Center Label */}
                    <View style={dynamicStyles.donutCenterBox} pointerEvents="none">
                      {activeHoverItem ? (
                        <>
                          <Text style={[dynamicStyles.donutHoverCategory, { color: colors.primary }]} numberOfLines={1}>
                            {(t.categories as any)?.[activeHoverItem.category] || activeHoverItem.category}
                          </Text>
                          <Text style={[dynamicStyles.donutHoverAmount, { color: colors.text }]}>
                            {activeHoverItem.amount.toFixed(0)} {baseCurrency}
                          </Text>
                          <View style={[dynamicStyles.donutHoverBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[dynamicStyles.donutHoverBadgeText, { color: colors.primary }]}>
                              %{Math.round((activeHoverItem.amount / (totalSpend || 1)) * 100)}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={[dynamicStyles.donutTotalLabel, { color: colors.textSecondary }]}>{isTurkish ? 'TOPLAM' : 'TOTAL'}</Text>
                          <Text style={[dynamicStyles.donutTotalAmount, { color: colors.text }]}>
                            {totalSpend.toFixed(0)} {baseCurrency}
                          </Text>
                          <Text style={[dynamicStyles.donutSubtext, { color: colors.textSecondary }]}>{isTurkish ? 'Bir dilime dokun' : 'Tap a slice'}</Text>
                        </>
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>
          </Animated.View>

          {/* BOTTOM SECTION: Category Bars */}
          <View style={dynamicStyles.categoryList}>
            {breakdown.map((item, index) => {
              const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0;
              const color = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
              const isExpanded = selectedCategory === item.category;
              const isHovered = hoveredCategory === item.category;

              // Filter subscriptions for this category
              const categorySubs = subscriptions.filter(s => 
                (s.category?.toLowerCase() === item.category.toLowerCase()) ||
                (item.category === 'Other' && !s.category)
              );
              
              return (
                <Animated.View entering={FadeInDown.duration(500).delay(200 + index * 80)} key={item.category} style={dynamicStyles.categoryWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCategoryPress(item.category)}
                    {...(Platform.OS === 'web' ? {
                      onMouseEnter: () => setHoveredCategory(item.category),
                      onMouseLeave: () => setHoveredCategory(null),
                    } : {})}
                    style={[
                      dynamicStyles.categoryRow,
                      (isExpanded || isHovered) && { backgroundColor: color + '15', borderRadius: 14, padding: 10, marginHorizontal: -10 }
                    ]}
                  >
                    {/* Info Row */}
                    <View style={dynamicStyles.catInfoRow}>
                      <View style={dynamicStyles.catLeft}>
                        <CategoryBadge category={item.category} size="sm" />
                        <View style={[dynamicStyles.pillBadge, { backgroundColor: color + '20' }]}>
                          <Text style={[dynamicStyles.pillText, { color: color }]}>%{pct}</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={dynamicStyles.catAmount}>
                          {item.amount.toFixed(0)} {baseCurrency}
                        </Text>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={16} 
                          color={colors.textSecondary} 
                        />
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={dynamicStyles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </TouchableOpacity>

                  {/* EXPANDED APPS LIST INSIDE CATEGORY */}
                  {isExpanded && (
                    <Animated.View entering={FadeInDown.duration(300)} style={dynamicStyles.subAppsContainer}>
                      <Text style={[dynamicStyles.expandedHeaderTitle, { color: colors.textSecondary }]}>
                        {currentLanguage === 'tr' ? `${item.category} kategorisindeki ${categorySubs.length} abonelik:` : `${categorySubs.length} Apps in ${item.category}:`}
                      </Text>

                      {categorySubs.length === 0 ? (
                        <Text style={[dynamicStyles.noSubsText, { color: colors.textSecondary }]}>
                          {currentLanguage === 'tr' ? 'Bu kategoride aktif abonelik bulunmuyor.' : 'No active subscriptions in this category.'}
                        </Text>
                      ) : (
                        categorySubs.map(sub => {
                          const meta = getCategoryMeta(sub.category || '');
                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[dynamicStyles.subAppRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                              activeOpacity={0.7}
                              onPress={() => sub.id && handleSubPress(sub.id)}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[dynamicStyles.appIconBox, { backgroundColor: meta.color + '20' }]}>
                                  <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                                </View>
                                <View>
                                  <Text style={[dynamicStyles.appNameText, { color: colors.text }]}>{sub.name}</Text>
                                  <Text style={[dynamicStyles.appCycleText, { color: colors.textSecondary }]}>
                                    {sub.billingCycle || 'monthly'}
                                  </Text>
                                </View>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={[dynamicStyles.appPriceText, { color: colors.text }]}>
                                  {sub.amount} {sub.currency || baseCurrency}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </Animated.View>
                  )}
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
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
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
    marginBottom: 20,
    marginTop: 0,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartSquareWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  donutCenterBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  donutTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  donutTotalAmount: {
    fontSize: 17,
    fontWeight: '900',
    marginVertical: 1,
  },
  donutSubtext: {
    fontSize: 9,
    fontWeight: '600',
  },
  donutHoverCategory: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  donutHoverAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 1,
  },
  donutHoverBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  donutHoverBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  categoryList: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryWrapper: {
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'column',
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
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  catName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginRight: 8,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  catAmount: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 9999,
    width: '100%',
    overflow: 'hidden',
  },
  subAppsContainer: {
    marginTop: 10,
    paddingTop: 10,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  expandedHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  noSubsText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  subAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  appIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  appCycleText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  appPriceText: {
    fontSize: 13,
    fontWeight: '800',
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
});

const styles = StyleSheet.create({
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
  }
});

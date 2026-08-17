import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { generateMonthlyHeatmap, DayHeatmapData } from '@/utils/heatmap';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function SpendingHeatmapCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [selectedDay, setSelectedDay] = useState<DayHeatmapData | null>(null);

  const heatmapDays = useMemo(() => {
    return generateMonthlyHeatmap(subscriptions, baseCurrency);
  }, [subscriptions, baseCurrency]);

  const peakDaysCount = useMemo(() => {
    return heatmapDays.filter(d => d.intensityLevel === 3).length;
  }, [heatmapDays]);

  const getIntensityColor = (level: number) => {
    switch (level) {
      case 3:
        return '#EF4444'; // Red peak
      case 2:
        return '#F59E0B'; // Orange moderate
      case 1:
        return '#10B981'; // Green light
      default:
        return colors.border;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)', flexShrink: 0 }]}>
            <Ionicons name="grid-outline" size={18} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
              {isTurkish ? 'Harcama Isı Haritası' : 'Subscription Spending Heatmap'}
            </Text>
            <Text numberOfLines={1} style={[styles.cardSub, { color: colors.textSecondary }]}>
              {isTurkish ? 'Aylık ödeme yoğunluğu matrisi' : 'Monthly payment density matrix'}
            </Text>
          </View>
        </View>

        {peakDaysCount > 0 && (
          <View style={styles.peakPill}>
            <Text style={styles.peakPillText}>{peakDaysCount} Yoğun Gün</Text>
          </View>
        )}
      </View>

      {/* Compact Heatmap Grid (Compact 34x34px Cells) */}
      <View style={styles.gridMatrix}>
        {heatmapDays.map((item) => {
          const color = getIntensityColor(item.intensityLevel);
          const isSelected = selectedDay?.dayNumber === item.dayNumber;

          return (
            <TouchableOpacity
              key={item.dayNumber}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('selection');
                setSelectedDay(item);
              }}
              style={[
                styles.gridCell,
                {
                  backgroundColor: item.intensityLevel > 0 ? color + '22' : colors.background,
                  borderColor: isSelected ? '#3B82F6' : item.intensityLevel > 0 ? color + '60' : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellDayText,
                  {
                    color: item.intensityLevel > 0 ? color : colors.textSecondary,
                    fontWeight: item.intensityLevel > 0 ? '800' : '600',
                  },
                ]}
              >
                {item.dayNumber}
              </Text>
              {item.intensityLevel > 0 && (
                <View style={[styles.dotIndicator, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <View style={[styles.detailsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>
              {isTurkish ? `Ayın ${selectedDay.dayNumber}. Günü Detayı` : `Day ${selectedDay.dayNumber} Details`}
            </Text>
            <Text style={styles.detailsTotal}>
              {selectedDay.totalSpent > 0 ? `${selectedDay.totalSpent} ${baseCurrency}` : (isTurkish ? 'Ödeme Yok' : 'No Payments')}
            </Text>
          </View>

          {selectedDay.subscriptions.length > 0 ? (
            <View style={{ gap: 6, marginTop: 8 }}>
              {selectedDay.subscriptions.map((sub, idx) => (
                <View key={idx} style={styles.subItemRow}>
                  <Text style={[styles.subNameText, { color: colors.text }]}>{sub.name}</Text>
                  <Text style={styles.subAmountText}>{sub.amount} {sub.currency}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noSubText, { color: colors.textSecondary }]}>
              {isTurkish ? 'Bu güne denk gelen yenilenme bulunmuyor.' : 'No renewals scheduled for this day.'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  peakPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  peakPillText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  gridMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  gridCell: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellDayText: {
    fontSize: 11,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 3,
  },
  detailsBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B82F6',
  },
  noSubText: {
    fontSize: 11,
    marginTop: 4,
  },
  subItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});

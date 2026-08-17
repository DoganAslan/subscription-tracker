import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { detectDuplicateSubscriptions } from '@/utils/duplicateDetector';
import { triggerHaptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';

interface Props {
  subscriptions: Subscription[];
}

export function DuplicateDetectorCard({ subscriptions }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const router = useRouter();

  const alerts = detectDuplicateSubscriptions(subscriptions || [], isTurkish);

  if (alerts.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)', flexShrink: 0 }]}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
              {isTurkish ? 'Çifte Çekim & Mükerrer Radar' : 'Duplicate Charge Detector'}
            </Text>
            <Text numberOfLines={1} style={[styles.cardSub, { color: colors.textSecondary }]}>
              {isTurkish ? 'Şüpheli çifte ödemeler tespit edildi' : 'Suspicious double billings detected'}
            </Text>
          </View>
        </View>

        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{alerts.length} UYARI</Text>
        </View>
      </View>

      {/* Alerts List */}
      <View style={{ gap: 10 }}>
        {alerts.map((alert) => (
          <View key={alert.id} style={[styles.alertItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.alertTitle, { color: alert.severity === 'high' ? '#EF4444' : '#F59E0B' }]}>
              {alert.title}
            </Text>
            <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>{alert.description}</Text>

            <View style={styles.actionRow}>
              {alert.subs.map(sub => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subBtn}
                  onPress={() => {
                    triggerHaptic('selection');
                    if (sub.id) router.push(`/(tabs)/subscriptions/${sub.id}`);
                  }}
                >
                  <Text numberOfLines={1} style={styles.subBtnText}>
                    {sub.name} ({sub.amount} {sub.currency})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
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
  alertBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  alertBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  alertItem: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  subBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
});

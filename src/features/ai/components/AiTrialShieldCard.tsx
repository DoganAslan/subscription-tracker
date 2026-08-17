import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { analyzeTrialShield, TrialShieldSummary } from '@/services/ai/aiTrialShield';
import { triggerHaptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function AiTrialShieldCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const router = useRouter();

  const summary: TrialShieldSummary = React.useMemo(() => {
    return analyzeTrialShield(subscriptions, baseCurrency);
  }, [subscriptions, baseCurrency]);

  if (summary.activeTrialsCount === 0) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: summary.urgentTrialsCount > 0 ? '#EF4444' : colors.border }]}>
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: summary.urgentTrialsCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={summary.urgentTrialsCount > 0 ? '#EF4444' : '#3B82F6'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isTurkish ? 'YZ Ücretsiz Deneme & Sanal Kart Kalkanı' : 'AI Free Trial & Card Shield'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isTurkish ? `${summary.activeTrialsCount} aktif deneme takibiniz var` : `${summary.activeTrialsCount} active trial shield online`}
            </Text>
          </View>
        </View>

        {summary.urgentTrialsCount > 0 && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>
              {summary.urgentTrialsCount} {isTurkish ? 'Kritik 24s' : 'Urgent'}
            </Text>
          </View>
        )}
      </View>

      {/* Trial Items List */}
      <View style={{ gap: 10, marginTop: 6 }}>
        {summary.items.map((item) => {
          const isUrgent = item.riskLevel === 'urgent_24h';
          const isWarning = item.riskLevel === 'warning_3d';

          const badgeBg = isUrgent ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
          const badgeColor = isUrgent ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

          return (
            <TouchableOpacity
              key={item.subscriptionId}
              style={[styles.itemBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                triggerHaptic('impactLight');
                router.push(`/(tabs)/subscriptions/${item.subscriptionId}`);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.subscriptionName}</Text>
                  <Text style={[styles.itemAmount, { color: colors.textSecondary }]}>
                    {isTurkish ? 'Sonrası:' : 'Post-trial:'} <Text style={{ fontWeight: '800', color: colors.text }}>{item.amount} {item.currency}</Text>
                  </Text>
                </View>

                <View style={[styles.timeBadge, { backgroundColor: badgeBg }]}>
                  <Ionicons name={isUrgent ? 'alarm' : 'timer-outline'} size={14} color={badgeColor} style={{ marginRight: 4 }} />
                  <Text style={[styles.timeBadgeText, { color: badgeColor }]}>
                    {isUrgent ? `${item.hoursLeft}s Kaldı` : `${item.daysLeft} Gün Kaldı`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.recommendationText, { color: isUrgent ? '#EF4444' : colors.textSecondary }]}>
                {item.recommendation}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                  onPress={() => {
                    triggerHaptic('notificationWarning');
                    Alert.alert(
                      isTurkish ? 'İptal Hatırlatıcısı' : 'Cancel Reminder',
                      isTurkish ? `${item.subscriptionName} deneme sürümünü iptal etmek için abonelik sayfasına gidilsin mi?` : `Go to details to cancel ${item.subscriptionName}?`,
                      [
                        { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
                        { text: isTurkish ? 'Detaya Git' : 'Go to Sub', onPress: () => router.push(`/(tabs)/subscriptions/${item.subscriptionId}`) }
                      ]
                    );
                  }}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {isTurkish ? 'İptal Et / Dondur' : 'Cancel Trial'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}
                  onPress={() => {
                    triggerHaptic('selection');
                    router.push('/(tabs)/wallet');
                  }}
                >
                  <Ionicons name="card-outline" size={14} color="#3B82F6" />
                  <Text style={[styles.actionBtnText, { color: '#3B82F6' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {isTurkish ? 'Sanal Kart Bağla' : 'Link Virtual Card'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  itemBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

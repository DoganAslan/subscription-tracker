import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { evaluateUserBadges } from '../services/badgeService';

interface Props {
  subscriptions: Subscription[];
}

export function BadgesWidget({ subscriptions }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const safeSubs = Array.isArray(subscriptions) ? subscriptions : [];
  const badges = typeof evaluateUserBadges === 'function' ? evaluateUserBadges(safeSubs, isTurkish) : [];
  const unlockedCount = badges.filter(b => b.unlocked).length;

  if (!badges || badges.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)', flexShrink: 0 }]}>
            <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {isTurkish ? 'Tasarruf & Disiplin Rozetleri' : 'Savings & Discipline Badges'}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isTurkish ? `${badges.length} rozetten ${unlockedCount} tanesi kazanıldı` : `${unlockedCount} of ${badges.length} badges unlocked`}
            </Text>
          </View>
        </View>

        <View style={styles.badgeCountPill}>
          <Text style={styles.badgeCountText}>{unlockedCount}/{badges.length}</Text>
        </View>
      </View>

      {/* Grid of Badges */}
      <View style={styles.badgeGrid}>
        {badges.map((b) => (
          <View
            key={b.id}
            style={[
              styles.badgeItem,
              {
                backgroundColor: colors.background,
                borderColor: b.unlocked ? b.color + '60' : colors.border,
                opacity: b.unlocked ? 1 : 0.7,
              },
            ]}
          >
            <View style={[styles.badgeIconBox, { backgroundColor: b.unlocked ? b.color + '18' : 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name={b.icon as any} size={22} color={b.unlocked ? b.color : colors.textSecondary} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text numberOfLines={1} style={[styles.badgeTitle, { color: colors.text }]}>{b.title}</Text>
                {b.unlocked && (
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                )}
              </View>
              <Text numberOfLines={2} style={[styles.badgeDesc, { color: colors.textSecondary }]}>{b.description}</Text>

              {/* Progress bar */}
              {!b.unlocked && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, b.progress ?? 0))}%`, backgroundColor: b.color }]} />
                </View>
              )}
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
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  badgeCountPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  badgeCountText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeGrid: {
    gap: 10,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  badgeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  badgeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

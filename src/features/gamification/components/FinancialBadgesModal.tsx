import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { calculateUserBadges, UserGamificationSummary } from '../services/badgeService';

interface Props {
  visible: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
}

export function FinancialBadgesModal({ visible, onClose, subscriptions }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const stats: UserGamificationSummary = React.useMemo(() => {
    return calculateUserBadges(subscriptions);
  }, [subscriptions]);

  const progressPercent = Math.min(100, (stats.totalXp / stats.xpForNextLevel) * 100);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.trophyIcon}>
                <Ionicons name="trophy" size={22} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isTurkish ? '🏆 Başarı & Rozetleriniz' : '🏆 Gamified Badges'}
                </Text>
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                  {isTurkish ? 'Aboneliklerinizi yönetin, rozet ve XP kazanın' : 'Earn XP and level up your financial score'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Level Progress Banner */}
          <View style={[styles.levelBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.levelRow}>
              <View>
                <Text style={[styles.levelBadgeText, { color: colors.primary }]}>
                  {isTurkish ? `SEVİYE ${stats.level}` : `LEVEL ${stats.level}`}
                </Text>
                <Text style={[styles.levelTitleText, { color: colors.text }]}>
                  {stats.levelTitle}
                </Text>
              </View>

              <View style={styles.xpBox}>
                <Text style={styles.xpText}>{stats.totalXp} XP</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Badges Grid */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10, paddingVertical: 4 }}>
              {stats.badges.map((b) => (
                <View
                  key={b.id}
                  style={[
                    styles.badgeCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: b.unlocked ? '#F59E0B' : colors.border,
                      opacity: b.unlocked ? 1 : 0.6,
                    },
                  ]}
                >
                  <View style={[styles.badgeIconBox, { backgroundColor: b.unlocked ? 'rgba(245, 158, 11, 0.15)' : colors.surface }]}>
                    <Ionicons name={b.iconName as any} size={24} color={b.unlocked ? '#F59E0B' : colors.textSecondary} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.badgeTitle, { color: colors.text }]}>{b.title}</Text>
                      <Text style={[styles.badgeXp, { color: b.unlocked ? '#F59E0B' : colors.textSecondary }]}>
                        +{b.xpValue} XP
                      </Text>
                    </View>

                    <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>{b.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    maxHeight: '80%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  levelBanner: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  levelTitleText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  xpBox: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  badgeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeXp: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
});

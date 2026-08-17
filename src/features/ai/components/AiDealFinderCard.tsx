import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { findDealOpportunities, DealOpportunity } from '@/services/ai/dealFinder';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function AiDealFinderCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [selectedDeal, setSelectedDeal] = useState<DealOpportunity | null>(null);

  const deals = useMemo(() => {
    return findDealOpportunities(subscriptions, baseCurrency, isTurkish);
  }, [subscriptions, baseCurrency, isTurkish]);

  if (deals.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)', flexShrink: 0 }]}>
            <Ionicons name="pricetags-outline" size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
              {isTurkish ? 'YZ Paket & Aile İndirim Dedektifi' : 'AI Deal & Family Plan Finder'}
            </Text>
            <Text numberOfLines={1} style={[styles.cardSub, { color: colors.textSecondary }]}>
              {isTurkish ? 'Kişi başı yıllık dev tasarruf imkanları' : 'High yield per-person savings opportunities'}
            </Text>
          </View>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{deals.length} Fırsat</Text>
        </View>
      </View>

      {/* Deals List */}
      <View style={{ gap: 12 }}>
        {deals.map((deal) => (
          <TouchableOpacity
            key={deal.id}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('selection');
              setSelectedDeal(deal);
            }}
            style={[styles.dealItem, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>{deal.badge}</Text>
                </View>
                {deal.yearlySavingsPerPerson > 0 && (
                  <Text style={styles.savingsHighlight}>
                    {isTurkish ? `Yılda ~${deal.yearlySavingsPerPerson} ${deal.currency} Tasarruf` : `Save ~${deal.yearlySavingsPerPerson} ${deal.currency}/yr`}
                  </Text>
                )}
              </View>

              <Text style={[styles.dealTitle, { color: colors.text }]}>{deal.title}</Text>
              <Text style={[styles.dealSub, { color: colors.textSecondary }]}>{deal.subtitle}</Text>
            </View>

            <View style={styles.arrowBox}>
              <Ionicons name="chevron-forward" size={18} color="#10B981" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Guide Modal */}
      <Modal
        visible={selectedDeal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {selectedDeal && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalBadge}>
                    <Ionicons name="sparkles" size={14} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={styles.modalBadgeText}>{selectedDeal.badge}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedDeal(null)}
                    style={[styles.closeBtn, { backgroundColor: colors.background }]}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedDeal.title}</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>{selectedDeal.subtitle}</Text>

                {/* Savings Summary Banner */}
                <View style={styles.savingsBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerLabel}>{isTurkish ? 'Mevcut Tekil Maliyet' : 'Current Monthly'}</Text>
                    <Text style={styles.bannerValue}>{selectedDeal.originalMonthly} {selectedDeal.currency}/ay</Text>
                  </View>
                  <View style={styles.bannerDivider} />
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.bannerLabel}>{isTurkish ? 'Paket Sonrası Kişi Başı' : 'Family Per Person'}</Text>
                    <Text style={[styles.bannerValue, { color: '#10B981' }]}>{selectedDeal.potentialMonthlyPerPerson} {selectedDeal.currency}/ay</Text>
                  </View>
                </View>

                <Text style={[styles.guideSectionTitle, { color: colors.text }]}>
                  {isTurkish ? '📌 Geçiş Adımları (Nasıl Yapılır?)' : '📌 Step-by-Step Transition Guide'}
                </Text>

                <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
                  {selectedDeal.actionGuide.map((step, idx) => (
                    <View key={idx} style={styles.guideStepRow}>
                      <Text style={[styles.guideStepText, { color: colors.text }]}>{step}</Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.doneModalBtn}
                  onPress={() => {
                    triggerHaptic('notificationSuccess');
                    setSelectedDeal(null);
                  }}
                >
                  <Text style={styles.doneModalBtnText}>{isTurkish ? 'Anladım, Kapat' : 'Got it'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
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
  countBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  countBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  dealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  dealBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  savingsHighlight: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  dealSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 16,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  bannerValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 2,
  },
  bannerDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    marginHorizontal: 12,
  },
  guideSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  guideStepRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  guideStepText: {
    fontSize: 12,
    lineHeight: 17,
  },
  doneModalBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  doneModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

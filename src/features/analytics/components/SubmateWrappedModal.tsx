import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { calculateSubmateWrapped, WrappedMetrics } from '@/services/ai/aiWrappedService';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function SubmateWrappedModal({ visible, onClose, subscriptions, baseCurrency }: Props) {
  useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const [currentSlide, setCurrentSlide] = useState(0);

  const wrapped: WrappedMetrics = React.useMemo(() => {
    return calculateSubmateWrapped(subscriptions, baseCurrency);
  }, [subscriptions, baseCurrency]);

  const handleShare = async () => {
    triggerHaptic('impactLight');
    try {
      await Share.share({
        message: isTurkish
          ? `🎉 SubMate ${wrapped.year} Abonelik Özetim!\n\n💰 Yıllık Toplam: ${wrapped.totalAnnualSpent} ${baseCurrency}\n👑 En Büyük Kategori: ${wrapped.topCategoryName}\n🏆 Finansal Unvanım: ${wrapped.personaTitle}\n\nSen de aboneliklerini SubMate ile takip et!`
          : `🎉 My SubMate ${wrapped.year} Subscription Wrapped!\n\n💰 Annual Spent: ${wrapped.totalAnnualSpent} ${baseCurrency}\n👑 Top Category: ${wrapped.topCategoryName}\n🏆 Persona: ${wrapped.personaTitle}\n\nTrack your subscriptions with SubMate!`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const slides = [
    {
      bgGradient: '#8B5CF6',
      icon: 'sparkles',
      title: isTurkish ? `SubMate ${wrapped.year} Finansal Özetiniz!` : `Your SubMate ${wrapped.year} Wrapped!`,
      bigValue: `${wrapped.totalAnnualSpent} ${baseCurrency}`,
      subText: isTurkish ? 'Bu yıl aboneliklerinize yaptığınız toplam harcama' : 'Total subscription spending this year',
    },
    {
      bgGradient: '#3B82F6',
      icon: 'trophy',
      title: isTurkish ? 'Finansal Unvanınız' : 'Your Financial Persona',
      bigValue: wrapped.personaTitle,
      subText: wrapped.personaDescription,
    },
    {
      bgGradient: '#10B981',
      icon: 'pie-chart',
      title: isTurkish ? 'En Çok Harcanan Kategori' : 'Top Spending Category',
      bigValue: wrapped.topCategoryName,
      subText: isTurkish
        ? `Yıllık ~${wrapped.topCategoryAmount} ${baseCurrency} ile en büyük payı bu kategori aldı.`
        : `This category took the biggest share (~${wrapped.topCategoryAmount} ${baseCurrency}/yr).`,
    },
    {
      bgGradient: '#EC4899',
      icon: 'cash',
      title: isTurkish ? 'YZ İle Kalan Tasarruf Potansiyeli' : 'AI Potential Savings',
      bigValue: `~${wrapped.estimatedAnnualSavings} ${baseCurrency}`,
      subText: isTurkish
        ? 'Optimizasyonlar ve aile paketleriyle yıllık cebinizde kalabilecek tahmini tutar.'
        : 'Estimated annual savings with AI optimizations and family plans.',
    },
  ];

  const slide = slides[currentSlide];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.wrappedCard, { backgroundColor: slide.bgGradient }]}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            {/* Slide Progress Bars */}
            <View style={styles.progressRow}>
              {slides.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: idx <= currentSlide ? '#FFFFFF' : 'rgba(255,255,255,0.3)' },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          <View style={styles.slideBody}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon as any} size={36} color={slide.bgGradient} />
            </View>

            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.bigValue}>{slide.bigValue}</Text>
            <Text style={styles.subText}>{slide.subText}</Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-social" size={18} color={slide.bgGradient} />
              <Text style={[styles.shareBtnText, { color: slide.bgGradient }]}>
                {isTurkish ? 'Paylaş' : 'Share'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                triggerHaptic('selection');
                if (currentSlide < slides.length - 1) {
                  setCurrentSlide(currentSlide + 1);
                } else {
                  onClose();
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {currentSlide < slides.length - 1 ? (isTurkish ? 'İleri' : 'Next') : (isTurkish ? 'Bitti' : 'Done')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  wrappedCard: {
    flex: 1,
    borderRadius: 28,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    marginRight: 16,
  },
  progressBarFill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  closeBtn: {
    padding: 4,
  },
  slideBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  slideTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  bigValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  subText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

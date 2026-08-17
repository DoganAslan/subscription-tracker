// src/features/subscriptions/components/CancellationAssistModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { getCancellationGuide, openCancellationUrl } from '@/utils/cancelAssist';
import { triggerHaptic } from '@/utils/haptics';

interface CancellationAssistModalProps {
  visible: boolean;
  onClose: () => void;
  subscriptionName: string;
  cancelUrl?: string;
  onMarkCancelled?: () => void;
  isLoading?: boolean;
}

export function CancellationAssistModal({
  visible,
  onClose,
  subscriptionName,
  cancelUrl,
  onMarkCancelled,
  isLoading = false,
}: CancellationAssistModalProps) {
  const { colors, isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const guide = getCancellationGuide(subscriptionName, cancelUrl);
  const steps = isTurkish ? guide.stepsTr : guide.stepsEn;

  const toggleStep = (index: number) => {
    triggerHaptic('selection');
    setCompletedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleOpenUrl = () => {
    triggerHaptic('medium');
    openCancellationUrl(guide.cancelUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="shield-half-outline" size={22} color="#EF4444" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {guide.name}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isTurkish ? 'İptal Asistanı ve Rehberi' : 'Cancellation Assistant & Guide'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Direct Open Link Hero Button */}
            <TouchableOpacity
              onPress={handleOpenUrl}
              activeOpacity={0.85}
              style={[styles.heroOpenBtn, { backgroundColor: isDark ? '#2563EB' : '#1D4ED8' }]}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" style={{ flexShrink: 0 }} />
              <Text style={styles.heroOpenText} numberOfLines={1}>
                {isTurkish ? 'Doğrudan İptal Sayfasına Git' : 'Open Direct Cancellation Page'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />
            </TouchableOpacity>

            {/* Checklist Title */}
            <View style={styles.sectionHeader}>
              <Ionicons name="checkbox-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isTurkish ? 'Adım Adım İptal Rehberi' : 'Step-by-Step Checklist'}
              </Text>
            </View>

            {/* Steps List */}
            <View style={styles.stepsContainer}>
              {steps.map((stepText, idx) => {
                const isChecked = !!completedSteps[idx];
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => toggleStep(idx)}
                    style={[
                      styles.stepRow,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                        borderColor: isChecked ? '#10B981' : colors.border
                      }
                    ]}
                  >
                    <Ionicons
                      name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={isChecked ? "#10B981" : colors.textSecondary}
                      style={{ flexShrink: 0 }}
                    />
                    <Text
                      style={[
                        styles.stepText,
                        {
                          color: isChecked ? colors.textSecondary : colors.text,
                          textDecorationLine: isChecked ? 'line-through' : 'none'
                        }
                      ]}
                    >
                      {stepText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Action */}
          {onMarkCancelled && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('heavy');
                  onMarkCancelled();
                }}
                disabled={isLoading}
                activeOpacity={0.85}
                style={styles.markCancelledBtn}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cash-outline" size={20} color="#FFFFFF" style={{ flexShrink: 0 }} />
                    <Text style={styles.markCancelledText} numberOfLines={1}>
                      {isTurkish ? 'İptal Ettim & Tasarruf Kaydet' : 'Mark as Cancelled & Saved'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    marginBottom: 16,
  },
  heroOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    gap: 10,
    overflow: 'hidden',
  },
  heroOpenText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepsContainer: {
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingTop: 8,
  },
  markCancelledBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    overflow: 'hidden',
  },
  markCancelledText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    flexShrink: 1,
    textAlign: 'center',
  },
});

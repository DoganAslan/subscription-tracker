import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { generateAiNegotiationScript } from '@/services/ai/aiNegotiator';
import { triggerHaptic } from '@/utils/haptics';
import * as Clipboard from 'expo-clipboard';

interface Props {
  visible: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export function AiNegotiatorModal({ visible, onClose, subscription }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  if (!subscription) return null;

  const script = generateAiNegotiationScript(subscription, isTurkish);

  const handleCopy = async () => {
    triggerHaptic('impactLight');
    await Clipboard.setStringAsync(script.copyableMessage);
    triggerHaptic('notificationSuccess');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconBox}>
                <Ionicons name="chatbubbles-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                  {isTurkish ? `YZ İndirim Pazarlık Asistanı` : `AI Retention Coach`}
                </Text>
                <Text numberOfLines={1} style={[styles.sub, { color: colors.textSecondary }]}>
                  {subscription.name} için pazarlık taktikleri
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {/* Opening Pitch */}
            <View style={[styles.sectionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: '#8B5CF6' }]}>💡 {isTurkish ? 'Giriş Stratejisi' : 'Opening Pitch'}</Text>
              <Text style={[styles.sectionText, { color: colors.text }]}>{script.openingPitch}</Text>
            </View>

            {/* Target Retention */}
            <View style={[styles.sectionBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
              <Text style={[styles.sectionTitle, { color: '#10B981' }]}>🎯 {isTurkish ? 'Hedef İndirim / Kazanım' : 'Target Retention'}</Text>
              <Text style={[styles.sectionText, { color: colors.text }]}>{script.retentionOfferTarget}</Text>
            </View>

            {/* Copyable Message */}
            <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.codeTitle, { color: colors.textSecondary }]}>{isTurkish ? 'Müşteri Hizmetleri İndirim Metni' : 'Copyable Support Message'}</Text>
              <Text style={[styles.codeBody, { color: colors.text }]}>{script.copyableMessage}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.copyBtnText}>{isTurkish ? 'Metni Kopyala & İndirim İste' : 'Copy Negotiation Text'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  sub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 17,
  },
  codeBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  codeTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  codeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

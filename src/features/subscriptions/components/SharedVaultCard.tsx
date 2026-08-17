import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';

interface Props {
  subscriptions: Subscription[];
}

export function SharedVaultCard({ subscriptions }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const router = useRouter();

  const sharedSubs = React.useMemo(() => {
    return subscriptions.filter(s => s.isSplit || (s.splitMembers && s.splitMembers.length > 0));
  }, [subscriptions]);

  if (sharedSubs.length === 0) {
    return null;
  }

  const handleSendWhatsAppReminder = (subName: string, memberName: string, memberPhone: string, shareAmount: number, currency: string) => {
    triggerHaptic('impactLight');
    const msg = isTurkish
      ? `Merhaba ${memberName}! 👋 ${subName} aboneliği için bu ayki ${shareAmount} ${currency} payını hatırlatmak istedim. Teşekkürler! 💳`
      : `Hi ${memberName}! 👋 Quick reminder for your ${shareAmount} ${currency} share for ${subName}. Thanks! 💳`;

    const cleanPhone = String(memberPhone || '').replace(/[^\d+]/g, '');
    const url = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          isTurkish ? 'WhatsApp Bulunamadı' : 'WhatsApp Not Found',
          isTurkish ? `Hatırlatma Mesajı:\n\n"${msg}"` : `Reminder Message:\n\n"${msg}"`
        );
      }
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="people-outline" size={20} color="#10B981" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {isTurkish ? '👥 Ortak Abonelik & Aile Kasası' : '👥 Family & Shared Vault'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isTurkish ? `${sharedSubs.length} ortak abonelik paylaştırılıyor` : `${sharedSubs.length} shared subscriptions tracked`}
            </Text>
          </View>
        </View>
      </View>

      {/* Shared Subscriptions List */}
      <View style={{ gap: 10, marginTop: 4 }}>
        {sharedSubs.map((sub) => {
          const members = sub.splitMembers || [];
          const totalMembers = members.length + 1; // user + partners
          const perPersonShare = (sub.amount / totalMembers).toFixed(2);

          return (
            <View key={sub.id} style={[styles.subBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.subHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subName, { color: colors.text }]}>{sub.name}</Text>
                  <Text style={[styles.subDetail, { color: colors.textSecondary }]}>
                    {sub.amount} {sub.currency} • {totalMembers} {isTurkish ? 'Kişi Paylaşımlı' : 'Members'} ({perPersonShare} {sub.currency}/kişi)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => router.push(`/(tabs)/subscriptions/${sub.id}`)}
                >
                  <Ionicons name="open-outline" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>

              {/* Members Breakdown */}
              {members.length > 0 && (
                <View style={styles.membersContainer}>
                  {members.map((m, idx) => (
                    <View key={m.id || idx} style={styles.memberRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons name="person-circle-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {m.name || (isTurkish ? 'Üye' : 'Member')}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.memberShare, { color: colors.textSecondary }]}>
                          {m.shareAmount || perPersonShare} {sub.currency}
                        </Text>
                        <TouchableOpacity
                          style={styles.waBtn}
                          onPress={() => handleSendWhatsAppReminder(
                            sub.name,
                            m.name || 'Arkadaşım',
                            m.phone || '',
                            Number(m.shareAmount || perPersonShare),
                            sub.currency
                          )}
                        >
                          <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                          <Text style={styles.waBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
    marginBottom: 16,
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
  subBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subName: {
    fontSize: 14,
    fontWeight: '800',
  },
  subDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  detailsBtn: {
    padding: 4,
  },
  membersContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    gap: 6,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberShare: {
    fontSize: 12,
    fontWeight: '700',
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  waBtnText: {
    color: '#25D366',
    fontSize: 10,
    fontWeight: '800',
  },
});

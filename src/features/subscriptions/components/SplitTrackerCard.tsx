import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Subscription, SplitMember } from '@/services/firebase/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { useUpdateSubscription } from '../hooks/useSubscriptions';

interface Props {
  subscription: Subscription;
}

export function SplitTrackerCard({ subscription }: Props) {
  const { colors } = useTheme();
  const updateMutation = useUpdateSubscription();

  if (!subscription.isSplit || !subscription.splitMembers || subscription.splitMembers.length === 0) {
    return null;
  }

  const members = subscription.splitMembers;
  const totalAmount = subscription.amount || 0;
  const currency = subscription.currency || 'TRY';

  const totalMembersShare = members.reduce((sum, m) => sum + (Number(m.shareAmount) || 0), 0);
  const userShare = Math.max(0, totalAmount - totalMembersShare);
  const paidMembersShare = members.filter(m => m.isPaid).reduce((sum, m) => sum + (Number(m.shareAmount) || 0), 0);
  const pendingMembersShare = totalMembersShare - paidMembersShare;

  const paidCount = members.filter(m => m.isPaid).length;

  const handleToggleMemberPaid = (memberIndex: number) => {
    triggerHaptic('medium');
    const updatedMembers = members.map((m, idx) => {
      if (idx === memberIndex) {
        return { ...m, isPaid: !m.isPaid };
      }
      return m;
    });

    updateMutation.mutate({
      id: subscription.id!,
      data: { splitMembers: updatedMembers }
    });
  };

  const handleWhatsAppReminder = (member: SplitMember) => {
    triggerHaptic('impactLight');
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Merhaba ${member.name || 'dostum'}, ${subscription.name} aboneliği için senin payına düşen ${member.shareAmount} ${currency} tutarı gönderebilir misin? Teşekkürler!`
    );

    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/?text=${text}`);
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="people" size={18} color="#10B981" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Split Bill Breakdown</Text>
        </View>

        <View style={[styles.paidStatusBadge, { backgroundColor: paidCount === members.length ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: paidCount === members.length ? '#10B981' : '#F59E0B' }}>
            {paidCount}/{members.length} Paid
          </Text>
        </View>
      </View>

      {/* Summary Math Grid */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Your Share</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{userShare.toFixed(2)} {currency}</Text>
        </View>

        <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Friends' Total</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{totalMembersShare.toFixed(2)} {currency}</Text>
        </View>

        <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          <Text style={[styles.summaryValue, { color: pendingMembersShare > 0 ? '#F59E0B' : colors.textSecondary }]}>
            {pendingMembersShare.toFixed(2)} {currency}
          </Text>
        </View>
      </View>

      {/* Members Payment List */}
      <Text style={[styles.membersTitle, { color: colors.textSecondary }]}>PARTNERS PAYMENT STATUS</Text>
      
      <View style={{ gap: 10 }}>
        {members.map((member, idx) => (
          <View key={member.id || `member-${idx}`} style={[styles.memberCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.memberLeft} 
              onPress={() => handleToggleMemberPaid(idx)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={member.isPaid ? "checkmark-circle" : "ellipse-outline"} 
                size={22} 
                color={member.isPaid ? "#10B981" : colors.textSecondary} 
              />
              <View>
                <Text style={[styles.memberName, { color: colors.text, textDecorationLine: member.isPaid ? 'line-through' : 'none' }]}>
                  {member.name || `Partner ${idx + 1}`}
                </Text>
                <Text style={[styles.memberShareText, { color: colors.textSecondary }]}>
                  Share: {member.shareAmount} {currency}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.waButton, { backgroundColor: 'rgba(37, 211, 102, 0.12)' }]}
              onPress={() => handleWhatsAppReminder(member)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" style={{ marginRight: 4 }} />
              <Text style={styles.waButtonText}>Remind</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  paidStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  membersTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  memberShareText: {
    fontSize: 12,
    marginTop: 1,
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  waButtonText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '800',
  },
});

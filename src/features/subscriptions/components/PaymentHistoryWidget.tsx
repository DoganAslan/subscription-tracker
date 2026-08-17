// src/features/subscriptions/components/PaymentHistoryWidget.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { getPaymentHistory, addPaymentLog, PaymentLogEntry } from '@/utils/paymentHistory';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  subId: string;
  subName: string;
  defaultAmount: number;
  currency: string;
}

export function PaymentHistoryWidget({ subId, subName, defaultAmount, currency }: Props) {
  const { colors, isDark } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [logs, setLogs] = useState<PaymentLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    getPaymentHistory(subId).then(data => {
      setLogs(data);
      setIsLoading(false);
    });
  }, [subId]);

  const handleAddPayment = async () => {
    triggerHaptic('impactMedium');
    setIsAdding(true);
    const updated = await addPaymentLog(subId, defaultAmount, currency, 'paid');
    setLogs(updated);
    setIsAdding(false);
  };

  const cumulativeSpent = logs.reduce((sum, item) => sum + (item.status === 'paid' ? item.amount : 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)', flexShrink: 0 }]}>
            <Ionicons name="receipt-outline" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {isTurkish ? 'Ödeme Geçmişi Günlüğü' : 'Payment Audit History'}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
              {logs.length > 0
                ? `${isTurkish ? 'Kayıtlı Toplam' : 'Total Spent'}: ${cumulativeSpent.toFixed(2)} ${currency}`
                : (isTurkish ? 'Henüz kaydedilmiş ödeme yok' : 'No payments logged yet')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAddPayment}
          disabled={isAdding}
          activeOpacity={0.8}
          style={[styles.addBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', flexShrink: 0 }]}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              <Ionicons name="add" size={16} color="#10B981" style={{ flexShrink: 0 }} />
              <Text style={styles.addBtnText}>
                {isTurkish ? 'Ödeme Ekle' : '+ Log Payment'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Log Entries List */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : logs.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isTurkish
              ? 'Otomatik yenilenme gerçekleştiğinde veya "+ Ödeme Ekle" butonuna bastığınızda ödeme geçmişiniz buraya işlenir.'
              : 'Payments will appear here when renewals trigger or when you tap "+ Log Payment".'}
          </Text>
        </View>
      ) : (
        <View style={styles.logList}>
          {logs.slice(0, 5).map((item) => {
            const dateStr = new Date(item.dateISO).toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <View key={item.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
                <View style={styles.logRowLeft}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ flexShrink: 0 }} />
                  <View>
                    <Text style={[styles.logDate, { color: colors.text }]}>{dateStr}</Text>
                    <Text style={[styles.logStatus, { color: colors.textSecondary }]}>
                      {isTurkish ? 'Ödeme Yapıldı' : 'Payment Confirmed'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logAmount}>
                  +{item.amount.toFixed(2)} {item.currency}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyBox: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  logList: {
    marginTop: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  logStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  logAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
});

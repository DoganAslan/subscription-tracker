import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/locales/i18n';

export const DoomBanner: React.FC<{ subName: string; daysLeft: number; severity: 'warning' | 'critical'; onPress: () => void }> = ({
  subName, daysLeft, severity, onPress
}) => {
  const isCrit = severity === 'critical';
  const bg = isCrit ? '#7F1D1D' : '#78350F'; // Crimson vs Amber Dark
  const border = isCrit ? '#EF4444' : '#F59E0B';

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.iconBox}>
        <Ionicons name={isCrit ? "alert-circle" : "warning"} size={24} color={border} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.header}>
          {isCrit ? '🚨 CRITICAL TAAHHÜT ALARMI' : '⚠️ YAKLAŞAN SÖZLEŞME BİTİŞİ'}
        </Text>
        <Text style={styles.body}>
          <Text style={{ fontWeight: '800', color: '#FFF' }}>{subName}</Text> taahhüdünüzün bitmesine <Text style={{ fontWeight: '900', color: border }}>{daysLeft} gün</Text> kaldı.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 2 },
  body: { fontSize: 13, color: 'rgba(255,255,255,0.9)' }
});




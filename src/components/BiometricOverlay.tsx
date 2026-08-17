import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/context/LanguageContext';

export const BiometricOverlay: React.FC<{ onUnlockRetry: () => void }> = ({ onUnlockRetry }) => {
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
      <View style={styles.vault}>
        <Ionicons name="lock-closed" size={64} color="#3B82F6" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>{isTurkish ? 'SubMate kilitli' : 'SubMate locked'}</Text>
        <Text style={styles.subtitle}>{isTurkish ? 'Finansal verilerin biyometrik korumayla güvence altında.' : 'Your financial data is protected with biometric security.'}</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={onUnlockRetry} style={styles.btn}>
          <Ionicons name="finger-print" size={20} color="#FFF" />
          <Text style={styles.btnText}>{isTurkish ? 'Kilidi aç' : 'Unlock'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  vault: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 32 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});


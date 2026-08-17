import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CardProps {
  id: string;
  cardName: string;
  last4: string;
  color: string;
  totalCommitment: number;
  currencySymbol: string;
}

export const CardWidget: React.FC<{ card: CardProps; onPress?: () => void }> = ({ card, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { backgroundColor: card.color || '#1E293B' }]}>
      <View style={styles.header}>
        <Text style={styles.brand}>{card.cardName}</Text>
        <Ionicons name="card-outline" size={22} color="rgba(255,255,255,0.7)" />
      </View>

      <View style={styles.chipRow}>
        <View style={styles.chip} />
        <Text style={styles.number}>•••• •••• •••• {card.last4}</Text>
      </View>

      <View style={styles.footer}>
        <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '90deg' }] }} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  chipRow: { marginVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chip: { width: 36, height: 26, borderRadius: 6, backgroundColor: '#F59E0B', opacity: 0.8 },
  number: { color: '#FFF', fontSize: 16, fontWeight: '600', letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  amount: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});




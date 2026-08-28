import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type MonthlySpendHeroProps = {
  colors: [string, string, string];
  isTurkish: boolean;
  showBalance: boolean;
  currencySymbol: string;
  formattedWhole: string;
  formattedDecimals: string;
  onToggleBalance: () => void;
  onOpenThemePicker: () => void;
};

export function MonthlySpendHero({
  colors,
  isTurkish,
  showBalance,
  currencySymbol,
  formattedWhole,
  formattedDecimals,
  onToggleBalance,
  onOpenThemePicker,
}: MonthlySpendHeroProps) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{isTurkish ? 'Toplam aylık harcama' : 'Total monthly spend'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isTurkish ? 'Bakiyeyi göster veya gizle' : 'Show or hide balance'} onPress={onToggleBalance} activeOpacity={0.7}>
            <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={20} color="#E0E7FF" />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isTurkish ? 'Kart temasını değiştir' : 'Change card theme'} onPress={onOpenThemePicker} activeOpacity={0.7}>
            <Ionicons name="color-palette-outline" size={20} color="#E0E7FF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.amountRow}>
        {showBalance ? (
          <View style={styles.amountLine}>
            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
            <Text style={styles.amountWhole}>{formattedWhole}</Text>
            <Text style={styles.amountDecimals}>{formattedDecimals}</Text>
          </View>
        ) : (
          <Text style={styles.amountHidden}>••••••••</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#E0E7FF', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountRow: { marginTop: 12, marginBottom: 8 },
  amountLine: { flexDirection: 'row', alignItems: 'baseline' },
  currencySymbol: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', marginRight: 4 },
  amountWhole: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  amountDecimals: { color: '#C7D2FE', fontSize: 20, fontWeight: '700' },
  amountHidden: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold', letterSpacing: 2 },
});

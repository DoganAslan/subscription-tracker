import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Subscription } from '@/services/firebase/types';
import type { ThemeColors } from '@/theme/colors';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';

type SubscriptionSearchProps = {
  colors: ThemeColors;
  isTurkish: boolean;
  query: string;
  results: Subscription[];
  onChange: (query: string) => void;
  onClear: () => void;
};

export function SubscriptionSearch({ colors, isTurkish, query, results, onChange, onClear }: SubscriptionSearchProps) {
  return (
    <>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={isTurkish ? 'Abonelik veya işlem ara...' : 'Search subscriptions, transactions...'}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={onChange}
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={isTurkish ? 'Aramayı temizle' : 'Clear search'} onPress={onClear}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {query.trim().length > 0 ? (
        <View style={[styles.resultsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {isTurkish ? `Arama Sonuçları (${results.length})` : `Search Results (${results.length})`}
            </Text>
            <TouchableOpacity onPress={onClear}>
              <Text style={[styles.clearText, { color: colors.primary }]}>{isTurkish ? 'Temizle' : 'Clear'}</Text>
            </TouchableOpacity>
          </View>

          {results.length > 0 ? (
            <View style={styles.resultsList}>
              {results.map((subscription, index) => (
                <SubscriptionCard key={subscription.id || `search-${index}`} subscription={subscription} compact />
              ))}
            </View>
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={32} color={colors.textSecondary} />
              <Text style={[styles.noResultsTitle, { color: colors.text }]}>
                {isTurkish ? 'Eşleşen abonelik yok' : 'No matching subscriptions'}
              </Text>
              <Text style={[styles.noResultsSubtitle, { color: colors.textSecondary }]}>
                {isTurkish ? `“${query}” ile eşleşen bir kayıt bulamadık.` : `We couldn't find anything matching “${query}”.`}
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  resultsCard: { borderRadius: 20, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4, marginBottom: 16 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  resultsTitle: { fontSize: 15, fontWeight: '800' },
  clearText: { fontSize: 13, fontWeight: '700' },
  resultsList: { gap: 10, marginTop: 10 },
  noResults: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  noResultsTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  noResultsSubtitle: { fontSize: 13, marginTop: 2 },
});

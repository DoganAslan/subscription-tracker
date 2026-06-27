import i18n from '@/locales/i18n';
import React from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBSCRIPTION_CATEGORIES } from '@/features/subscriptions/schemas/subscription.schema';

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (val: string | null) => void;
  selectedCurrency: string | null;
  setSelectedCurrency: (val: string | null) => void;
}

const AVAILABLE_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'JPY'];

export function DashboardFilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCurrency,
  setSelectedCurrency
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={i18n.t('global.searchSubscriptions')}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.activeChip]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.activeChipText]}>{i18n.t('global.allCategories')}</Text>
        </TouchableOpacity>
        {SUBSCRIPTION_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.chip, selectedCategory === category && styles.activeChip]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.chipText, selectedCategory === category && styles.activeChipText]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, selectedCurrency === null && styles.activeChip]}
          onPress={() => setSelectedCurrency(null)}
        >
          <Text style={[styles.chipText, selectedCurrency === null && styles.activeChipText]}>{i18n.t('global.allCurrencies')}</Text>
        </TouchableOpacity>
        {AVAILABLE_CURRENCIES.map(currency => (
          <TouchableOpacity
            key={currency}
            style={[styles.chip, selectedCurrency === currency && styles.activeChip]}
            onPress={() => setSelectedCurrency(currency)}
          >
            <Text style={[styles.chipText, selectedCurrency === currency && styles.activeChipText]}>{currency}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#334155'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  activeChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5'
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500'
  },
  activeChipText: {
    color: '#FFFFFF'
  }
});

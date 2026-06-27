import i18n from '@/locales/i18n';
import React, { useState, useMemo } from 'react';
import { 
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, 
  TextInput, KeyboardAvoidingView, Platform, Modal, FlatList, useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionTemplates, SubscriptionTemplate } from '@/features/onboarding/data/templates';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAddSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useTheme } from '@/context/ThemeContext';

const CURRENCIES = [
  { code: 'TRY', label: 'TRY - Turkey' },
  { code: 'USD', label: 'USD - United States' },
  { code: 'EUR', label: 'EUR - Eurozone' },
  { code: 'GBP', label: 'GBP - United Kingdom' },
  { code: 'JPY', label: 'JPY - Japan' },
  { code: 'CAD', label: 'CAD - Canada' },
  { code: 'AUD', label: 'AUD - Australia' },
  { code: 'CHF', label: 'CHF - Switzerland' },
  { code: 'CNY', label: 'CNY - China' },
  { code: 'SEK', label: 'SEK - Sweden' },
  { code: 'NZD', label: 'NZD - New Zealand' },
  { code: 'MXN', label: 'MXN - Mexico' },
  { code: 'SGD', label: 'SGD - Singapore' },
  { code: 'HKD', label: 'HKD - Hong Kong' },
  { code: 'NOK', label: 'NOK - Norway' },
  { code: 'KRW', label: 'KRW - South Korea' },
  { code: 'DKK', label: 'DKK - Denmark' },
  { code: 'INR', label: 'INR - India' },
  { code: 'RUB', label: 'RUB - Russia' },
  { code: 'ZAR', label: 'ZAR - South Africa' }
];

export default function TemplatesScreen() {
  const [step, setStep] = useState<'selection' | 'pricing'>('selection');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pricingConfig, setPricingConfig] = useState<Record<string, { amount: string, currency: string }>>({});
  const [isImporting, setIsImporting] = useState(false);
  
  // Modal states
  const [activeCurrencyTemplateId, setActiveCurrencyTemplateId] = useState<string | null>(null);
  const [currencySearch, setCurrencySearch] = useState('');
  
  const router = useRouter();
  const { completeOnboarding } = useOnboardingStore();
  const { mutateAsync: addSubscription } = useAddSubscription();

  const { colors } = useTheme();

  // --- dynamic colors based on user request ---
  const bgMain = colors.background; // screen bg
  const bgCard = colors.surface; // card bg
  const bgHeader = colors.background;
  const textPrimary = colors.text;
  const textLabel = colors.textSecondary;
  const textSecondary = colors.textSecondary;
  const borderColor = colors.border;
  const inputBg = colors.surface;
  const primaryBrand = colors.primary;

  const getSelectedTemplates = (): SubscriptionTemplate[] => {
    const selected: SubscriptionTemplate[] = [];
    Object.values(subscriptionTemplates).forEach(categoryList => {
      categoryList.forEach(template => {
        if (selectedIds.has(template.id)) {
          selected.push(template);
        }
      });
    });
    return selected;
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      const newPricing = { ...pricingConfig };
      delete newPricing[id];
      setPricingConfig(newPricing);
    } else {
      next.add(id);
      setPricingConfig(prev => ({ ...prev, [id]: { amount: '', currency: 'TRY' } }));
    }
    setSelectedIds(next);
  };

  const updatePricing = (id: string, field: 'amount' | 'currency', value: string) => {
    setPricingConfig(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleNext = async () => {
    if (selectedIds.size === 0) {
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)');
      } catch (error) {
        console.error("Error saving onboarding state:", error);
      }
      return;
    }
    setStep('pricing');
  };

  const handleFinish = async () => {
    setIsImporting(true);
    const selectedTemplates = getSelectedTemplates();

    try {
      for (const tmpl of selectedTemplates) {
        const config = pricingConfig[tmpl.id];
        const amountNum = parseFloat(config?.amount || '0');
        
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        
        await addSubscription({
          name: tmpl.name,
          category: tmpl.category,
          amount: isNaN(amountNum) ? 0 : amountNum,
          currency: config?.currency || 'TRY',
          billingCycle: tmpl.billingCycle,
          renewalDate: renewalDate,
          status: 'active',
          reminderOffset: '1_day',
          isFreeTrial: false,
          notes: 'Imported from template'
        });
      }
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)');
      } catch (error) {
        console.error("Error saving onboarding state:", error);
      }
    } catch (error) {
      console.error('Failed to import templates', error);
      setIsImporting(false);
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)');
      } catch (storageError) {
        console.error("Error saving onboarding state:", storageError);
      }
    }
  };

  const filteredCurrencies = useMemo(() => {
    return CURRENCIES.filter(c => c.label.toLowerCase().includes(currencySearch.toLowerCase()));
  }, [currencySearch]);

  const openCurrencyModal = (id: string) => {
    setActiveCurrencyTemplateId(id);
    setCurrencySearch('');
  };

  const selectCurrency = (currency: string) => {
    if (activeCurrencyTemplateId) {
      updatePricing(activeCurrencyTemplateId, 'currency', currency);
    }
    setActiveCurrencyTemplateId(null);
  };

  const renderCurrencyModal = () => (
    <Modal
      visible={activeCurrencyTemplateId !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setActiveCurrencyTemplateId(null)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View style={{ backgroundColor: bgHeader, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textPrimary }}>{i18n.t('global.selectCurrency')}</Text>
            <TouchableOpacity onPress={() => setActiveCurrencyTemplateId(null)}>
              <Text style={{ color: primaryBrand, fontSize: 16, fontWeight: '600' }}>{i18n.t('global.close')}</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: textPrimary,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: borderColor
            }}
            placeholder={i18n.t('global.searchCurrency')}
            placeholderTextColor={textSecondary}
            value={currencySearch}
            onChangeText={setCurrencySearch}
            autoCorrect={false}
          />

          <FlatList
            data={filteredCurrencies}
            keyExtractor={item => item.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectCurrency(item.code)}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 16, color: textPrimary, fontWeight: '500' }}>{item.label}</Text>
                {activeCurrencyTemplateId && pricingConfig[activeCurrencyTemplateId]?.currency === item.code && (
                  <Text style={{ color: primaryBrand, fontSize: 16, fontWeight: 'bold' }}>{i18n.t('global.symbol66')}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: textSecondary, marginTop: 24 }}>{i18n.t('global.noCurrenciesFound')}</Text>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (step === 'pricing') {
    const selectedTemplates = getSelectedTemplates();
    const canSave = selectedTemplates.every(tmpl => pricingConfig[tmpl.id]?.amount.trim().length > 0);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgMain }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header Area */}
          <View style={{ padding: 24, borderBottomWidth: 1, borderColor: borderColor, backgroundColor: bgHeader }}>
            <TouchableOpacity onPress={() => setStep('selection')} style={{ marginBottom: 16 }}>
              <Text style={{ color: primaryBrand, fontSize: 16, fontWeight: '500' }}>{i18n.t('global.BackToSelection')}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: '700', color: textPrimary, marginBottom: 8, lineHeight: 32 }}>{i18n.t('global.configurePrices')}</Text>
            <Text style={{ fontSize: 16, color: textSecondary, lineHeight: 24 }}>{i18n.t('global.enterTheExactAmountA')}</Text>
          </View>

          {/* Configuration List */}
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            {selectedTemplates.map(tmpl => (
              <View key={tmpl.id} style={{ 
                marginBottom: 12, 
                backgroundColor: bgCard, 
                padding: 16, 
                borderRadius: 12, 
                borderWidth: 1, 
                borderColor: borderColor 
              }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: textPrimary, marginBottom: 16, lineHeight: 22 }}>
                  {tmpl.name}
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 14, color: textLabel, marginBottom: 8, fontWeight: '600' }}>{i18n.t('global.amount')}</Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: borderColor,
                        borderRadius: 8,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        fontSize: 16,
                        backgroundColor: inputBg,
                        color: textPrimary
                      }}
                      placeholder={i18n.t('global.000')}
                      placeholderTextColor={textSecondary}
                      keyboardType="decimal-pad"
                      value={pricingConfig[tmpl.id]?.amount || ''}
                      onChangeText={(val) => updatePricing(tmpl.id, 'amount', val)}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: textLabel, marginBottom: 8, fontWeight: '600' }}>{i18n.t('global.currency')}</Text>
                    <TouchableOpacity
                      onPress={() => openCurrencyModal(tmpl.id)}
                      style={{
                        borderWidth: 1,
                        borderColor: borderColor,
                        borderRadius: 8,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        backgroundColor: inputBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}
                    >
                      <Text style={{ fontSize: 16, color: textPrimary, fontWeight: '600', marginRight: 4 }}>
                        {pricingConfig[tmpl.id]?.currency || 'TRY'}
                      </Text>
                      <Text style={{ fontSize: 12, color: textSecondary }}>{i18n.t('global.symbol533')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Fixed Bottom Button Area */}
          <View style={{ padding: 20, backgroundColor: bgHeader, borderTopWidth: 1, borderColor: borderColor }}>
            <TouchableOpacity 
              onPress={handleFinish}
              disabled={isImporting || !canSave}
              style={{
                backgroundColor: canSave ? primaryBrand : '#1F2937',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row'
              }}
            >
              {isImporting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={{ color: colors.background, fontSize: 18, fontWeight: 'bold' }}>{i18n.t('global.saveAndContinue')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        
        {renderCurrencyModal()}
      </SafeAreaView>
    );
  }

  // --- SELECTION STEP ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgMain }}>
      {/* Header Area */}
      <View style={{ padding: 24, borderBottomWidth: 1, borderColor: borderColor, backgroundColor: bgHeader }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: textPrimary, marginBottom: 8, lineHeight: 32 }}>{i18n.t('global.selectServices')}</Text>
        <Text style={{ fontSize: 16, color: textSecondary, lineHeight: 24 }}>{i18n.t('global.selectTheSubscriptio')}</Text>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(subscriptionTemplates).map(([category, items]) => (
          <View key={category} style={{ marginBottom: 28 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textPrimary, marginBottom: 16, lineHeight: 28 }}>
              {category}
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {items.map(item => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleSelection(item.id)}
                    activeOpacity={0.7}
                    style={{
                      width: '48%',
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? primaryBrand : borderColor,
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : bgCard,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isSelected ? primaryBrand : textPrimary, lineHeight: 22 }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Fixed Bottom Button Area */}
      <View style={{ padding: 20, backgroundColor: bgHeader, borderTopWidth: 1, borderColor: borderColor }}>
        <TouchableOpacity 
          onPress={handleNext}
          disabled={isImporting}
          style={{
            backgroundColor: primaryBrand,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row'
          }}
        >
          <Text style={{ color: colors.background, fontSize: 18, fontWeight: 'bold' }}>
            {selectedIds.size > 0 
              ? `Configure ${selectedIds.size} Subscription${selectedIds.size > 1 ? 's' : ''}` 
              : "Skip for now"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

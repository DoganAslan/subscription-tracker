import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Switch, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyzeReceiptImage } from '@/services/ai/gemini';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { triggerHaptic } from '@/utils/haptics';
import { Input } from '@/components/ui/Input';
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardAccessory';
import { Button } from '@/components/ui/Button';
import { subscriptionSchema, SubscriptionFormData } from '../schemas/subscription.schema';
import { Subscription } from '@/services/firebase/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useCards } from '@/features/cards/hooks/useCards';
import { sanitizePriceInput, sanitizeTextInput } from '@/utils/sanitizers';
import { dispatchWhatsAppReminder } from '@/utils/whatsapp';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useBudgetStore } from '@/store/useBudgetStore';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { useCurrencyStore } from '@/store/useCurrencyStore';
export const CATEGORIES = [
  { name: 'Entertainment', hint: 'Netflix, Disney+, Cable' },
  { name: 'Music & Audio', hint: 'Spotify, Apple Music, Audible' },
  { name: 'Productivity', hint: 'Notion, Claude, Github, Adobe' },
  { name: 'Utilities & Cloud', hint: 'Google One, iCloud, VPN, Web Hosting' },
  { name: 'Health & Fitness', hint: 'Gym memberships, Strava, Meditation apps' },
  { name: 'Finance & Insurance', hint: 'Budgeting tools, Trading platforms, Insurance' },
  { name: 'Education & Learning', hint: 'Duolingo, Coursera, Udemy' },
  { name: 'Gaming', hint: 'Xbox Game Pass, PlayStation Plus, Steam' },
  { name: 'Shopping & E-commerce', hint: 'Amazon Prime, Local delivery passes' },
  { name: 'News & Media', hint: 'New York Times, Medium, Magazine subs' },
  { name: 'Food & Delivery', hint: 'Meal kits, Coffee clubs' },
  { name: 'Other', hint: '' },
];

const formatLocalizedDate = (date: Date, localeCode: string): string => {
  try {
    return new Intl.DateTimeFormat(localeCode, { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  } catch (e) {
    return date.toISOString().split('T')[0];
  }
};


export const POPULAR_BRANDS = [
  { name: 'Netflix', category: 'Entertainment' },
  { name: 'Amazon Prime', category: 'Shopping & E-commerce' },
  { name: 'Spotify', category: 'Music & Audio' },
  { name: 'YouTube Premium', category: 'Entertainment' },
  { name: 'ChatGPT', category: 'Productivity' },
  { name: 'Claude', category: 'Productivity' },
  { name: 'Gemini Advanced', category: 'Productivity' },
  { name: 'Apple Music', category: 'Music & Audio' },
  { name: 'Disney+', category: 'Entertainment' },
  { name: 'iCloud', category: 'Utilities & Cloud' },
  { name: 'Google One', category: 'Utilities & Cloud' },
  { name: 'Xbox Game Pass', category: 'Gaming' },
  { name: 'PS Plus', category: 'Gaming' },
  { name: 'Adobe CC', category: 'Productivity' },
  { name: 'Canva', category: 'Productivity' },
  { name: 'GitHub Copilot', category: 'Productivity' },
  { name: 'Notion', category: 'Productivity' },
  { name: 'Exxen', category: 'Entertainment' },
  { name: 'BluTV', category: 'Entertainment' },
  { name: 'Gain', category: 'Entertainment' },
  { name: 'Mubi', category: 'Entertainment' },
];

export const BILLING_CYCLES = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: '3 Months', value: 'quarterly' },
  { label: '6 Months', value: 'biannually' },
  { label: 'Yearly', value: 'yearly' },
  { label: '2 Years', value: 'biennially' },
] as const;

// Removed DESIGN_TOKENS

interface Props {
  initialData?: Subscription;
  onSubmit: (data: SubscriptionFormData) => void;
  isLoading: boolean;
  submitLabel: string;
  onDelete?: () => void;
  hideHero?: boolean;
  externalAmount?: number;
  children?: React.ReactNode;
}

export function SubscriptionForm({ initialData, onSubmit, isLoading, submitLabel, onDelete, hideHero, externalAmount, children }: Props) {
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [showRenewalPicker, setShowRenewalPicker] = useState(false);
  const [showTrialPicker, setShowTrialPicker] = useState(false);
  const [showContractPicker, setShowContractPicker] = useState(false);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  
  const { data: cards = [] } = useCards();
  
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const activeLang = currentLanguage || 'en';
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const { data: existingSubscriptions } = useSubscriptions();
  const { monthlyBudget } = useBudgetStore();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  const isEdit = !!initialData;

  const webRenewalDateInputRef = React.useRef<any>(null);
  const triggerWebRenewalCalendar = () => {
    if (Platform.OS === 'web' && webRenewalDateInputRef.current) {
      try {
        webRenewalDateInputRef.current.showPicker();
      } catch (e) {
        webRenewalDateInputRef.current.click();
      }
    }
  };

  const webTrialDateInputRef = React.useRef<any>(null);
  const triggerWebTrialCalendar = () => {
    if (Platform.OS === 'web' && webTrialDateInputRef.current) {
      try {
        webTrialDateInputRef.current.showPicker();
      } catch (e) {
        webTrialDateInputRef.current.click();
      }
    }
  };

  const webContractDateInputRef = React.useRef<any>(null);
  const triggerWebContractCalendar = () => {
    if (Platform.OS === 'web' && webContractDateInputRef.current) {
      try {
        webContractDateInputRef.current.showPicker();
      } catch (e) {
        webContractDateInputRef.current.click();
      }
    }
  };

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      amount: initialData?.amount || 0,
      currency: initialData?.currency || 'USD',
      billingCycle: initialData?.billingCycle || 'monthly',
      renewalDate: initialData?.renewalDate?.toDate() || new Date(),
      reminderOffset: initialData?.reminderOffset || '1_day',
      isTrial: initialData?.isTrial || false,
      trialEndDate: initialData?.trialEndDate?.toDate() || new Date(),
      hasContract: initialData?.hasContract || false,
      contractEndDate: initialData?.contractEndDate 
        ? (typeof initialData.contractEndDate.toDate === 'function' ? initialData.contractEndDate.toDate() : new Date(initialData.contractEndDate))
        : new Date(Date.now() + 365 * 86400000),
      notes: initialData?.notes || '',
      status: initialData?.status || 'active',
      cardId: initialData?.cardId || null,
      isSplit: initialData?.isSplit || false,
      splitMembers: initialData?.splitMembers || [],
    }
  });

  // Sync external amount to form
  React.useEffect(() => {
    if (externalAmount !== undefined) {
      control._formValues.amount = externalAmount;
    }
  }, [externalAmount]);

  const isPaused = watch('status') === 'paused';
  const isTrial = watch('isTrial');
  const hasContract = watch('hasContract');
  const isSplit = watch('isSplit');

  const { fields: splitFields, append: appendSplit, remove: removeSplit } = useFieldArray({
    control,
    name: 'splitMembers'
  });

  const [isAiScanning, setIsAiScanning] = useState(false);

  const handleAiScan = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Refused", "You need to grant camera roll permissions to scan receipts.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.5,
      });

      if (result.canceled || !result.assets || !result.assets[0].base64) {
        return;
      }

      setIsAiScanning(true);
      triggerHaptic('medium');
      
      const base64Img = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      
      const parsedData = await analyzeReceiptImage(base64Img, mimeType);
      
      if (parsedData) {
        triggerHaptic('success');
        if (parsedData.name) setValue('name', parsedData.name);
        if (parsedData.amount) setValue('amount', parsedData.amount);
        if (parsedData.currency) setValue('currency', parsedData.currency);
        if (parsedData.billingCycle) setValue('billingCycle', parsedData.billingCycle);
      } else {
        triggerHaptic('error');
        Alert.alert("Analysis Failed", "Could not extract subscription details from this image.");
      }
      
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An unexpected error occurred during analysis.");
    } finally {
      setIsAiScanning(false);
    }
  };

  return (
    <>
      <ScrollView 
        contentContainerStyle={dynamicStyles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {children}
        
        {!isEdit && (
          <TouchableOpacity 
            onPress={handleAiScan}
            disabled={isAiScanning}
            style={dynamicStyles.aiScanButton}
          >
            {isAiScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
                  <Text style={dynamicStyles.aiScanText}>{t.features?.aiScannerAutoFill || 'Auto-Fill with AI Scanner'}</Text>
                  <Ionicons name="sparkles" size={16} color="#FBBF24" />
                </View>
            )}
          </TouchableOpacity>
        )}

        {/* HERO AMOUNT ELEMENT (REDESIGNED) */}
        {!hideHero && (
          <View style={dynamicStyles.heroContainerRedesigned}>
            {isTrial && (
              <Text style={dynamicStyles.postTrialLabel}>{t.global.posttrialPrice}</Text>
            )}
            <View style={dynamicStyles.heroInputWrapper}>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={dynamicStyles.heroInputRedesigned}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(sanitizePriceInput(text))}
                    value={value ? value.toString() : ''}
                    placeholder={t.global['000']}
                    placeholderTextColor={colors.textSecondary}
                    numberOfLines={1}
                    returnKeyType="done"
                    inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  />
                )}
              />
              <Controller
                control={control}
                name="currency"
                render={({ field: { value } }) => (
                  <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={() => setIsCurrencyModalVisible(true)}
                    style={dynamicStyles.currencySelector}
                  >
                    <Text style={dynamicStyles.currencyText}>{value || 'USD'}</Text>
                    <Text style={dynamicStyles.currencyChevron}>▼</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            {!!errors.amount?.message && (
               <Text style={dynamicStyles.heroError}>{errors.amount.message}</Text>
            )}
          </View>
        )}

        <Controller
          control={control}
          name="cardId"
          render={({ field: { value, onChange } }) => {
            const selectedCard = cards.find(c => c.id === value);
            return (
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={() => setIsCardModalVisible(true)}
                style={{ marginBottom: 16 }}
              >
                <View pointerEvents="none">
                  <Input 
                    label="Payment Method / Link Card" 
                    placeholder={t.global.selectACard} 
                    value={selectedCard ? `💳 ${selectedCard.type.toUpperCase()} - ${selectedCard.name} (•••• ${selectedCard.lastFourDigits || '****'})` : 'None / No Card'} 
                    error={errors.cardId?.message} 
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Input 
                label={t.subs.name} 
                placeholder={t.global.egNetflix} 
                onBlur={onBlur} 
                onChangeText={(text) => onChange(sanitizeTextInput(text, 30))} 
                value={value} 
                error={errors.name?.message} 
              />
              
              {/* PREDEFINED SERVICES ROW */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={dynamicStyles.brandsScroll}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <View style={dynamicStyles.brandsContainer}>
                  {POPULAR_BRANDS.map((brand) => {
                    const isSelected = value?.toLowerCase() === brand.name.toLowerCase();
                    return (
                    <TouchableOpacity
                      key={brand.name}
                      style={[
                        dynamicStyles.brandTextChip,
                        isSelected && { backgroundColor: '#1E3A8A', borderColor: '#3B82F6', borderWidth: 1.5 }
                      ]}
                      onPress={() => {
                        onChange(brand.name);
                        if (!watch('category')) {
                          control._formValues.category = brand.category;
                        }
                      }}
                    >
                      <Text style={[dynamicStyles.brandTextChipText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>{brand.name}</Text>
                    </TouchableOpacity>
                  )})}
                </View>
              </ScrollView>
            </View>
          )}
        />
        
        <Controller
          control={control}
          name="category"
          render={({ field: { value } }) => (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setIsCategoryModalVisible(true)}
            >
              <View pointerEvents="none">
                <Input 
                  label={t.subs.category} 
                  placeholder={t.global.selectACategory} 
                  value={(t.categories as any)?.[value] || value} 
                  error={errors.category?.message} 
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          )}
        />
        
        <View style={dynamicStyles.reminderSection}>
          <Text style={dynamicStyles.reminderLabel}>{t.subs.billingCycle.toUpperCase()}</Text>
          <Controller
            control={control}
            name="billingCycle"
            render={({ field: { onChange, value } }) => (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              >
                {BILLING_CYCLES.map((cycle) => {
                  const isSel = value === cycle.value;
                  return (
                    <TouchableOpacity
                      key={cycle.value}
                      onPress={() => onChange(cycle.value)}
                      style={[dynamicStyles.cycleChip, isSel && dynamicStyles.cycleChipSelected]}
                    >
                      <Text style={[dynamicStyles.cycleChipText, isSel && dynamicStyles.cycleChipTextSelected]}>
                        {cycle.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          />
        </View>
          
          {!isTrial && (
            <Controller
              control={control}
              name="renewalDate"
              render={({ field: { onChange, value } }) => (
                  <View style={{ width: '100%', marginBottom: 16 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>{t.global.renewalDate}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (Platform.OS === 'web') triggerWebRenewalCalendar();
                      else setShowRenewalPicker(true);
                    }}
                    style={{
                      width: '100%',
                      padding: 16,
                      backgroundColor: '#1E293B',
                      borderWidth: 1,
                      borderColor: '#334155',
                      borderRadius: 8,
                      justifyContent: 'center'
                    }}
                  >
                    <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '500' }}>
                      {formatLocalizedDate(value || new Date(), activeLang)}
                    </Text>
                  </TouchableOpacity>

                  {Platform.OS === 'web' && (
                    React.createElement('input', {
                      ref: webRenewalDateInputRef,
                      type: 'date',
                      value: value instanceof Date && !isNaN(value.getTime()) 
                        ? value.toISOString().split('T')[0] 
                        : new Date().toISOString().split('T')[0],
                      onChange: (e: any) => {
                        if (e.target.value) onChange(new Date(e.target.value));
                      },
                      style: {
                        position: 'absolute',
                        width: 0,
                        height: 0,
                        opacity: 0,
                        pointerEvents: 'none',
                        border: 'none'
                      }
                    })
                  )}

                {Platform.OS === 'ios' && showRenewalPicker && (
                  <Modal transparent={true} animationType="slide" onRequestClose={() => setShowRenewalPicker(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <View style={{ backgroundColor: colors.surface, padding: 16, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => setShowRenewalPicker(false)}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t.global.done}</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={value || new Date()}
                          mode="date"
                          display="spinner"
                          textColor={colors.text}
                          onChange={(event, selectedDate) => {
                            if (selectedDate) onChange(selectedDate);
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {Platform.OS === 'android' && showRenewalPicker && (
                  <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowRenewalPicker(false);
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
              </View>
            )}
          />
        )}
        <View style={dynamicStyles.reminderSection}>
          <Text style={dynamicStyles.reminderLabel}>{t.global.reminderOffset}</Text>
          <Controller
            control={control}
            name="reminderOffset"
            render={({ field: { onChange, value } }) => (
              <View style={dynamicStyles.chipRow}>
                {[
                  { label: 'None', value: 'none' },
                  { label: '1 Day', value: '1_day' },
                  { label: '3 Days', value: '3_days' },
                  { label: '1 Week', value: '1_week' },
                ].map((opt) => {
                  const isSel = value === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => onChange(opt.value)}
                      style={[dynamicStyles.chip, isSel && dynamicStyles.chipSelected]}
                    >
                      <Text style={[dynamicStyles.chipText, isSel && dynamicStyles.chipTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </View>

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input 
              label={t.subs.notes} 
              placeholder={t.global.egSharedWithFamily} 
              onBlur={onBlur} 
              onChangeText={onChange} 
              value={value} 
              error={errors.notes?.message} 
              multiline 
              containerStyle={{ minHeight: 100 }}
            />
          )}
        />
        
        <View style={dynamicStyles.switchContainer}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={dynamicStyles.switchTitle}>{t.form?.trialTitle || 'Trial Version'}</Text>
            <Text style={dynamicStyles.switchDesc}>{t.form?.trialSubtitle || t.global.trackExpirationAndAv}</Text>
          </View>
          <Controller
            control={control}
            name="isTrial"
            render={({ field: { onChange, value } }) => (
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={value ? '#FFFFFF' : colors.textSecondary}
                ios_backgroundColor={colors.border}
                onValueChange={(val) => {
                  triggerHaptic('medium');
                  onChange(val);
                }}
                value={value}
              />
            )}
          />
        </View>

        {isTrial && (
          <Controller
            control={control}
            name="trialEndDate"
            render={({ field: { onChange, value } }) => (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>İlk Para Çekilme Tarihi</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === 'web') triggerWebTrialCalendar();
                    else setShowTrialPicker(true);
                  }}
                  style={{
                    width: '100%',
                    padding: 16,
                    backgroundColor: '#1E293B',
                    borderWidth: 1,
                    borderColor: '#334155',
                    borderRadius: 8,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '500' }}>
                    {formatLocalizedDate(value || new Date(), activeLang)}
                  </Text>
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  React.createElement('input', {
                    ref: webTrialDateInputRef,
                    type: 'date',
                    value: value instanceof Date && !isNaN(value.getTime()) 
                      ? value.toISOString().split('T')[0] 
                      : new Date().toISOString().split('T')[0],
                    onChange: (e: any) => {
                      if (e.target.value) onChange(new Date(e.target.value));
                    },
                    style: {
                      position: 'absolute',
                      width: 0,
                      height: 0,
                      opacity: 0,
                      pointerEvents: 'none',
                      border: 'none'
                    }
                  })
                )}

                {Platform.OS === 'ios' && showTrialPicker && (
                  <Modal transparent={true} animationType="slide" onRequestClose={() => setShowTrialPicker(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <View style={{ backgroundColor: colors.surface, padding: 16, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => setShowTrialPicker(false)}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t.global.done}</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={value || new Date()}
                          mode="date"
                          display="spinner"
                          textColor={colors.text}
                          onChange={(event, selectedDate) => {
                            if (selectedDate) onChange(selectedDate);
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {Platform.OS === 'android' && showTrialPicker && (
                  <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowTrialPicker(false);
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
              </View>
            )}
          />
        )}

        <View style={dynamicStyles.switchContainer}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={dynamicStyles.switchTitle}>{(t.forms as any)?.hasContract || 'Annual Commitment Contract'}</Text>
            <Text style={dynamicStyles.switchDesc}>{(t.forms as any)?.contractReminderSubtext || 'Remind 7 days before expiration'}</Text>
          </View>
          <Controller
            control={control}
            name="hasContract"
            render={({ field: { onChange, value } }) => (
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={value ? '#FFFFFF' : colors.textSecondary}
                ios_backgroundColor={colors.border}
                onValueChange={(val) => {
                  triggerHaptic('medium');
                  onChange(val);
                }}
                value={value}
              />
            )}
          />
        </View>

        {hasContract && (
          <Controller
            control={control}
            name="contractEndDate"
            render={({ field: { onChange, value } }) => (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>
                  {t.global?.renewalDate || 'CONTRACT END DATE'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (Platform.OS === 'web') triggerWebContractCalendar();
                    else setShowContractPicker(true);
                  }}
                  style={{
                    width: '100%',
                    padding: 16,
                    backgroundColor: '#1E293B',
                    borderWidth: 1,
                    borderColor: '#334155',
                    borderRadius: 8,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '500' }}>
                    {formatLocalizedDate(value || new Date(Date.now() + 365 * 86400000), activeLang)}
                  </Text>
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  React.createElement('input', {
                    ref: webContractDateInputRef,
                    type: 'date',
                    value: value instanceof Date && !isNaN(value.getTime()) 
                      ? value.toISOString().split('T')[0] 
                      : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                    onChange: (e: any) => {
                      if (e.target.value) onChange(new Date(e.target.value));
                    },
                    style: {
                      position: 'absolute',
                      width: 0,
                      height: 0,
                      opacity: 0,
                      pointerEvents: 'none',
                      border: 'none'
                    }
                  })
                )}

                {Platform.OS === 'ios' && showContractPicker && (
                  <Modal transparent={true} animationType="slide" onRequestClose={() => setShowContractPicker(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <View style={{ backgroundColor: colors.surface, padding: 16, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => setShowContractPicker(false)}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t.global.done}</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={value || new Date(Date.now() + 365 * 86400000)}
                          mode="date"
                          display="spinner"
                          textColor={colors.text}
                          onChange={(event, selectedDate) => {
                            if (selectedDate) onChange(selectedDate);
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {Platform.OS === 'android' && showContractPicker && (
                  <DateTimePicker
                    value={value || new Date(Date.now() + 365 * 86400000)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowContractPicker(false);
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
              </View>
            )}
          />
        )}

        {/* Split Engine UI */}
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <View style={dynamicStyles.switchContainer}>
            <View>
              <Text style={dynamicStyles.switchTitle}>{t.form.splitTitle}</Text>
              <Text style={dynamicStyles.switchDesc}>{t.form.splitSubtitle}</Text>
            </View>
            <Controller
              control={control}
              name="isSplit"
              render={({ field: { onChange, value } }) => (
                <Switch
                  trackColor={{ false: colors.border, true: '#10B981' }}
                  thumbColor={value ? '#FFFFFF' : colors.textSecondary}
                  ios_backgroundColor={colors.border}
                  onValueChange={(val) => {
                    triggerHaptic('selection');
                    onChange(val);
                    if (val && splitFields.length === 0) {
                      appendSplit({ id: Date.now().toString(), name: '', phone: '', shareAmount: 0, isPaid: false });
                    }
                  }}
                  value={value}
                />
              )}
            />
          </View>

          {isSplit && (
            <View style={{ marginTop: 12, backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
              {/* Auto-Divide Button */}
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  const currentAmount = watch('amount') || 0;
                  const count = splitFields.length;
                  if (currentAmount > 0 && count > 0) {
                    const equalShare = Number((currentAmount / (count + 1)).toFixed(2));
                    splitFields.forEach((_, idx) => {
                      setValue(`splitMembers.${idx}.shareAmount` as any, equalShare);
                    });
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calculator-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>
                  ⚡ Auto-Divide Equally ({splitFields.length + 1} People)
                </Text>
              </TouchableOpacity>

              {splitFields.map((field, index) => (
                <View key={field.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: index === splitFields.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>{t.form.partner} {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeSplit(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <Controller
                    control={control}
                    name={`splitMembers.${index}.name`}
                    render={({ field: { onChange, value } }) => (
                      <Input label={t.form.name} placeholder={t.form.name} value={value} onChangeText={onChange} />
                    )}
                  />

                  <Controller
                    control={control}
                    name={`splitMembers.${index}.phone`}
                    render={({ field: { onChange, value } }) => (
                      <Input label={t.form.phone} placeholder="90532..." keyboardType="phone-pad" value={value} onChangeText={onChange} />
                    )}
                  />

                  <Controller
                    control={control}
                    name={`splitMembers.${index}.shareAmount`}
                    render={({ field: { onChange, value } }) => (
                      <Input label={t.form.amount} placeholder="0.00" keyboardType="numeric" value={value ? String(value) : ''} onChangeText={onChange} />
                    )}
                  />

                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B98120', padding: 12, borderRadius: 8, marginTop: 8 }}
                    onPress={() => {
                      const member = watch(`splitMembers.${index}`);
                      const subName = watch('name');
                      const currency = watch('currency');
                      dispatchWhatsAppReminder(member as any, subName, currency);
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#10B981', fontWeight: 'bold' }}>{t.form.sendReminder}</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, borderStyle: 'dashed' }}
                onPress={() => appendSplit({ id: Date.now().toString(), name: '', phone: '', shareAmount: 0, isPaid: false })}
              >
                <Ionicons name="add" size={20} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t.form.addPartner}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={dynamicStyles.buttonGroup}>
          <Button 
            title={submitLabel} 
            onPress={handleSubmit((data) => {
              triggerHaptic('heavy');

              if (monthlyBudget) {
                // Calculate current total
                let currentTotal = 0;
                if (existingSubscriptions) {
                  existingSubscriptions.forEach(sub => {
                    if (isEdit && sub.id === initialData?.id) return; // exclude current if editing
                    if (sub.status === 'paused') return;
                    currentTotal += calculateMonthlyCosts(sub, baseCurrency || 'USD').gross;
                  });
                }

                // Add new amount
                const newCosts = calculateMonthlyCosts(data as any, baseCurrency || 'USD');
                const projectedTotal = currentTotal + newCosts.gross;

                if (projectedTotal > monthlyBudget) {
                  const title = "Budget Warning";
                  const msg = `This subscription will put you over your monthly budget of ${monthlyBudget} ${baseCurrency}. Save anyway?`;
                  
                  if (Platform.OS === 'web') {
                    if (window.confirm(`${title}\n\n${msg}`)) {
                      onSubmit(data);
                    }
                  } else {
                    Alert.alert(
                      title,
                      msg,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Save Anyway", style: "destructive", onPress: () => onSubmit(data) }
                      ]
                    );
                  }
                  return; // Stop here, wait for user confirmation
                }
              }

              onSubmit(data);
            })} 
            isLoading={isLoading} 
          />
          {isEdit && onDelete && (
            <Button 
              title={t.global?.deleteSubscription || "Delete Subscription"} 
              variant="destructive"
              onPress={() => {
                triggerHaptic('heavy');
                onDelete();
              }}
              style={{ marginTop: 12 }}
            />
          )}
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.global.selectCategory}</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>{t.global.close}</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <FlatList
                  data={CATEGORIES}
                  keyExtractor={item => item.name}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.name);
                        setIsCategoryModalVisible(false);
                      }}
                      style={[
                        dynamicStyles.modalRow,
                        value === item.name && dynamicStyles.modalRowSelected
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 16 }}>
                        <Text style={[dynamicStyles.modalRowText, value === item.name && dynamicStyles.modalRowTextSelected]}>
                          {(t.categories as any)?.[item.name] || item.name}
                        </Text>
                        {!!item.hint && (
                          <Text style={dynamicStyles.modalRowHint}>
                            {item.hint}
                          </Text>
                        )}
                      </View>
                      {value === item.name && (
                        <Text style={dynamicStyles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Card Selection Modal */}
      <Modal
        visible={isCardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCardModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { height: '50%' }]}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.global.selectPaymentMethod}</Text>
              <TouchableOpacity onPress={() => setIsCardModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>{t.global.close}</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="cardId"
              render={({ field: { onChange, value } }) => (
                <FlatList
                  data={[{ id: null, name: 'None / No Card' }, ...cards]}
                  keyExtractor={item => item.id || 'none'}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.id);
                        setIsCardModalVisible(false);
                      }}
                      style={[
                        dynamicStyles.modalRow,
                        value === item.id && dynamicStyles.modalRowSelected
                      ]}
                    >
                      <Text style={[dynamicStyles.modalRowText, value === item.id && dynamicStyles.modalRowTextSelected]}>
                        {item.id ? `💳 ${item.type?.toUpperCase()} - ${item.name} (•••• ${item.lastFourDigits || '****'})` : item.name}
                      </Text>
                      {value === item.id && (
                        <Text style={dynamicStyles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCurrencyModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { height: '60%' }]}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.global.selectCurrency}</Text>
              <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>{t.global.close}</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, value } }) => (
                <FlatList
                  data={SUPPORTED_CURRENCIES as unknown as any[]}
                  keyExtractor={item => item.code}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.code);
                        setIsCurrencyModalVisible(false);
                      }}
                      style={[
                        dynamicStyles.modalRow,
                        value === item.code && dynamicStyles.modalRowSelected
                      ]}
                    >
                      <Text style={[dynamicStyles.modalRowText, value === item.code && dynamicStyles.modalRowTextSelected]}>
                        {item.code} ({item.symbol})
                      </Text>
                      {value === item.code && (
                        <Text style={dynamicStyles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAccessory />
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 160,
  },
  aiScanButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  aiScanText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  heroContainerRedesigned: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    marginTop: 16,
  },
  postTrialLabel: {
    color: colors.primary, 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    letterSpacing: 1
  },
  heroInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  heroInputRedesigned: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'Hanken Grotesk',
    textAlign: 'center',
    marginRight: 12,
    minWidth: 120,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  currencyText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 4,
  },
  currencyChevron: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  brandsScroll: {
    marginVertical: 16,
  },
  brandsContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 110,
    alignContent: 'flex-start',
    gap: 10,
    paddingRight: 16,
  },
  brandTextChip: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextChipText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  heroError: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  flexHalf: {
    flex: 1,
  },
  reminderSection: {
    marginBottom: 24,
    marginTop: 16,
  },
  reminderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  cycleChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cycleChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cycleChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cycleChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.border,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonGroup: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Hanken Grotesk',
  },
  modalClose: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.border,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowSelected: {
    borderColor: colors.primary,
  },
  modalRowText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalRowTextSelected: {
    color: colors.primary,
  },
  modalRowHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkIcon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  }
});




import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Switch, TextInput, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { triggerHaptic } from '@/utils/haptics';
import { Input } from '@/components/ui/Input';
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardAccessory';
import { Button } from '@/components/ui/Button';
import { subscriptionSchema, SubscriptionFormData } from '../schemas/subscription.schema';
import { Subscription } from '@/services/firebase/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCards } from '@/features/cards/hooks/useCards';
import { sanitizePriceInput, sanitizeTextInput } from '@/utils/sanitizers';

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

export const CURRENCIES = [
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
}

export function SubscriptionForm({ initialData, onSubmit, isLoading, submitLabel, onDelete, hideHero, externalAmount }: Props) {
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [showRenewalPicker, setShowRenewalPicker] = useState(false);
  const [showTrialPicker, setShowTrialPicker] = useState(false);
  const [showContractPicker, setShowContractPicker] = useState(false);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  
  const { data: cards = [] } = useCards();
  
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const activeLang = i18n.language || 'en';
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

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

  const { control, handleSubmit, formState: { errors }, watch } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      amount: initialData?.amount || 0,
      currency: initialData?.currency || 'USD',
      billingCycle: initialData?.billingCycle || 'monthly',
      renewalDate: initialData?.renewalDate?.toDate() || new Date(),
      reminderOffset: initialData?.reminderOffset || '1_day',
      isFreeTrial: initialData?.isFreeTrial || false,
      trialEndDate: initialData?.trialEndDate?.toDate() || new Date(),
      hasContract: initialData?.hasContract || false,
      contractEndDate: initialData?.contractEndDate 
        ? (typeof initialData.contractEndDate.toDate === 'function' ? initialData.contractEndDate.toDate() : new Date(initialData.contractEndDate))
        : new Date(Date.now() + 365 * 86400000),
      notes: initialData?.notes || '',
      status: initialData?.status || 'active',
      cardId: initialData?.cardId || null,
    }
  });

  // Sync external amount to form
  React.useEffect(() => {
    if (externalAmount !== undefined) {
      control._formValues.amount = externalAmount;
    }
  }, [externalAmount]);

  const isPaused = watch('status') === 'paused';
  const isFreeTrial = watch('isFreeTrial');
  const hasContract = watch('hasContract');

  return (
    <>
      <ScrollView 
        contentContainerStyle={dynamicStyles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* HERO AMOUNT ELEMENT (REDESIGNED) */}
        {!hideHero && (
          <View style={dynamicStyles.heroContainerRedesigned}>
            {isFreeTrial && (
              <Text style={dynamicStyles.postTrialLabel}>{t('global.posttrialPrice')}</Text>
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
                    placeholder={t('global.000')}
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
                    <Text style={dynamicStyles.currencyChevron}>{t('global.symbol533')}</Text>
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
                    placeholder={t('global.selectACard')} 
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
                label={t('subs.name')} 
                placeholder={t('global.egNetflix')} 
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
                  {POPULAR_BRANDS.map((brand) => (
                    <TouchableOpacity
                      key={brand.name}
                      style={dynamicStyles.brandTextChip}
                      onPress={() => {
                        onChange(brand.name);
                        if (!watch('category')) {
                          control._formValues.category = brand.category;
                        }
                      }}
                    >
                      <Text style={dynamicStyles.brandTextChipText}>{brand.name}</Text>
                    </TouchableOpacity>
                  ))}
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
                  label={t('subs.category')} 
                  placeholder={t('global.selectACategory')} 
                  value={value} 
                  error={errors.category?.message} 
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          )}
        />
        
        <View style={dynamicStyles.reminderSection}>
          <Text style={dynamicStyles.reminderLabel}>{t('subs.billingCycle').toUpperCase()}</Text>
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
          
          <Controller
            control={control}
            name="renewalDate"
            render={({ field: { onChange, value } }) => (
                <View style={{ width: '100%', marginBottom: 16 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>{t('global.renewalDate')}</Text>
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
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t('global.done')}</Text>
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
        <View style={dynamicStyles.reminderSection}>
          <Text style={dynamicStyles.reminderLabel}>{t('global.reminderOffset')}</Text>
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
              label={t('subs.notes')} 
              placeholder={t('global.egSharedWithFamily')} 
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
          <View>
            <Text style={dynamicStyles.switchTitle}>{t('global.thisIsAFreeTrial')}</Text>
            <Text style={dynamicStyles.switchDesc}>{t('global.trackExpirationAndAv')}</Text>
          </View>
          <Controller
            control={control}
            name="isFreeTrial"
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

        {isFreeTrial && (
          <Controller
            control={control}
            name="trialEndDate"
            render={({ field: { onChange, value } }) => (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>{t('global.trialEndDate')}</Text>
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
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t('global.done')}</Text>
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
          <View>
            <Text style={dynamicStyles.switchTitle}>{t('forms.hasContract')}</Text>
            <Text style={dynamicStyles.switchDesc}>{t('forms.contractReminderSubtext')}</Text>
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
                  {t('forms.contractEndDateLabel')}
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
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t('global.done')}</Text>
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

        
        {isEdit && (
          <View style={dynamicStyles.switchContainer}>
            <View>
              <Text style={dynamicStyles.switchTitle}>{t('global.pauseSubscription')}</Text>
              <Text style={dynamicStyles.switchDesc}>{t('global.temporarilyStopTrack')}</Text>
            </View>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Switch
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={value === 'paused' ? '#FFFFFF' : colors.textSecondary}
                  ios_backgroundColor={colors.border}
                  onValueChange={(val) => {
                    triggerHaptic('medium');
                    onChange(val ? 'paused' : 'active');
                  }}
                  value={value === 'paused'}
                />
              )}
            />
          </View>
        )}
        
        <View style={dynamicStyles.buttonGroup}>
          <Button 
            title={submitLabel} 
            onPress={handleSubmit((data) => {
              triggerHaptic('heavy');
              onSubmit(data);
            })} 
            isLoading={isLoading} 
          />
          {isEdit && onDelete && (
            <Button 
              title="Delete Subscription" 
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
              <Text style={dynamicStyles.modalTitle}>{t('global.selectCategory')}</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>{t('global.close')}</Text>
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
                          {item.name}
                        </Text>
                        {!!item.hint && (
                          <Text style={dynamicStyles.modalRowHint}>
                            {item.hint}
                          </Text>
                        )}
                      </View>
                      {value === item.name && (
                        <Text style={dynamicStyles.checkIcon}>{t('global.symbol66')}</Text>
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
              <Text style={dynamicStyles.modalTitle}>{t('global.selectPaymentMethod')}</Text>
              <TouchableOpacity onPress={() => setIsCardModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>{t('global.close')}</Text>
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
                        <Text style={dynamicStyles.checkIcon}>{t('global.symbol66')}</Text>
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
              <Text style={dynamicStyles.modalTitle}>{t('global.selectCurrency')}</Text>
              <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>{t('global.close')}</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, value } }) => (
                <FlatList
                  data={CURRENCIES}
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
                        {item.label}
                      </Text>
                      {value === item.code && (
                        <Text style={dynamicStyles.checkIcon}>{t('global.symbol66')}</Text>
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
    paddingBottom: 80,
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

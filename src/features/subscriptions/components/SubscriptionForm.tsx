import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Switch, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { subscriptionSchema, SubscriptionFormData } from '../schemas/subscription.schema';
import { Subscription } from '@/services/firebase/types';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const DESIGN_TOKENS = {
  colors: {
    background: '#0B0F19',
    surface: '#1F2937',
    surfaceContainer: '#1F2937',
    surfaceContainerHigh: '#262A35',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#9CA3AF',
    primary: '#3B82F6',
    onPrimary: '#FFFFFF',
    error: '#ef4444',
    outline: '#313540',
  }
};

interface Props {
  initialData?: Subscription;
  onSubmit: (data: SubscriptionFormData) => void;
  isLoading: boolean;
  submitLabel: string;
  onDelete?: () => void;
}

export function SubscriptionForm({ initialData, onSubmit, isLoading, submitLabel, onDelete }: Props) {
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [showRenewalPicker, setShowRenewalPicker] = useState(false);
  const [showTrialPicker, setShowTrialPicker] = useState(false);

  const isEdit = !!initialData;

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
      notes: initialData?.notes || '',
      status: initialData?.status || 'active',
    }
  });

  const isPaused = watch('status') === 'paused';
  const isFreeTrial = watch('isFreeTrial');

  return (
    <>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* HERO AMOUNT ELEMENT */}
        <View style={styles.heroContainer}>
          {isFreeTrial && (
            <Text style={{ color: DESIGN_TOKENS.colors.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 }}>
              POST-TRIAL PRICE
            </Text>
          )}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.heroInput}
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ? value.toString() : ''}
                placeholder="$0.00"
                placeholderTextColor="#9CA3AF"
                numberOfLines={1}
                textAlign="center"
              />
            )}
          />
          {!!errors.amount?.message && (
             <Text style={styles.heroError}>{errors.amount.message}</Text>
          )}
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input 
              label="Subscription Name" 
              placeholder="e.g., Netflix" 
              onBlur={onBlur} 
              onChangeText={onChange} 
              value={value} 
              error={errors.name?.message} 
            />
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
                  label="Category" 
                  placeholder="Select a category" 
                  value={value} 
                  error={errors.category?.message} 
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          )}
        />
        
        <Controller
          control={control}
          name="currency"
          render={({ field: { value } }) => (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setIsCurrencyModalVisible(true)}
            >
              <View pointerEvents="none">
                <Input 
                  label="Currency" 
                  placeholder="Select currency" 
                  value={value} 
                  error={errors.currency?.message} 
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="billingCycle"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input 
                containerStyle={styles.flexHalf}
                label="Billing Cycle" 
                placeholder="monthly" 
                autoCapitalize="none"
                onBlur={onBlur} 
                onChangeText={onChange} 
                value={value} 
                error={errors.billingCycle?.message} 
              />
            )}
          />
          
          <Controller
            control={control}
            name="renewalDate"
            render={({ field: { onChange, value } }) => (
              <View style={styles.flexHalf}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowRenewalPicker(true)}>
                  <View pointerEvents="none">
                    <Input 
                      label="Renewal Date" 
                      placeholder="Select Date" 
                      value={value ? value.toISOString().split('T')[0] : ''} 
                      error={errors.renewalDate?.message} 
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>

                {Platform.OS === 'ios' && showRenewalPicker && (
                  <Modal transparent={true} animationType="slide" onRequestClose={() => setShowRenewalPicker(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <View style={{ backgroundColor: '#1F2937', padding: 16, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => setShowRenewalPicker(false)}>
                            <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={value || new Date()}
                          mode="date"
                          display="spinner"
                          textColor="#FFFFFF"
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
        </View>
        
        <View style={styles.reminderSection}>
          <Text style={styles.reminderLabel}>REMINDER OFFSET</Text>
          <Controller
            control={control}
            name="reminderOffset"
            render={({ field: { onChange, value } }) => (
              <View style={styles.chipRow}>
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
                      style={[styles.chip, isSel && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
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
              label="Notes (Optional)" 
              placeholder="e.g., Shared with family" 
              onBlur={onBlur} 
              onChangeText={onChange} 
              value={value} 
              error={errors.notes?.message} 
              multiline 
              containerStyle={{ minHeight: 100 }}
            />
          )}
        />
        
        <View style={styles.switchContainer}>
          <View>
            <Text style={styles.switchTitle}>This is a Free Trial</Text>
            <Text style={styles.switchDesc}>Track expiration and avoid charges</Text>
          </View>
          <Controller
            control={control}
            name="isFreeTrial"
            render={({ field: { onChange, value } }) => (
              <Switch
                trackColor={{ false: DESIGN_TOKENS.colors.surfaceContainerHigh, true: DESIGN_TOKENS.colors.primary }}
                thumbColor={value ? DESIGN_TOKENS.colors.onPrimary : DESIGN_TOKENS.colors.onSurfaceVariant}
                ios_backgroundColor={DESIGN_TOKENS.colors.surfaceContainerHigh}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
              <View>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTrialPicker(true)}>
                  <View pointerEvents="none">
                    <Input 
                      label="Trial End Date" 
                      placeholder="Select Date" 
                      value={value ? value.toISOString().split('T')[0] : ''} 
                      error={errors.trialEndDate?.message} 
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>

                {Platform.OS === 'ios' && showTrialPicker && (
                  <Modal transparent={true} animationType="slide" onRequestClose={() => setShowTrialPicker(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <View style={{ backgroundColor: '#1F2937', padding: 16, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => setShowTrialPicker(false)}>
                            <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={value || new Date()}
                          mode="date"
                          display="spinner"
                          textColor="#FFFFFF"
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

        
        {isEdit && (
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.switchTitle}>Pause Subscription</Text>
              <Text style={styles.switchDesc}>Temporarily stop tracking this cost</Text>
            </View>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Switch
                  trackColor={{ false: DESIGN_TOKENS.colors.surfaceContainerHigh, true: DESIGN_TOKENS.colors.primary }}
                  thumbColor={value === 'paused' ? DESIGN_TOKENS.colors.onPrimary : DESIGN_TOKENS.colors.onSurfaceVariant}
                  ios_backgroundColor={DESIGN_TOKENS.colors.surfaceContainerHigh}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    onChange(val ? 'paused' : 'active');
                  }}
                  value={value === 'paused'}
                />
              )}
            />
          </View>
        )}
        
        <View style={styles.buttonGroup}>
          <Button 
            title={submitLabel} 
            onPress={handleSubmit(onSubmit)} 
            isLoading={isLoading} 
          />
          {isEdit && onDelete && (
            <Button 
              title="Delete Subscription" 
              variant="destructive"
              onPress={onDelete}
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
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
                        styles.modalRow,
                        value === item.name && styles.modalRowSelected
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 16 }}>
                        <Text style={[styles.modalRowText, value === item.name && styles.modalRowTextSelected]}>
                          {item.name}
                        </Text>
                        {!!item.hint && (
                          <Text style={styles.modalRowHint}>
                            {item.hint}
                          </Text>
                        )}
                      </View>
                      {value === item.name && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCurrencyModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
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
                        styles.modalRow,
                        value === item.code && styles.modalRowSelected
                      ]}
                    >
                      <Text style={[styles.modalRowText, value === item.code && styles.modalRowTextSelected]}>
                        {item.label}
                      </Text>
                      {value === item.code && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 80,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  heroInput: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Hanken Grotesk',
    minWidth: 200,
  },
  heroError: {
    color: DESIGN_TOKENS.colors.error,
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
  },
  reminderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.onSurfaceVariant,
    marginBottom: 8,
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
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.outline,
  },
  chipSelected: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.onSurface,
  },
  chipTextSelected: {
    color: DESIGN_TOKENS.colors.onPrimary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainerHigh,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.outline,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.onSurface,
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 14,
    color: DESIGN_TOKENS.colors.onSurfaceVariant,
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
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainer,
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
    color: DESIGN_TOKENS.colors.onSurface,
    fontFamily: 'Hanken Grotesk',
  },
  modalClose: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainerHigh,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.outline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowSelected: {
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  modalRowText: {
    fontSize: 16,
    color: DESIGN_TOKENS.colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalRowTextSelected: {
    color: DESIGN_TOKENS.colors.primary,
  },
  modalRowHint: {
    fontSize: 13,
    color: DESIGN_TOKENS.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  checkIcon: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  }
});

import i18n, { t } from '@/locales/i18n';
import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Modal, FlatList, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { triggerHaptic } from '@/utils/haptics';
import { Input } from '@/components/ui/Input';
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardAccessory';
import { Button } from '@/components/ui/Button';
import { cardSchema, CardFormData } from '../schemas/card.schema';
import { Card } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { CardWidget } from './CardWidget';

const CARD_TYPES = [
  { label: 'Visa', value: 'visa' },
  { label: 'Mastercard', value: 'mastercard' },
  { label: 'Troy', value: 'troy' },
  { label: 'American Express (Amex)', value: 'amex' },
  { label: 'UnionPay', value: 'unionpay' },
  { label: 'JCB', value: 'jcb' },
  { label: 'Discover', value: 'discover' },
  { label: 'Diners Club', value: 'diners' },
  { label: 'Maestro', value: 'maestro' },
  { label: 'Other', value: 'other' },
] as const;

const CURRENCIES = [
  { label: 'TRY (₺)', value: 'TRY', symbol: '₺' },
  { label: 'USD ($)', value: 'USD', symbol: '$' },
  { label: 'EUR (€)', value: 'EUR', symbol: '€' },
  { label: 'GBP (£)', value: 'GBP', symbol: '£' },
] as const;

const PREMIUM_COLORS = [
  '#0F172A', // Deep Black/Slate
  '#1E3A8A', // Royal Blue
  '#047857', // Emerald Green
  '#BE123C', // Crimson Red
  '#4338CA', // Indigo
  '#B45309', // Amber/Gold
  '#0F766E', // Teal
  '#5B21B6', // Purple
];

interface Props {
  initialData?: Card;
  onSubmit: (data: CardFormData) => void;
  isLoading: boolean;
  submitLabel: string;
  onDelete?: () => void;
}

export function CardForm({ initialData, onSubmit, isLoading, submitLabel, onDelete }: Props) {
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const { colors } = useTheme();
  
  const isEdit = !!initialData;
  const currentYear = new Date().getFullYear();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'visa',
      lastFourDigits: initialData?.lastFourDigits || '',
      expiryMonth: initialData?.expiryMonth || new Date().getMonth() + 1,
      expiryYear: initialData?.expiryYear || currentYear + 3,
      color: initialData?.color || PREMIUM_COLORS[0],
      currency: initialData?.currency || 'TRY',
    }
  });


  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visual Preview */}
        <CardWidget
          card={{
            id: 'preview',
            userId: 'preview',
            name: watch('name') || 'Card Name',
            type: watch('type') || 'visa',
            lastFourDigits: watch('lastFourDigits') || '****',
            expiryMonth: watch('expiryMonth') || 12,
            expiryYear: watch('expiryYear') || 2099,
            color: watch('color') || PREMIUM_COLORS[0],
            currency: watch('currency') || 'TRY',
            limit: 0,
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          subscriptions={[]}
          style={{ marginBottom: 24, marginTop: 12, marginHorizontal: 20 }}
        />

        <View style={styles.formContainer}>
          <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input 
              label="Card Name" 
              placeholder={t.global.egVirtualShoppingCar} 
              onBlur={onBlur} 
              onChangeText={onChange} 
              value={value} 
              error={errors.name?.message} 
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Controller
              control={control}
              name="type"
              render={({ field: { value } }) => (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setIsTypeModalVisible(true)}>
                  <View pointerEvents="none">
                    <Input 
                      label="Card Type" 
                      placeholder={t.global.selectType} 
                      value={CARD_TYPES.find(t => t.value === value)?.label || value} 
                      error={errors.type?.message} 
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
          <View style={styles.flexHalf}>
            <Controller
              control={control}
              name="lastFourDigits"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input 
                  label="Last 4 Digits" 
                  placeholder={t.global.eg4321} 
                  keyboardType="numeric"
                  maxLength={4}
                  onBlur={onBlur} 
                  onChangeText={onChange} 
                  value={value} 
                  error={errors.lastFourDigits?.message} 
                  inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="currency"
              render={({ field: { value } }) => (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setIsCurrencyModalVisible(true)}>
                  <View pointerEvents="none">
                    <Input 
                      label="Para Birimi / Currency" 
                      placeholder={t.global.try} 
                      value={CURRENCIES.find(c => c.value === value)?.label || value} 
                      error={errors.currency?.message} 
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Controller
              control={control}
              name="expiryMonth"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input 
                  label="Expiry Month (MM)" 
                  placeholder={t.global.mm} 
                  keyboardType="numeric"
                  maxLength={2}
                  onBlur={onBlur} 
                  onChangeText={(text) => onChange(parseInt(text) || 0)} 
                  value={value ? value.toString() : ''} 
                  error={errors.expiryMonth?.message} 
                  inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                />
              )}
            />
          </View>
          <View style={styles.flexHalf}>
            <Controller
              control={control}
              name="expiryYear"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input 
                  label="Expiry Year (YYYY)" 
                  placeholder={t.global.yyyy} 
                  keyboardType="numeric"
                  maxLength={4}
                  onBlur={onBlur} 
                  onChangeText={(text) => onChange(parseInt(text) || 0)} 
                  value={value ? value.toString() : ''} 
                  error={errors.expiryYear?.message} 
                  inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.colorSection}>
          <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>{t.global.cardColor}</Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, value } }) => (
              <View style={styles.colorGrid}>
                {PREMIUM_COLORS.map(c => {
                  const isSelected = value === c;
                  return (
                    <TouchableOpacity 
                      key={c}
                      activeOpacity={0.8}
                      onPress={() => {
                        triggerHaptic('selection');
                        onChange(c);
                      }}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        isSelected && { borderWidth: 3, borderColor: colors.primary }
                      ]}
                    />
                  );
                })}
              </View>
            )}
          />
        </View>
        </View>

        <View style={styles.buttonGroup}>
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
              title="Delete Card" 
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

      {/* Type Selection Modal */}
      <Modal visible={isTypeModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsTypeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.global.selectCardType}</Text>
              <TouchableOpacity onPress={() => setIsTypeModalVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t.global.close}</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <FlatList
                  data={CARD_TYPES}
                  keyExtractor={item => item.value}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.value);
                        setIsTypeModalVisible(false);
                      }}
                      style={[styles.modalRow, { borderBottomColor: colors.border }]}
                    >
                      <Text style={[styles.modalRowText, { color: value === item.value ? colors.primary : colors.text }]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Text style={{ color: colors.primary, fontWeight: 'bold' }}>✓</Text>}
                    </TouchableOpacity>
                  )}
                />
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal visible={isCurrencyModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsCurrencyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.global.selectCurrency}</Text>
              <TouchableOpacity onPress={() => setIsCurrencyModalVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t.global.close}</Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, value } }) => (
                <FlatList
                  data={CURRENCIES}
                  keyExtractor={item => item.value}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.value);
                        setIsCurrencyModalVisible(false);
                      }}
                      style={[styles.modalRow, { borderBottomColor: colors.border }]}
                    >
                      <Text style={[styles.modalRowText, { color: value === item.value ? colors.primary : colors.text }]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Text style={{ color: colors.primary, fontWeight: 'bold' }}>✓</Text>}
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

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 80,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
    marginBottom: 24,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  previewNumber: {
    color: '#FFF',
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginVertical: 20,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  previewType: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  flexHalf: {
    flex: 1,
  },
  colorSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  buttonGroup: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalRowText: {
    fontSize: 16,
  },
});

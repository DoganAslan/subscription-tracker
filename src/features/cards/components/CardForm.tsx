import { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { triggerHaptic } from '@/utils/haptics';
import { Input } from '@/components/ui/Input';
import { KeyboardAccessory, KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardAccessory';
import { Button } from '@/components/ui/Button';
import { cardSchema, CardFormData } from '../schemas/card.schema';
import { Card } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { CardWidget } from './CardWidget';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from '@/context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CARD_TYPES = [
  { label: 'Visa', value: 'visa' },
  { label: 'Mastercard', value: 'mastercard' },
  { label: 'Troy', value: 'troy' },
  { label: 'American Express (Amex)', value: 'amex' },
  { label: 'Other', value: 'other' },
] as const;

const CURRENCIES = [
  { label: 'TRY (₺)', value: 'TRY', symbol: '₺' },
  { label: 'USD ($)', value: 'USD', symbol: '$' },
  { label: 'EUR (€)', value: 'EUR', symbol: '€' },
  { label: 'GBP (£)', value: 'GBP', symbol: '£' },
] as const;

const PREMIUM_COLORS = [
  { hex: '#0F172A', en: 'Slate Black', tr: 'Gece siyahı' },
  { hex: '#1E3A8A', en: 'Royal Blue', tr: 'Kraliyet mavisi' },
  { hex: '#047857', en: 'Emerald', tr: 'Zümrüt' },
  { hex: '#BE123C', en: 'Crimson', tr: 'Kızıl' },
  { hex: '#4338CA', en: 'Indigo', tr: 'Çivit mavisi' },
  { hex: '#B45309', en: 'Gold', tr: 'Altın' },
  { hex: '#0F766E', en: 'Teal', tr: 'Turkuaz' },
  { hex: '#5B21B6', en: 'Purple', tr: 'Mor' },
  { hex: '#831843', en: 'Rose', tr: 'Gül kurusu' },
  { hex: '#064E3B', en: 'Forest', tr: 'Orman yeşili' },
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
  const { colors, isDark } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  
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
      color: initialData?.color || PREMIUM_COLORS[0].hex,
      currency: initialData?.currency || 'TRY',
      monthlyLimit: initialData?.monthlyLimit,
    }
  });

  // Watch all fields for live preview
  const watchedName = watch('name');
  const watchedType = watch('type');
  const watchedLastFour = watch('lastFourDigits');
  const watchedMonth = watch('expiryMonth');
  const watchedYear = watch('expiryYear');
  const watchedColor = watch('color');
  const watchedCurrency = watch('currency');
  const watchedMonthlyLimit = watch('monthlyLimit');

  return (
    <>
      {/* Sticky Live Preview Card */}
      <View style={[styles.previewContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <CardWidget
          card={{
            id: 'preview',
            userId: 'preview',
            name: watchedName || ((t.global as any)?.cardName || 'Card Name'),
            type: watchedType || 'visa',
            lastFourDigits: watchedLastFour || '****',
            expiryMonth: watchedMonth || 12,
            expiryYear: watchedYear || 2099,
            color: watchedColor || PREMIUM_COLORS[0].hex,
            currency: watchedCurrency || 'TRY',
            monthlyLimit: watchedMonthlyLimit,
            isPinned: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }}
          subscriptions={[]}
          style={{ marginHorizontal: 4 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.formContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input 
                label={(t.global as any)?.cardName || 'Card Name'} 
                placeholder={t.global?.egVirtualShoppingCar || 'e.g., Virtual Shopping Card'} 
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
                        label={(t.global as any)?.cardType || 'Card Type'} 
                        placeholder={t.global?.selectType || 'Select Type'} 
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
                    label={(t.global as any)?.lastFourDigits || 'Last 4 Digits'} 
                    placeholder={t.global?.eg4321 || 'e.g. 4321'} 
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

          <Controller
            control={control}
            name="monthlyLimit"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                accessibilityLabel={(t.global as any)?.monthlyLimit || (currentLanguage === 'tr' ? 'Aylık kart limiti' : 'Monthly card limit')}
                label={(t.global as any)?.monthlyLimit || (currentLanguage === 'tr' ? 'Aylık kart limiti' : 'Monthly card limit')}
                placeholder={(t.global as any)?.monthlyLimitPlaceholder || (currentLanguage === 'tr' ? 'Örn. 5000' : 'e.g. 5000')}
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={(text) => {
                  const normalized = text.trim().replace(',', '.');
                  onChange(normalized === '' ? undefined : Number(normalized));
                }}
                value={value == null ? '' : String(value)}
                error={errors.monthlyLimit?.message}
                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              />
            )}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="currency"
                render={({ field: { value } }) => (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setIsCurrencyModalVisible(true)}>
                    <View pointerEvents="none">
                      <Input 
                        label={(t.global as any)?.currency || 'Currency'} 
                        placeholder="TRY" 
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
                    label={(t.global as any)?.expiryMonth || 'Expiry Month (MM)'} 
                    placeholder={t.global?.mm || 'MM'} 
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
                    label={(t.global as any)?.expiryYear || 'Expiry Year (YYYY)'} 
                    placeholder={t.global?.yyyy || 'YYYY'} 
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

          {/* Color Picker */}
          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>{(t.global as any)?.cardColor || 'CARD COLOR'}</Text>
            <Controller
              control={control}
              name="color"
              render={({ field: { onChange, value } }) => (
                <View style={styles.colorGrid}>
                  {PREMIUM_COLORS.map((c) => {
                    const isSelected = value === c.hex;
                    return (
                      <TouchableOpacity
                        key={c.hex}
                        activeOpacity={0.8}
                        onPress={() => {
                          triggerHaptic('selection');
                          onChange(c.hex);
                        }}
                        style={[
                          styles.colorCircleWrapper,
                          isSelected && { transform: [{ scale: 1.15 }] }
                        ]}
                      >
                        <View style={[styles.colorCircle, { backgroundColor: c.hex }]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={[styles.colorCircleLabel, { color: isSelected ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                          {currentLanguage === 'tr' ? c.tr : c.en}
                        </Text>
                      </TouchableOpacity>
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
              title={(t.global as any)?.deleteCard || 'Delete Card'} 
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
          <View style={[styles.modalContent, {
            backgroundColor: colors.surface,
            paddingBottom: Math.max(24, insets.bottom + 16),
            paddingLeft: Math.max(24, insets.left + 16),
            paddingRight: Math.max(24, insets.right + 16),
          }]}>
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
                      <Text numberOfLines={2} style={[styles.modalRowText, { color: value === item.value ? colors.primary : colors.text }]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Text style={styles.selectionMark}>✓</Text>}
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
          <View style={[styles.modalContent, {
            backgroundColor: colors.surface,
            paddingBottom: Math.max(24, insets.bottom + 16),
            paddingLeft: Math.max(24, insets.left + 16),
            paddingRight: Math.max(24, insets.right + 16),
          }]}>
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
                      <Text numberOfLines={2} style={[styles.modalRowText, { color: value === item.value ? colors.primary : colors.text }]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Text style={styles.selectionMark}>✓</Text>}
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
  previewContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 160,
  },
  formContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircleWrapper: {
    alignItems: 'center',
    width: 56,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  colorCircleLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonGroup: {
    marginTop: 4,
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
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalRowText: {
    fontSize: 16,
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  selectionMark: { color: '#3B82F6', fontWeight: 'bold', flexShrink: 0 },
});

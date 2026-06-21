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

const CARD_TYPES = [
  { label: 'Visa', value: 'visa' },
  { label: 'Mastercard', value: 'mastercard' },
  { label: 'Troy', value: 'troy' },
  { label: 'Amex', value: 'amex' },
  { label: 'Other', value: 'other' },
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
  const { colors } = useTheme();
  
  const isEdit = !!initialData;
  const currentYear = new Date().getFullYear();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'visa',
      lastFourDigits: initialData?.lastFourDigits || '',
      limit: initialData?.limit || 0,
      expiryMonth: initialData?.expiryMonth || new Date().getMonth() + 1,
      expiryYear: initialData?.expiryYear || currentYear + 3,
      color: initialData?.color || PREMIUM_COLORS[0],
    }
  });

  const renderCardLogo = (type: string) => {
    const containerStyle = { width: 50, height: 30, justifyContent: 'center' as const, alignItems: 'flex-end' as const };
    switch (type) {
      case 'visa':
        return (
          <View style={containerStyle}>
            <FontAwesome name="cc-visa" size={28} color="#FFFFFF" />
          </View>
        );
      case 'mastercard':
        return (
          <View style={containerStyle}>
            <FontAwesome name="cc-mastercard" size={28} color="#FFFFFF" />
          </View>
        );
      case 'amex':
        return (
          <View style={containerStyle}>
            <FontAwesome name="cc-amex" size={28} color="#FFFFFF" />
          </View>
        );
      case 'troy':
        return (
          <View style={containerStyle}>
            <View style={{ paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1.5, borderColor: '#FFFFFF', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontStyle: 'italic', fontSize: 12, letterSpacing: 1 }}>TROY</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={containerStyle}>
            <Ionicons name="card" size={28} color="#FFFFFF" />
          </View>
        );
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visual Preview */}
        <View style={[styles.previewCard, { backgroundColor: watch('color') }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewName} numberOfLines={1}>{watch('name') || 'Card Name'}</Text>
            <Ionicons name="card" size={24} color="#FFF" />
          </View>
          <Text style={styles.previewNumber}>
            •••• •••• •••• {watch('lastFourDigits') || '****'}
          </Text>
          <View style={styles.previewFooter}>
            <Text style={styles.previewValue}>
              {watch('expiryMonth').toString().padStart(2, '0')}/{watch('expiryYear').toString().slice(-2)}
            </Text>
            {renderCardLogo(watch('type') || 'visa')}
          </View>
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input 
              label="Card Name" 
              placeholder="e.g., Virtual Shopping Card" 
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
                      placeholder="Select Type" 
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
                  placeholder="e.g. 4321" 
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
          name="limit"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input 
              label="Monthly Limit" 
              placeholder="0.00" 
              keyboardType="numeric"
              onBlur={onBlur} 
              onChangeText={(text) => {
                const parsed = parseFloat(text.replace(/,/g, '.'));
                onChange(isNaN(parsed) ? 0 : parsed);
              }} 
              value={value ? value.toString() : ''} 
              error={errors.limit?.message} 
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Controller
              control={control}
              name="expiryMonth"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input 
                  label="Expiry Month (MM)" 
                  placeholder="MM" 
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
                  placeholder="YYYY" 
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
          <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>CARD COLOR</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Card Type</Text>
              <TouchableOpacity onPress={() => setIsTypeModalVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Close</Text>
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
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.6,
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

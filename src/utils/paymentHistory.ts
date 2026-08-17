// src/utils/paymentHistory.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentLogEntry {
  id: string;
  subId: string;
  dateISO: string;
  amount: number;
  currency: string;
  status: 'paid' | 'refunded' | 'skipped';
  note?: string;
}

const STORAGE_PREFIX = '@submate_payment_history_';

export async function getPaymentHistory(subId: string): Promise<PaymentLogEntry[]> {
  if (!subId) return [];
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${subId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading payment history:', error);
    return [];
  }
}

export async function addPaymentLog(
  subId: string,
  amount: number,
  currency: string,
  status: 'paid' | 'refunded' | 'skipped' = 'paid',
  note?: string
): Promise<PaymentLogEntry[]> {
  if (!subId) return [];
  try {
    const current = await getPaymentHistory(subId);
    const newEntry: PaymentLogEntry = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      subId,
      dateISO: new Date().toISOString(),
      amount: Number(amount) || 0,
      currency: currency || 'TRY',
      status,
      note,
    };
    const updated = [newEntry, ...current];
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${subId}`, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error adding payment log:', error);
    return [];
  }
}

export async function clearPaymentHistory(subId: string): Promise<void> {
  if (!subId) return;
  try {
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}${subId}`);
  } catch (error) {
    console.error('Error clearing payment history:', error);
  }
}

// src/utils/categoryCaps.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_CAPS_KEY = '@submate_category_caps';

export interface CategoryCapMap {
  [category: string]: number; // e.g. { "Streaming": 500, "Software": 1000 }
}

export async function getCategoryCaps(): Promise<CategoryCapMap> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_CAPS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (error) {
    console.error('Error reading category caps:', error);
    return {};
  }
}

export async function setCategoryCap(category: string, capAmount: number | null): Promise<CategoryCapMap> {
  if (!category) return {};
  try {
    const current = await getCategoryCaps();
    if (capAmount === null || capAmount <= 0) {
      delete current[category];
    } else {
      current[category] = capAmount;
    }
    await AsyncStorage.setItem(CATEGORY_CAPS_KEY, JSON.stringify(current));
    return current;
  } catch (error) {
    console.error('Error setting category cap:', error);
    return {};
  }
}

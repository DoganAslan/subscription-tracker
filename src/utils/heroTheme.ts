// src/utils/heroTheme.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const HERO_GRADIENT_KEY = '@submate_hero_gradient';

export interface HeroGradientPreset {
  id: string;
  nameEn: string;
  nameTr: string;
  colors: [string, string, string];
}

export const HERO_GRADIENT_PRESETS: HeroGradientPreset[] = [
  { id: 'blue', nameEn: 'Ocean Blue', nameTr: 'Okyanus Mavisi', colors: ['#2563EB', '#1D4ED8', '#1E40AF'] },
  { id: 'emerald', nameEn: 'Emerald Green', nameTr: 'Zümrüt Yeşili', colors: ['#059669', '#10B981', '#047857'] },
  { id: 'purple', nameEn: 'Cyber Purple', nameTr: 'Siber Mor', colors: ['#7C3AED', '#6D28D9', '#4C1D95'] },
  { id: 'obsidian', nameEn: 'Midnight Black', nameTr: 'Gece Siyahı', colors: ['#1E293B', '#0F172A', '#020617'] },
  { id: 'sunset', nameEn: 'Sunset Orange', nameTr: 'Gün Batımı', colors: ['#EA580C', '#D97706', '#9A3412'] },
];

export async function getSavedHeroGradient(): Promise<[string, string, string]> {
  try {
    const savedId = await AsyncStorage.getItem(HERO_GRADIENT_KEY);
    const found = HERO_GRADIENT_PRESETS.find(p => p.id === savedId);
    return found ? found.colors : HERO_GRADIENT_PRESETS[0].colors;
  } catch (error) {
    return HERO_GRADIENT_PRESETS[0].colors;
  }
}

export async function saveHeroGradient(presetId: string): Promise<[string, string, string]> {
  try {
    await AsyncStorage.setItem(HERO_GRADIENT_KEY, presetId);
    const found = HERO_GRADIENT_PRESETS.find(p => p.id === presetId);
    return found ? found.colors : HERO_GRADIENT_PRESETS[0].colors;
  } catch (error) {
    return HERO_GRADIENT_PRESETS[0].colors;
  }
}

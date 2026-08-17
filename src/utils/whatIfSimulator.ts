// src/utils/whatIfSimulator.ts
import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from './currency';

export interface WhatIfSimulationResult {
  currentYearlyTotal: number;
  simulatedYearlyTotal: number;
  yearlySavings: number;
  savingsPercentage: number;
}

export type WhatIfPresetMode = 'custom' | 'extreme' | 'student' | 'minimalist';

export function getPresetScenarioValues(preset: WhatIfPresetMode): { pauseMonths: number; familyUpgradeCount: number } {
  switch (preset) {
    case 'extreme':
      return { pauseMonths: 6, familyUpgradeCount: 3 };
    case 'student':
      return { pauseMonths: 3, familyUpgradeCount: 2 };
    case 'minimalist':
      return { pauseMonths: 2, familyUpgradeCount: 1 };
    default:
      return { pauseMonths: 0, familyUpgradeCount: 0 };
  }
}

export function simulateWhatIfSavings(
  subscriptions: Subscription[],
  pauseMonths: number, // 0 to 6 months pause for non-essentials
  familyUpgradeCount: number, // Number of eligible subs converted to family plan (~40% avg save)
  baseCurrency: string = 'TRY'
): WhatIfSimulationResult {
  const activeSubs = subscriptions ? subscriptions.filter(s => s.status !== 'paused') : [];

  let currentYearly = 0;
  activeSubs.forEach(s => {
    const monthly = convertCurrency(s.amount || 0, s.currency || 'TRY', baseCurrency);
    currentYearly += monthly * 12;
  });

  let simulatedYearly = currentYearly;

  // 1. Pause calculation: reduce cost of non-essential subs by (pauseMonths / 12)
  if (pauseMonths > 0) {
    activeSubs.forEach(s => {
      const isEssential = s.category?.toLowerCase().includes('cloud') || s.category?.toLowerCase().includes('work');
      if (!isEssential) {
        const monthly = convertCurrency(s.amount || 0, s.currency || 'TRY', baseCurrency);
        const pauseSaved = monthly * pauseMonths;
        simulatedYearly -= pauseSaved;
      }
    });
  }

  // 2. Family plan upgrade calculation: save ~40% per upgraded sub
  if (familyUpgradeCount > 0) {
    const familyEligible = activeSubs.filter(s => {
      const n = s.name.toLowerCase();
      return n.includes('spotify') || n.includes('youtube') || n.includes('apple') || n.includes('netflix');
    });

    for (let i = 0; i < Math.min(familyUpgradeCount, familyEligible.length); i++) {
      const sub = familyEligible[i];
      const monthly = convertCurrency(sub.amount || 0, sub.currency || 'TRY', baseCurrency);
      const yearlyFamilySave = (monthly * 0.4) * 12;
      simulatedYearly -= yearlyFamilySave;
    }
  }

  simulatedYearly = Math.max(0, simulatedYearly);
  const yearlySavings = Math.max(0, currentYearly - simulatedYearly);
  const savingsPercentage = currentYearly > 0 ? Math.round((yearlySavings / currentYearly) * 100) : 0;

  return {
    currentYearlyTotal: Math.round(currentYearly),
    simulatedYearlyTotal: Math.round(simulatedYearly),
    yearlySavings: Math.round(yearlySavings),
    savingsPercentage,
  };
}

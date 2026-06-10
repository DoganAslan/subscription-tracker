import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BudgetState {
  budgetCaps: Record<string, number>;
  setBudgetCap: (category: string, amount: number) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budgetCaps: {},
      setBudgetCap: (category, amount) => 
        set((state) => ({
          budgetCaps: {
            ...state.budgetCaps,
            [category]: amount,
          }
        })),
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

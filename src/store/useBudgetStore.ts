import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BudgetState {
  monthlyBudget: number | null;
  setMonthlyBudget: (amount: number | null) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      monthlyBudget: null,
      
      setMonthlyBudget: (amount: number | null) => set({ monthlyBudget: amount }),
    }),
    {
      name: 'submate-budget-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);



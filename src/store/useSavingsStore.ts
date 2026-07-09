import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

interface SavingsState {
  goals: SavingsGoal[];
  totalSaved: number;
  addSavings: (amount: number, currency: string) => void; // We'll assume a base currency of TRY for simplicity or just store a raw number if they don't use multi-currency targets yet
  setGoal: (title: string, targetAmount: number) => void;
  deleteGoal: (id: string) => void;
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set) => ({
      goals: [],
      totalSaved: 0,
      
      addSavings: (amount: number, currency: string) => set((state) => {
        // For a V1 MVP of this feature, we'll just add the raw amount.
        // In a production app, we would convert foreign currency to base currency first.
        return { totalSaved: state.totalSaved + amount };
      }),

      setGoal: (title: string, targetAmount: number) => set((state) => ({
        goals: [
          {
            id: Math.random().toString(36).substring(7),
            title,
            targetAmount,
            currentAmount: 0 // currentAmount is technically totalSaved, but maybe they have multiple goals. For MVP we just use totalSaved globally.
          }
        ] // For MVP, we just allow 1 active goal and overwrite
      })),

      deleteGoal: (id: string) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),
    }),
    {
      name: 'submate-savings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);



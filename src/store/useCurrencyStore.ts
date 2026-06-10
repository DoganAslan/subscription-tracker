import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CurrencyState {
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      baseCurrency: 'TRY', // Default base currency
      setBaseCurrency: (currency: string) => set({ baseCurrency: currency }),
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

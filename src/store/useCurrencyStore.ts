import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorageAdapter } from '@/utils/secureStorage';

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
      storage: createJSONStorage(() => secureStorageAdapter),
    }
  )
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';
import { getMarketRatesWithDynamicCache } from '@/utils/currency';
import { getSecureData } from '@/utils/secureStorage';
import {
  clearWidgetData,
  resetWidgetSync,
  updateWidgetData,
} from '@/services/background/widgetSync';
import type { Subscription } from '@/services/firebase/types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
};

const flushWidgetSync = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

jest.mock('expo-background-fetch', () => ({
  BackgroundFetchResult: { NoData: 'no-data', NewData: 'new-data', Failed: 'failed' },
  registerTaskAsync: jest.fn(),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(),
}));

jest.mock('react-native-android-widget', () => ({ requestWidgetUpdate: jest.fn() }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@/services/firebase/config', () => ({ auth: { currentUser: null, onAuthStateChanged: jest.fn() } }));

jest.mock('@/services/firebase/firestore', () => ({ SubscriptionService: { getSubscriptions: jest.fn() } }));

jest.mock('@/widgets/SummaryWidget', () => ({ SummaryWidget: () => null }));

jest.mock('@/utils/currency', () => ({
  getMarketRatesWithDynamicCache: jest.fn(),
  SUPPORTED_CURRENCIES: [{ code: 'TRY', symbol: '₺' }, { code: 'USD', symbol: '$' }],
}));

jest.mock('@/utils/secureStorage', () => ({ getSecureData: jest.fn() }));

const makeSubscription = (): Subscription => ({
  id: 'netflix',
  name: 'Netflix',
  category: 'Entertainment',
  amount: 100,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: Timestamp.fromDate(new Date('2026-09-01T00:00:00.000Z')),
  notes: null,
  createdAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
});

describe('widgetSync production scheduling', () => {
  beforeEach(() => {
    resetWidgetSync();
    jest.mocked(getMarketRatesWithDynamicCache).mockResolvedValue({ TRY: 1, USD: 0.03, EUR: 0.027 });
    jest.mocked(getSecureData).mockResolvedValue(JSON.stringify({ state: { baseCurrency: 'TRY' } }));
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('tr');
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  afterEach(() => jest.clearAllMocks());

  it('resolves stored currency and language before deduplication', async () => {
    await updateWidgetData([makeSubscription()]);

    jest.mocked(getSecureData).mockResolvedValue(JSON.stringify({ state: { baseCurrency: 'USD' } }));
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('en');
    await updateWidgetData([makeSubscription()]);

    expect(getMarketRatesWithDynamicCache).toHaveBeenNthCalledWith(1, 'TRY');
    expect(getMarketRatesWithDynamicCache).toHaveBeenNthCalledWith(2, 'USD');
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
  });

  it('uses legacy split-member amount changes as distinct render inputs', async () => {
    const legacySubscription = (amount: number) => ({
      ...makeSubscription(),
      isSplit: true,
      splitMembers: [{
        id: 'member-a',
        name: 'Ada',
        phone: '905550000000',
        shareAmount: undefined,
        amount,
        isPaid: false,
      }],
    }) as unknown as Subscription;

    await updateWidgetData([legacySubscription(25)], 'TRY', 'tr');
    await updateWidgetData([legacySubscription(30)], 'TRY', 'tr');

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
  });

  it('replaces persisted data with a neutral widget after reset', async () => {
    await updateWidgetData([makeSubscription()], 'TRY', 'tr');
    await clearWidgetData('TRY', 'tr');

    const lastWrite = jest.mocked(AsyncStorage.setItem).mock.calls.at(-1);
    expect(lastWrite?.[0]).toBe('widget_data');
    expect(JSON.parse(lastWrite?.[1] ?? '{}')).toMatchObject({ activeCount: 0 });
  });

  it('runs an identical current-generation update after reset while old work is in flight', async () => {
    const oldRates = createDeferred<{ TRY: number; USD: number; EUR: number }>();
    jest.mocked(getMarketRatesWithDynamicCache)
      .mockImplementationOnce(() => oldRates.promise)
      .mockResolvedValueOnce({ TRY: 1, USD: 0.03, EUR: 0.027 });

    const oldUpdate = updateWidgetData([makeSubscription()], 'TRY', 'tr');
    await flushWidgetSync();
    resetWidgetSync();
    const currentUpdate = updateWidgetData([makeSubscription()], 'TRY', 'tr');
    oldRates.resolve({ TRY: 1, USD: 0.03, EUR: 0.027 });

    await expect(oldUpdate).resolves.toEqual(expect.anything());
    await expect(currentUpdate).resolves.toEqual(expect.objectContaining({ activeCount: 1 }));
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
  });

  it('drops an older stored-preference request when a newer explicit update renders first', async () => {
    const delayedStoredCurrency = createDeferred<string>();
    jest.mocked(getSecureData).mockImplementationOnce(() => delayedStoredCurrency.promise);

    const older = updateWidgetData([makeSubscription()]);
    await flushWidgetSync();
    const newer = updateWidgetData([{ ...makeSubscription(), amount: 200 }], 'USD', 'en');

    await expect(newer).resolves.toEqual(expect.objectContaining({ activeCount: 1 }));
    delayedStoredCurrency.resolve(JSON.stringify({ state: { baseCurrency: 'TRY' } }));

    await expect(older).resolves.toBeNull();
    expect(getMarketRatesWithDynamicCache).toHaveBeenCalledTimes(1);
    expect(getMarketRatesWithDynamicCache).toHaveBeenCalledWith('USD');
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('retries an identical widget snapshot after a transient production update failure', async () => {
    const transientFailure = new Error('temporary storage failure');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(transientFailure)
      .mockResolvedValueOnce();

    await expect(updateWidgetData([makeSubscription()], 'TRY', 'tr')).rejects.toBe(transientFailure);
    await expect(updateWidgetData([makeSubscription()], 'TRY', 'tr')).resolves.toEqual(
      expect.objectContaining({ activeCount: 1 }),
    );

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    expect(getMarketRatesWithDynamicCache).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });
});

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { PermissionStatus } from 'expo';
import type { ImagePickerResult, MediaLibraryPermissionResponse } from 'expo-image-picker';
import type { ImageResult } from 'expo-image-manipulator';
import {
  type ReceiptScannerDependencies,
  useReceiptScanner,
} from '@/features/subscriptions/components/subscription-form/hooks/useReceiptScanner';

jest.mock('@/services/ai/gemini', () => ({
  analyzeReceiptImage: jest.fn(),
}));

const grantedPermission: MediaLibraryPermissionResponse = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: 'never',
  accessPrivileges: 'all',
};

const deniedPermission: MediaLibraryPermissionResponse = {
  status: PermissionStatus.DENIED,
  granted: false,
  canAskAgain: true,
  expires: 'never',
  accessPrivileges: 'none',
};

const selectedImage: ImagePickerResult = {
  canceled: false,
  assets: [{ uri: 'file:///receipt.png', width: 1200, height: 1600, type: 'image' }],
};

const compressedImage: ImageResult = {
  uri: 'file:///receipt.jpg',
  width: 1200,
  height: 1600,
  base64: 'compressed-receipt',
};

const createDependencies = (
  overrides: Partial<ReceiptScannerDependencies> = {},
): ReceiptScannerDependencies => ({
  requestMediaLibraryPermissions: async () => grantedPermission,
  launchImageLibrary: async () => selectedImage,
  compressImage: async () => compressedImage,
  analyzeReceipt: async () => ({
    name: 'Netflix',
    amount: 19.99,
    currency: 'USD',
    billingCycle: 'monthly',
  }),
  ...overrides,
});

describe('useReceiptScanner', () => {
  it('returns permission-denied without starting image selection', async () => {
    const launchImageLibrary = jest.fn(async () => selectedImage);
    const dependencies = createDependencies({
      requestMediaLibraryPermissions: async () => deniedPermission,
      launchImageLibrary,
    });
    const hook = await renderHook(() => useReceiptScanner(dependencies));

    let scanResult: Awaited<ReturnType<typeof hook.result.current.scanReceipt>> | undefined;
    await act(async () => {
      scanResult = await hook.result.current.scanReceipt();
    });

    expect(scanResult).toEqual({ status: 'permission-denied' });
    expect(launchImageLibrary).not.toHaveBeenCalled();
  });

  it('returns cancelled when the image picker is dismissed', async () => {
    const hook = await renderHook(() => useReceiptScanner(createDependencies({
      launchImageLibrary: async () => ({ canceled: true, assets: null }),
    })));

    let scanResult: Awaited<ReturnType<typeof hook.result.current.scanReceipt>> | undefined;
    await act(async () => {
      scanResult = await hook.result.current.scanReceipt();
    });

    expect(scanResult).toEqual({ status: 'cancelled' });
  });

  it('returns unreadable when image compression does not provide base64 data', async () => {
    const hook = await renderHook(() => useReceiptScanner(createDependencies({
      compressImage: async () => ({ ...compressedImage, base64: undefined }),
    })));

    let scanResult: Awaited<ReturnType<typeof hook.result.current.scanReceipt>> | undefined;
    await act(async () => {
      scanResult = await hook.result.current.scanReceipt();
    });

    expect(scanResult).toEqual({ status: 'unreadable' });
  });

  it('returns a numeric receipt patch after a successful analysis', async () => {
    const hook = await renderHook(() => useReceiptScanner(createDependencies()));

    let scanResult: Awaited<ReturnType<typeof hook.result.current.scanReceipt>> | undefined;
    await act(async () => {
      scanResult = await hook.result.current.scanReceipt();
    });

    expect(scanResult).toEqual({
      status: 'success',
      patch: {
        name: 'Netflix',
        amount: 19.99,
        currency: 'USD',
        billingCycle: 'monthly',
      },
    });
  });

  it('returns unreadable when the receipt service cannot read the image', async () => {
    const hook = await renderHook(() => useReceiptScanner(createDependencies({
      analyzeReceipt: async () => null,
    })));

    let scanResult: Awaited<ReturnType<typeof hook.result.current.scanReceipt>> | undefined;
    await act(async () => {
      scanResult = await hook.result.current.scanReceipt();
    });

    expect(scanResult).toEqual({ status: 'unreadable' });
  });

  it('returns error when the injected analyzer throws', async () => {
    const hook = await renderHook(() => useReceiptScanner(createDependencies({
      analyzeReceipt: async () => {
        throw new Error('service unavailable');
      },
    })));

    let scanResult: Awaited<ReturnType<typeof hook.result.current.scanReceipt>> | undefined;
    await act(async () => {
      scanResult = await hook.result.current.scanReceipt();
    });

    expect(scanResult).toEqual({ status: 'error' });
  });

  it('cancels an older scan when a newer scan completes first', async () => {
    const pendingAnalyses: Array<(result: { name: string; amount: number; currency: string; billingCycle: 'monthly' }) => void> = [];
    const analyzeReceipt = () => new Promise<{ name: string; amount: number; currency: string; billingCycle: 'monthly' }>((resolve) => {
      pendingAnalyses.push(resolve);
    });
    const hook = await renderHook(() => useReceiptScanner(createDependencies({ analyzeReceipt })));

    let olderScan!: Promise<Awaited<ReturnType<typeof hook.result.current.scanReceipt>>>;
    await act(async () => {
      olderScan = hook.result.current.scanReceipt();
      await waitFor(() => expect(pendingAnalyses).toHaveLength(1));
    });

    let newerScan!: Promise<Awaited<ReturnType<typeof hook.result.current.scanReceipt>>>;
    await act(async () => {
      newerScan = hook.result.current.scanReceipt();
      await waitFor(() => expect(pendingAnalyses).toHaveLength(2));
    });

    await act(async () => {
      pendingAnalyses[1]({ name: 'Spotify', amount: 10.99, currency: 'EUR', billingCycle: 'monthly' });
    });
    await expect(newerScan).resolves.toEqual({
      status: 'success',
      patch: { name: 'Spotify', amount: 10.99, currency: 'EUR', billingCycle: 'monthly' },
    });

    await act(async () => {
      pendingAnalyses[0]({ name: 'Netflix', amount: 19.99, currency: 'USD', billingCycle: 'monthly' });
    });
    await expect(olderScan).resolves.toEqual({ status: 'cancelled' });
  });
});

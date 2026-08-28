import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat, type ImageResult } from 'expo-image-manipulator';
import { analyzeReceiptImage } from '@/services/ai/gemini';
import type { SubscriptionFormData } from '../../../schemas/subscription.schema';

export type ReceiptFormPatch = Partial<Pick<
  SubscriptionFormData,
  'name' | 'amount' | 'currency' | 'billingCycle'
>>;

export type ReceiptScanResult =
  | { status: 'success'; patch: ReceiptFormPatch }
  | { status: 'permission-denied' | 'cancelled' | 'unreadable' | 'error' };

export interface ReceiptScannerDependencies {
  requestMediaLibraryPermissions: () => Promise<ImagePicker.MediaLibraryPermissionResponse>;
  launchImageLibrary: (options: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>;
  compressImage: (uri: string) => Promise<ImageResult>;
  analyzeReceipt: (base64Image: string, mimeType: 'image/jpeg') => Promise<ReceiptFormPatch | null>;
}

const defaultDependencies: ReceiptScannerDependencies = {
  requestMediaLibraryPermissions: ImagePicker.requestMediaLibraryPermissionsAsync,
  launchImageLibrary: ImagePicker.launchImageLibraryAsync,
  compressImage: async (uri) => {
    const imageContext = ImageManipulator.manipulate(uri);
    imageContext.resize({ width: 1600, height: null });
    const renderedImage = await imageContext.renderAsync();
    return renderedImage.saveAsync({
      base64: true,
      compress: 0.72,
      format: SaveFormat.JPEG,
    });
  },
  analyzeReceipt: analyzeReceiptImage,
};

export const useReceiptScanner = (dependencies: ReceiptScannerDependencies = defaultDependencies) => {
  const [isScanning, setIsScanning] = useState(false);
  const requestToken = useRef(0);

  const scanReceipt = useCallback(async (): Promise<ReceiptScanResult> => {
    const token = requestToken.current + 1;
    requestToken.current = token;
    setIsScanning(true);

    const resultForCurrentRequest = (result: ReceiptScanResult): ReceiptScanResult => (
      requestToken.current === token ? result : { status: 'cancelled' }
    );

    try {
      const permission = await dependencies.requestMediaLibraryPermissions();
      if (!permission.granted) {
        return resultForCurrentRequest({ status: 'permission-denied' });
      }

      const selection = await dependencies.launchImageLibrary({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });
      if (selection.canceled || !selection.assets[0]?.uri) {
        return resultForCurrentRequest({ status: 'cancelled' });
      }

      const compressedImage = await dependencies.compressImage(selection.assets[0].uri);
      if (!compressedImage.base64) {
        return resultForCurrentRequest({ status: 'unreadable' });
      }

      const patch = await dependencies.analyzeReceipt(compressedImage.base64, 'image/jpeg');
      return resultForCurrentRequest(
        patch ? { status: 'success', patch } : { status: 'unreadable' },
      );
    } catch {
      return resultForCurrentRequest({ status: 'error' });
    } finally {
      if (requestToken.current === token) {
        setIsScanning(false);
      }
    }
  }, [dependencies]);

  return { isScanning, scanReceipt };
};

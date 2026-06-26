import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/useAuthStore';
import { SubscriptionService } from '@/services/firebase/firestore';
import { resyncAllReminders } from '@/services/notificationService';
import { sanitizeTextInput, sanitizePriceInput } from '@/utils/sanitizers';
import { Timestamp } from 'firebase/firestore';

export const exportData = async (): Promise<boolean> => {
  const user = useAuthStore.getState().user;
  if (!user?.uid) return false;

  try {
    const subscriptions = await SubscriptionService.getSubscriptions(user.uid);
    const payload = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      data: subscriptions
    };

    const payloadString = JSON.stringify(payload, null, 2);

    if (Platform.OS === 'web') {
      const blob = new Blob([payloadString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'submate_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } else {
      const fileUri = `${FileSystem.documentDirectory}submate_backup.json`;
      await FileSystem.writeAsStringAsync(fileUri, payloadString, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error("Export Failed:", error);
    return false;
  }
};

export const importData = async (fileDataString: string): Promise<boolean> => {
  const user = useAuthStore.getState().user;
  if (!user?.uid) return false;

  try {
    const parsed = JSON.parse(fileDataString);
    if (parsed.version !== "2.0" || !Array.isArray(parsed.data)) {
      return false;
    }

    const sanitizedData = parsed.data.map((item: any) => {
      // Safely parse Firestore timestamps if they were stringified as objects
      let parsedRenewalDate = item.renewalDate;
      if (item.renewalDate && item.renewalDate.seconds) {
        parsedRenewalDate = new Timestamp(item.renewalDate.seconds, item.renewalDate.nanoseconds || 0);
      } else if (typeof item.renewalDate === 'string') {
        parsedRenewalDate = Timestamp.fromDate(new Date(item.renewalDate));
      }

      let parsedTrialDate = item.trialEndDate;
      if (item.trialEndDate && item.trialEndDate.seconds) {
        parsedTrialDate = new Timestamp(item.trialEndDate.seconds, item.trialEndDate.nanoseconds || 0);
      } else if (typeof item.trialEndDate === 'string') {
        parsedTrialDate = Timestamp.fromDate(new Date(item.trialEndDate));
      }

      return {
        ...item,
        name: sanitizeTextInput(item.name || ''),
        amount: Number(sanitizePriceInput(String(item.amount || '0'))) || 0,
        renewalDate: parsedRenewalDate,
        trialEndDate: parsedTrialDate,
        id: undefined, // Let Firestore assign new IDs
        createdAt: undefined, // Let Firestore assign timestamps
        updatedAt: undefined
      };
    });

    // Clear existing storage completely
    const existing = await SubscriptionService.getSubscriptions(user.uid);
    for (const sub of existing) {
      if (sub.id) {
        await SubscriptionService.deleteSubscription(user.uid, sub.id);
      }
    }

    const newSavedData = [];
    // Save newly sanitized items
    for (const sub of sanitizedData) {
      const { id, createdAt, updatedAt, ...payload } = sub;
      // Clean undefined to prevent Firestore crash
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
      
      const docId = await SubscriptionService.addSubscription(user.uid, payload);
      newSavedData.push({ ...payload, id: docId });
    }

    // Notification Sync
    await resyncAllReminders(newSavedData);

    return true;
  } catch (error) {
    console.error("Import Failed:", error);
    return false; // Return false immediately (no crashes!)
  }
};

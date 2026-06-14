import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { Subscription } from '@/services/firebase/types';

export const exportSubscriptionsToCSV = async (subscriptions: Subscription[]) => {
  try {
    if (!subscriptions || subscriptions.length === 0) {
      Alert.alert('No Data', 'You have no subscriptions to export.');
      return;
    }

    // CSV Headers
    const headers = ['Name', 'Amount', 'Currency', 'Billing Cycle', 'Category', 'Renewal Date', 'Status'];
    
    // Format rows
    const rows = subscriptions.map(sub => {
      const renewalDate = sub.renewalDate.toDate().toLocaleDateString();
      // Wrap strings with commas in quotes
      const safeName = `"${sub.name.replace(/"/g, '""')}"`;
      return [
        safeName,
        sub.amount.toFixed(2),
        sub.currency || 'USD',
        sub.billingCycle,
        sub.category,
        renewalDate,
        sub.status
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const fileName = 'SubMate_Report.csv';

    if (Platform.OS === 'web') {
      // Web fallback (download)
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Native logic
    // Define file path
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Write to file system
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      return;
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Subscriptions Data',
      UTI: 'public.comma-separated-values-text', // iOS specific
    });
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    Alert.alert('Export Failed', 'An error occurred while exporting your data.');
  }
};

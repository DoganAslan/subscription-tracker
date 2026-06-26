import i18n from '@/locales/i18n';
// src/utils/export.ts
import { Platform, Share, Alert } from 'react-native';
import { calculateMonthlyCosts } from './calculations'; 

export const exportSubscriptionsToCSV = async (subscriptions: any[], activeCurrency: string) => {
  if (!subscriptions || subscriptions.length === 0) {
    Alert.alert(i18n.t('global.exportError'), i18n.t('global.noSubscriptionDataAv'));
    return;
  }

  // 1. Define CSV Headers
  const headers = ['Subscription Name', 'Price', 'Currency', 'Billing Cycle', 'Category', 'Monthly Net Cost (' + activeCurrency + ')', 'Is Paused', 'Is Split'];
  
  // 2. Build Rows Datastream
  const rows = subscriptions.map(sub => {
    const calculated = calculateMonthlyCosts(sub, activeCurrency);
    
    return [
      `"${sub.name.replace(/"/g, '""')}"`, // Escape quotes
      sub.price || sub.amount,
      sub.currency,
      sub.billingCycle || 'Monthly',
      sub.category || 'Uncategorized',
      calculated.net.toFixed(2),
      sub.isPaused ? 'YES' : 'NO',
      sub.isSplit ? 'YES' : 'NO'
    ].join(',');
  });

  // Combine headers and rows with standard line breaks
  const csvContent = [headers.join(','), ...rows].join('\n');

  // 3. Platform-Specific Execution
  if (Platform.OS === 'web') {
    // WEB FALLBACK: Generate an in-memory browser Blob and trigger an instantaneous file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `SubMate_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("CSV File Downloaded Successfully on Web Browser!");
  } else {
    // NATIVE iOS/ANDROID: Route the raw CSV payload directly into the Native Share Sheet
    try {
      await Share.share({
        message: csvContent,
        title: 'SubMate Data Export',
      });
    } catch (error: any) {
      console.error("Export Share Failure:", error.message);
    }
  }
};

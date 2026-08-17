// src/utils/reportExporter.ts
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export interface SubscriptionReportItem {
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: string;
  status: string;
  monthlyCostTry?: number;
  linkedCard?: string;
  notes?: string | null;
}

export function generateCsvContent(subscriptions: SubscriptionReportItem[], baseCurrency: string = 'TRY'): string {
  const headers = ['Subscription Name', 'Category', 'Amount', 'Currency', 'Billing Cycle', 'Status', `Est. Monthly (${baseCurrency})`, 'Notes'];
  
  const rows = subscriptions.map(sub => [
    `"${(sub.name || '').replace(/"/g, '""')}"`,
    `"${(sub.category || '').replace(/"/g, '""')}"`,
    sub.amount || 0,
    `"${sub.currency || 'TRY'}"`,
    `"${sub.billingCycle || 'monthly'}"`,
    `"${sub.status || 'active'}"`,
    (sub.monthlyCostTry || sub.amount || 0).toFixed(2),
    `"${(sub.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function exportCsvReport(subscriptions: SubscriptionReportItem[], baseCurrency: string = 'TRY'): Promise<boolean> {
  const csvText = generateCsvContent(subscriptions, baseCurrency);
  const fileName = `SubMate_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (e) {
      console.error('Web CSV download error:', e);
      return false;
    }
  } else {
    try {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvText, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export SubMate Financial Report (CSV)',
          UTI: 'public.comma-separated-values-text',
        });
      }
      return true;
    } catch (error) {
      console.error('Mobile CSV export error:', error);
      return false;
    }
  }
}

export function generateHtmlReport(subscriptions: SubscriptionReportItem[], totalMonthly: number, baseCurrency: string = 'TRY'): string {
  const dateStr = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalAnnual = totalMonthly * 12;

  const rowsHtml = subscriptions.map((sub, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
      <td style="padding: 12px; font-weight: 700; color: #1E293B;">${sub.name}</td>
      <td style="padding: 12px; color: #64748B;">${sub.category}</td>
      <td style="padding: 12px; font-weight: 700; color: #2563EB;">${sub.amount} ${sub.currency}</td>
      <td style="padding: 12px; color: #64748B; text-transform: capitalize;">${sub.billingCycle}</td>
      <td style="padding: 12px;">
        <span style="background-color: ${sub.status === 'paused' ? '#FEF3C7' : '#D1FAE5'}; color: ${sub.status === 'paused' ? '#D97706' : '#059669'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
          ${sub.status === 'paused' ? 'Paused' : 'Active'}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>SubMate Executive Financial Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; margin: 0; padding: 30px; background-color: #FFFFFF; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 900; color: #2563EB; }
          .subtitle { font-size: 14px; color: #64748B; margin-top: 4px; }
          .metrics-grid { display: flex; gap: 16px; margin-bottom: 24px; }
          .metric-card { flex: 1; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
          .metric-label { font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase; }
          .metric-val { font-size: 22px; font-weight: 900; color: #2563EB; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; }
          th { background-color: #F1F5F9; color: #475569; padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SubMate 🛡️</div>
            <div class="subtitle">Executive Subscription Financial Audit</div>
          </div>
          <div style="text-align: right; font-size: 13px; color: #64748B;">
            <div>Report Date: ${dateStr}</div>
            <div>Total Tracked: ${subscriptions.length} Subscriptions</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Estimated Monthly Outflow</div>
            <div class="metric-val">${totalMonthly.toFixed(2)} ${baseCurrency}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Estimated Annual Outflow</div>
            <div class="metric-val" style="color: #10B981;">${totalAnnual.toFixed(2)} ${baseCurrency}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subscription</th>
              <th>Category</th>
              <th>Price</th>
              <th>Cycle</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by SubMate • Zero-Cloud Data Sovereignty Engine
        </div>
      </body>
    </html>
  `;
}

import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export interface TrialShieldItem {
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  trialEndDate: Date;
  daysLeft: number;
  hoursLeft: number;
  riskLevel: 'urgent_24h' | 'warning_3d' | 'safe';
  virtualCardShieldActive: boolean;
  recommendation: string;
}

export interface TrialShieldSummary {
  activeTrialsCount: number;
  urgentTrialsCount: number;
  totalPostTrialRiskAmount: number;
  items: TrialShieldItem[];
}

export function analyzeTrialShield(
  subscriptions: Subscription[],
  baseCurrency: string = 'USD'
): TrialShieldSummary {
  const now = new Date();
  const trialSubs = subscriptions.filter(s => s.isTrial && s.status !== 'paused');

  const items: TrialShieldItem[] = [];
  let urgentCount = 0;
  let totalRisk = 0;

  for (const sub of trialSubs) {
    let endDate: Date;
    if (sub.trialEndDate) {
      endDate = typeof (sub.trialEndDate as any)?.toDate === 'function'
        ? (sub.trialEndDate as any).toDate()
        : new Date(sub.trialEndDate as any);
    } else if (sub.renewalDate) {
      endDate = typeof (sub.renewalDate as any)?.toDate === 'function'
        ? (sub.renewalDate as any).toDate()
        : new Date(sub.renewalDate as any);
    } else {
      endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const diffMs = endDate.getTime() - now.getTime();
    const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let riskLevel: 'urgent_24h' | 'warning_3d' | 'safe' = 'safe';
    if (hoursLeft <= 24) {
      riskLevel = 'urgent_24h';
      urgentCount++;
    } else if (daysLeft <= 3) {
      riskLevel = 'warning_3d';
    }

    const converted = convertCurrency(sub.amount, sub.currency || 'USD', baseCurrency);
    totalRisk += converted;

    let recommendation = '';
    if (riskLevel === 'urgent_24h') {
      recommendation = `⚠️ Son ${hoursLeft} saat! Otomatik ücret kesilmeden dondurun veya sanal kart takın.`;
    } else if (riskLevel === 'warning_3d') {
      recommendation = `⏳ Deneme süresinin bitmesine ${daysLeft} gün kaldı. İptal takvimini kontrol edin.`;
    } else {
      recommendation = `🛡️ Deneme süresi aktif (${daysLeft} gün kaldı). Sanal kart kalkanı önerilir.`;
    }

    items.push({
      subscriptionId: sub.id || '',
      subscriptionName: sub.name,
      amount: sub.amount,
      currency: sub.currency || 'USD',
      convertedAmount: converted,
      trialEndDate: endDate,
      daysLeft,
      hoursLeft,
      riskLevel,
      virtualCardShieldActive: !!sub.cardId,
      recommendation,
    });
  }

  // Sort urgent trials first
  items.sort((a, b) => a.hoursLeft - b.hoursLeft);

  return {
    activeTrialsCount: items.length,
    urgentTrialsCount: urgentCount,
    totalPostTrialRiskAmount: totalRisk,
    items,
  };
}

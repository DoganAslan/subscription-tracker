import { Subscription } from '../services/firebase/types';
import { t } from '@/locales/i18n';

export interface HealthReport {
  score: number;
  statusTitle: string;
  colorTheme: '#10B981' | '#F59E0B' | '#EF4444'; // Emerald, Amber, Crimson
  insights: string[];
  vampireStats?: { category: string; count: number };
}

export const analyzeFinancialHealth = (subs: Subscription[] = []): HealthReport => {
  const hs = (t as any).healthScore || {};

  if (subs.length === 0) {
    return { 
      score: 100, 
      statusTitle: hs.cleanWallet || 'Clean Wallet', 
      colorTheme: '#10B981', 
      insights: [hs.noSubsYet || 'No subscription burden being monitored yet.'] 
    };
  }

  let currentScore = 100;
  const warnings: string[] = [];

  // Rule 1: Duplicate Category Detection (-15 pts)
  const categoryCounts: Record<string, number> = {};
  let vampireStats: { category: string; count: number } | undefined;
  
  subs.forEach(s => { categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1; });
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count >= 2) {
      currentScore -= 15;
      if (!vampireStats) vampireStats = { category: cat, count };
      const msg = typeof hs.vampirWarning === 'function' 
        ? hs.vampirWarning(cat, count)
        : `Vampire Alert: There are ${count} subscriptions in "${cat}". Consider canceling one.`;
      warnings.push(msg);
    }
  });

  // Rule 2: Payment Date Clashing (-10 pts)
  const dateCounts: Record<string, number> = {};
  subs.forEach(s => {
    const dt = new Date(s.paymentDate || s.renewalDate?.toDate() || Date.now());
    const day = dt.getDate();
    dateCounts[day] = (dateCounts[day] || 0) + 1;
  });
  Object.entries(dateCounts).forEach(([day, count]) => {
    if (count >= 3) {
      currentScore -= 10;
      warnings.push(hs.cashSqueeze ? hs.cashSqueeze.replace('{{day}}', day).replace('{{count}}', count) : `Cash Squeeze: ${count} payments clustered on day ${day}.`);
    }
  });

  // Rule 3: Forgotten Free Trials (-20 pts)
  const riskyTrials = subs.filter(s => s.isTrial);
  if (riskyTrials.length > 0) {
    currentScore -= 20;
    warnings.push(hs.trialDanger ? hs.trialDanger.replace('{{count}}', riskyTrials.length) : `Danger: ${riskyTrials.length} active free trial(s). Cancel before charged.`);
  }

  const finalScore = Math.max(15, Math.min(100, currentScore));

  let statusTitle = hs.excellent || 'Excellent Budget';
  let colorTheme: '#10B981' | '#F59E0B' | '#EF4444' = '#10B981';

  if (finalScore < 50) {
    statusTitle = hs.bleeding || '🚨 Budget Bleeding!'; colorTheme = '#EF4444';
  } else if (finalScore < 80) {
    statusTitle = hs.requiresAttention || '⚠️ Needs Attention'; colorTheme = '#F59E0B';
  }

  if (warnings.length === 0) {
    warnings.push(hs.allGood || 'Great! Your subscription budget is under control.');
  }

  return { score: finalScore, statusTitle, colorTheme, insights: warnings.slice(0, 3), vampireStats };
};


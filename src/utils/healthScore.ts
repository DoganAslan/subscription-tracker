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
  if (subs.length === 0) {
    return { score: 100, statusTitle: 'Tertemiz Cüzdan', colorTheme: '#10B981', insights: ['Henüz takip edilen bir abonelik yükü yok.'] };
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
      warnings.push(`Vampir Uyarısı: "${cat}" kategorisinde ${count} farklı abonelik var. Birini eleyerek tasarruf edebilirsin.`);
    }
  });

  // Rule 2: Payment Date Clashing (-10 pts)
  const dateCounts: Record<string, number> = {};
  subs.forEach(s => {
    // If paymentDate is stored as an ISO string or a timestamp
    const dt = new Date(s.paymentDate || s.renewalDate?.toDate() || Date.now());
    const day = dt.getDate();
    dateCounts[day] = (dateCounts[day] || 0) + 1;
  });
  Object.entries(dateCounts).forEach(([day, count]) => {
    if (count >= 3) {
      currentScore -= 10;
      warnings.push(`Nakit Sıkışması: Her ayın ${day}. gününe ${count} ödeme yığılmış.`);
    }
  });

  // Rule 3: Forgotten Free Trials (-20 pts)
  const riskyTrials = subs.filter(s => s.isTrial);
  if (riskyTrials.length > 0) {
    currentScore -= 20;
    warnings.push(`Tehlike: Aktif ${riskyTrials.length} deneme sürümün var. Kesinti tarihi gelmeden iptal etmeyi unutma.`);
  }

  // Clamp score strictly between 15 and 100
  const finalScore = Math.max(15, Math.min(100, currentScore));

  let statusTitle = 'Mükemmel Bütçe';
  let colorTheme: '#10B981' | '#F59E0B' | '#EF4444' = '#10B981';

  if (finalScore < 50) {
    statusTitle = '🚨 Bütçe Kanıyor!'; colorTheme = '#EF4444';
  } else if (finalScore < 80) {
    statusTitle = '⚠️ Dikkat Gerektiriyor'; colorTheme = '#F59E0B';
  }

  if (warnings.length === 0) {
    warnings.push('Harika! Abonelik bütçen tam kontrol altında, gereksiz sızıntı yok.');
  }

  return { score: finalScore, statusTitle, colorTheme, insights: warnings.slice(0, 3), vampireStats };
};

// src/services/ai/aiHealthScore.ts
import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export interface AiHealthScoreAnalysis {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  statusTitle: string;
  statusColor: string;
  topAdvice: string[];
}

export function calculateAiFinancialHealthScore(
  subscriptions: Subscription[],
  baseCurrency: string = 'TRY',
  isTurkish: boolean = true
): AiHealthScoreAnalysis {
  const activeSubs = subscriptions ? subscriptions.filter(s => s.status !== 'paused') : [];
  const totalActive = activeSubs.length;

  let totalMonthly = 0;
  activeSubs.forEach(s => {
    totalMonthly += convertCurrency(s.amount || 0, s.currency || 'TRY', baseCurrency);
  });

  let score = 100;
  const advice: string[] = [];

  // Deductions
  if (totalActive > 10) {
    score -= 25;
    advice.push(isTurkish ? 'Aktif abonelik sayınız 10’un üzerinde. Kullanılmayan 2-3 servisi dondurabilirsiniz.' : 'Active subscription count exceeds 10. Consider pausing 2-3 items.');
  } else if (totalActive > 6) {
    score -= 10;
  }

  if (totalMonthly > 2500) {
    score -= 20;
    advice.push(isTurkish ? `Aylık toplam harcamanız ${totalMonthly.toFixed(0)} ${baseCurrency}. Yıllık planlarla maliyeti düşürebilirsiniz.` : `Monthly spend is heavy. Switch to annual plans to cut costs.`);
  }

  const pausedCount = subscriptions ? subscriptions.filter(s => s.status === 'paused').length : 0;
  if (pausedCount >= 1) {
    score += 5;
    advice.push(isTurkish ? 'Tebrikler! Kullanmadığınız en az 1 aboneliği duraklatarak tasarruf yaptınız.' : 'Great job! You saved money by pausing at least 1 subscription.');
  } else {
    advice.push(isTurkish ? 'Kullanmadığınız yayın servislerini 1’er ay duraklatmayı deneyin.' : 'Try rotating or pausing unused streaming apps.');
  }

  score = Math.max(20, Math.min(100, score));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  let statusTitle = isTurkish ? 'İyi Bütçe Sağlığı' : 'Good Budget Health';
  let statusColor = '#3B82F6';

  if (score >= 90) {
    grade = 'A+';
    statusTitle = isTurkish ? 'Mükemmel Bütçe Disiplini 🛡️' : 'Excellent Budget Discipline 🛡️';
    statusColor = '#10B981';
  } else if (score >= 75) {
    grade = 'A';
    statusTitle = isTurkish ? 'Sağlıklı Portföy 🍏' : 'Healthy Portfolio 🍏';
    statusColor = '#10B981';
  } else if (score >= 60) {
    grade = 'B';
    statusTitle = isTurkish ? 'Dengeli Harcama ⚖️' : 'Balanced Spending ⚖️';
    statusColor = '#F59E0B';
  } else {
    grade = 'C';
    statusTitle = isTurkish ? 'Bütçe Yükü Yüksek ⚠️' : 'Heavy Budget Burden ⚠️';
    statusColor = '#EF4444';
  }

  return {
    score,
    grade,
    statusTitle,
    statusColor,
    topAdvice: advice.slice(0, 3),
  };
}

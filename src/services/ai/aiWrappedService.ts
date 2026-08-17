import { Subscription } from '@/services/firebase/types';
import { convertCurrency } from '@/utils/currency';

export interface WrappedMetrics {
  year: number;
  totalAnnualSpent: number;
  monthlyAverage: number;
  activeCount: number;
  topCategoryName: string;
  topCategoryAmount: number;
  mostExpensiveSubName: string;
  mostExpensiveSubAmount: number;
  estimatedAnnualSavings: number;
  personaTitle: string;
  personaDescription: string;
}

export function calculateSubmateWrapped(
  subscriptions: Subscription[],
  baseCurrency: string = 'USD'
): WrappedMetrics {
  const currentYear = new Date().getFullYear();
  const activeSubs = subscriptions.filter(s => s.status !== 'paused');

  let totalAnnualSpent = 0;
  let mostExpensiveName = 'N/A';
  let mostExpensiveAmount = 0;

  const categoryTotals: Record<string, number> = {};

  for (const sub of activeSubs) {
    let multiplier = 12; // monthly
    if (sub.billingCycle === 'weekly') multiplier = 52;
    else if (sub.billingCycle === 'quarterly') multiplier = 4;
    else if (sub.billingCycle === 'yearly') multiplier = 1;

    const yearlyCost = convertCurrency(sub.amount * multiplier, sub.currency || 'USD', baseCurrency);
    totalAnnualSpent += yearlyCost;

    if (yearlyCost > mostExpensiveAmount) {
      mostExpensiveAmount = yearlyCost;
      mostExpensiveName = sub.name;
    }

    const cat = sub.category || 'Diğer';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + yearlyCost;
  }

  let topCategoryName = 'Diğer';
  let topCategoryAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategoryName = cat;
    }
  }

  const estimatedSavings = totalAnnualSpent * 0.18; // ~18% AI optimization savings
  const monthlyAverage = activeSubs.length > 0 ? totalAnnualSpent / 12 : 0;

  let personaTitle = 'Bilge Tasarrufçu';
  let personaDescription = 'Aboneliklerini titizlikle yönetiyor, bütçeni kontrol altında tutuyorsun!';
  if (activeSubs.length >= 8) {
    personaTitle = 'Dijital Medya Tutkunu';
    personaDescription = 'Geniş bir servis yelpazesine sahipsin! YZ asistanınla optimizasyon yapabilirsin.';
  } else if (activeSubs.length <= 2) {
    personaTitle = 'Minimalist Gurme';
    personaDescription = 'Sadece en ihtiyaç duyduğun servisleri seçiyor, bütçeni koruyorsun.';
  }

  return {
    year: currentYear,
    totalAnnualSpent: Math.round(totalAnnualSpent),
    monthlyAverage: Math.round(monthlyAverage),
    activeCount: activeSubs.length,
    topCategoryName,
    topCategoryAmount: Math.round(topCategoryAmount),
    mostExpensiveSubName: mostExpensiveName,
    mostExpensiveSubAmount: Math.round(mostExpensiveAmount),
    estimatedAnnualSavings: Math.round(estimatedSavings),
    personaTitle,
    personaDescription,
  };
}

import { convertCurrency } from './currency';

const safeFinancialRound = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateMonthlyCosts = (sub: any, activeCurrency: string) => {
  // 1. If paused, it contributes 0 to active cashflow
  if (sub.isPaused) return { gross: 0, net: 0 };

  // 2. Base Conversion (with strict fallback)
  const rawPrice = parseFloat(String(sub.price || sub.amount)) || 0;
  let convertedPrice = convertCurrency(rawPrice, sub.currency || 'TRY', activeCurrency);
  
  // Guard against missing or 0 currency rates (NaN / Infinity)
  if (isNaN(convertedPrice) || !isFinite(convertedPrice)) {
    convertedPrice = rawPrice; // fallback safely
  }
  
  let grossMonthly = safeFinancialRound(convertedPrice);

  // 3. Cycle Normalization (Normalized mathematically to absorb IEEE 754 precision drifts)
  const cycle = String(sub.billingCycle || sub.cycle || sub.period || 'monthly').toLowerCase();
  if (cycle.includes('year') || cycle.includes('annual')) {
    grossMonthly = safeFinancialRound(grossMonthly / 12);
  } else if (cycle.includes('week')) {
    grossMonthly = safeFinancialRound(grossMonthly * 4.333);
  }

  // 4. Split Deductions
  let netMonthly = grossMonthly;
  if (sub.isSplit) {
    const participants = Array.isArray(sub.splitParticipants) ? sub.splitParticipants : [];
    // Guard against isSplit === true division errors mathematically
    const validParticipantCount = Math.max(1, participants.length); 
    
    if (validParticipantCount > 0) {
      participants.forEach((p: any) => {
        const friendShare = parseFloat(String(p.amount).replace(/[^0-9.]/g, '')) || 0;
        let convertedShare = convertCurrency(friendShare, sub.currency || 'TRY', activeCurrency);
        
        if (isNaN(convertedShare) || !isFinite(convertedShare)) {
          convertedShare = friendShare;
        }
        
        // Normalize the friend's share identically to parent
        if (cycle.includes('year') || cycle.includes('annual')) {
          convertedShare = safeFinancialRound(convertedShare / 12);
        } else if (cycle.includes('week')) {
          convertedShare = safeFinancialRound(convertedShare * 4.333);
        } else {
          convertedShare = safeFinancialRound(convertedShare);
        }

        // Subtract securely
        netMonthly = safeFinancialRound(netMonthly - convertedShare);
      });
    }
  }

  // 5. Residuals Absorbed (Final validation bounds check)
  return { 
    gross: Math.max(0, safeFinancialRound(grossMonthly)), 
    net: Math.max(0, safeFinancialRound(netMonthly)) 
  };
};

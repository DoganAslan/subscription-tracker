import { convertCurrency } from './currency';

const safeFinancialRound = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateMonthlyCosts = (sub: any, activeCurrency: string) => {
  // 1. If paused, it contributes 0 to active cashflow
  if (sub.isPaused || sub.status === 'paused') return { gross: 0, net: 0 };

  // 2. Base Conversion (Prioritize sub.amount over sub.price to prevent multiplied values)
  const rawAmount = sub.amount !== undefined && sub.amount !== null 
    ? parseFloat(String(sub.amount)) 
    : parseFloat(String(sub.price || 0));
  
  const safeAmount = isNaN(rawAmount) ? 0 : rawAmount;
  const subCurrency = sub.currency || 'USD';

  let convertedPrice = convertCurrency(safeAmount, subCurrency, activeCurrency);
  
  // Guard against missing or 0 currency rates (NaN / Infinity)
  if (isNaN(convertedPrice) || !isFinite(convertedPrice)) {
    convertedPrice = safeAmount; // fallback safely
  }
  
  let grossMonthly = safeFinancialRound(convertedPrice);

  // 3. Cycle Normalization
  const cycle = String(sub.billingCycle || sub.cycle || sub.period || 'monthly').toLowerCase();
  if (cycle.includes('year') || cycle.includes('annual')) {
    grossMonthly = safeFinancialRound(grossMonthly / 12);
  } else if (cycle.includes('week')) {
    grossMonthly = safeFinancialRound(grossMonthly * (52 / 12));
  } else if (cycle.includes('quarter')) {
    grossMonthly = safeFinancialRound(grossMonthly / 3);
  } else if (cycle.includes('biannual')) {
    grossMonthly = safeFinancialRound(grossMonthly / 6);
  }

  // 4. Split Deductions
  let netMonthly = grossMonthly;
  if (sub.isSplit) {
    const participants = Array.isArray(sub.splitMembers) && sub.splitMembers.length > 0 
      ? sub.splitMembers 
      : Array.isArray(sub.splitParticipants) ? sub.splitParticipants : [];
    
    const validParticipantCount = Math.max(1, participants.length); 
    
    if (validParticipantCount > 0) {
      participants.forEach((p: any) => {
        const friendShare = parseFloat(String(p.shareAmount || p.amount || 0).replace(/[^0-9.]/g, '')) || 0;
        let convertedShare = convertCurrency(friendShare, subCurrency, activeCurrency);
        
        if (isNaN(convertedShare) || !isFinite(convertedShare)) {
          convertedShare = friendShare;
        }
        
        if (cycle.includes('year') || cycle.includes('annual')) {
          convertedShare = safeFinancialRound(convertedShare / 12);
        } else if (cycle.includes('week')) {
          convertedShare = safeFinancialRound(convertedShare * (52 / 12));
        } else if (cycle.includes('quarter')) {
          convertedShare = safeFinancialRound(convertedShare / 3);
        } else {
          convertedShare = safeFinancialRound(convertedShare);
        }

        netMonthly = safeFinancialRound(netMonthly - convertedShare);
      });
    }
  }

  return { 
    gross: Math.max(0, safeFinancialRound(grossMonthly)), 
    net: Math.max(0, safeFinancialRound(netMonthly)) 
  };
};


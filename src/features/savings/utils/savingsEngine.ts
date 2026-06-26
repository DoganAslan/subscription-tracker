export interface SavingsTip {
  potentialSavings: number;
  message: string;
}

export function getSavingsTip(name: string, price: number, currency: string): SavingsTip | null {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('dropbox') && price > 150) {
    return {
      potentialSavings: price - 59.99,
      message: `Switching to Google One or iCloud Drive could save you up to ${(price - 59.99).toFixed(2)} ${currency}/mo for similar storage tiers.`
    };
  }

  if (nameLower.includes('spotify') && price >= 60) {
    return {
      potentialSavings: price - 30,
      message: `Are you a student? Verifying your university status on Spotify cuts your premium bill by 50%!`
    };
  }

  // Additional robust rules...
  if (nameLower.includes('netflix') && price > 200) {
    return {
      potentialSavings: price - 119.99,
      message: `Downgrading from 4K to the Standard Netflix plan could save you ${(price - 119.99).toFixed(2)} ${currency}/mo.`
    };
  }

  return null;
}
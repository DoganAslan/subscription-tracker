export const CANCELLATION_MATRIX: Record<string, string> = {
  netflix: 'https://www.netflix.com/youraccount',
  spotify: 'https://www.spotify.com/account/overview/',
  chatgpt: 'https://chatgpt.com/#settings/subscription',
  amazon: 'https://www.amazon.com/mc/manage',
  prime: 'https://www.amazon.com/mc/manage',
  apple: 'https://buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/manageSubscriptions',
  google: 'https://play.google.com/store/account/subscriptions',
  youtube: 'https://www.youtube.com/paid_memberships',
  disney: 'https://www.disneyplus.com/account/subscription',
  hulu: 'https://secure.hulu.com/account',
  hbo: 'https://play.max.com/account',
  max: 'https://play.max.com/account',
};

export function getCancellationLink(subscriptionName: string): string {
  const normalized = subscriptionName.toLowerCase().replace(/\s+/g, '');
  
  // Exact match or substring match
  for (const [key, url] of Object.entries(CANCELLATION_MATRIX)) {
    if (normalized.includes(key)) {
      return url;
    }
  }

  // Fallback to Google Search
  return `https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(subscriptionName)}+subscription`;
}

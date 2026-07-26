export const CANCEL_LINKS_DB: Record<string, string> = {
  'netflix': 'https://www.netflix.com/cancelplan',
  'spotify': 'https://www.spotify.com/account/cancel/',
  'amazon': 'https://www.amazon.com/mc/pipelines/cancellation/v2',
  'amazon prime': 'https://www.amazon.com/mc/pipelines/cancellation/v2',
  'youtube': 'https://www.youtube.com/paid_memberships',
  'youtube premium': 'https://www.youtube.com/paid_memberships',
  'apple music': 'https://music.apple.com/account/settings',
  'apple tv': 'https://tv.apple.com/settings',
  'disney': 'https://www.disneyplus.com/account/cancel-subscription',
  'disney+': 'https://www.disneyplus.com/account/cancel-subscription',
  'hulu': 'https://secure.hulu.com/account/cancel',
  'hbo max': 'https://auth.max.com/subscription',
  'max': 'https://auth.max.com/subscription',
  'chatgpt': 'https://chatgpt.com/#settings/Subscription',
  'claude': 'https://console.anthropic.com/settings/billing',
  'adobe': 'https://account.adobe.com/plans',
  'canva': 'https://www.canva.com/settings/billing',
  'notion': 'https://www.notion.so/my-settings/billing',
  'github': 'https://github.com/settings/billing',
  'google one': 'https://one.google.com/settings/cancel',
  'icloud': 'https://www.icloud.com/settings/',
  'xbox': 'https://account.microsoft.com/services',
  'playstation': 'https://store.playstation.com/en-us/subscriptions',
  'ps plus': 'https://store.playstation.com/en-us/subscriptions',
  'exxen': 'https://www.exxen.com/tr/profile/membership',
  'blutv': 'https://www.blutv.com/uyelik-iptali',
  'gain': 'https://www.gain.tv/hesabim',
  'mubi': 'https://mubi.com/settings/subscription',
  'strava': 'https://www.strava.com/settings/billing',
  'duolingo': 'https://www.duolingo.com/settings/super',
};

/**
 * Returns the exact cancellation URL if known, 
 * otherwise generates a smart Google search URL for instructions.
 */
export const getCancelUrl = (subscriptionName: string | undefined): string => {
  if (!subscriptionName) return 'https://www.google.com/search?q=how+to+cancel+a+subscription';
  
  const query = subscriptionName.toLowerCase().trim();
  
  // Try exact match first
  if (CANCEL_LINKS_DB[query]) {
    return CANCEL_LINKS_DB[query];
  }
  
  // Try partial match
  for (const [key, url] of Object.entries(CANCEL_LINKS_DB)) {
    if (query.includes(key)) {
      return url;
    }
  }

  // Fallback to Google Search
  const encodedName = encodeURIComponent(subscriptionName);
  return `https://www.google.com/search?q=how+to+cancel+${encodedName}+subscription`;
};




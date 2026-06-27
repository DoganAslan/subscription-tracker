export const CANCELLATION_URLS: Record<string, string> = {
  'netflix': 'https://www.netflix.com/cancelplan',
  'spotify': 'https://www.spotify.com/account/cancel/',
  'adobe cc': 'https://account.adobe.com/plans',
  'youtube premium': 'https://www.youtube.com/paid_memberships',
  'disney+': 'https://www.disneyplus.com/account/subscription',
  'xbox game pass': 'https://account.microsoft.com/services',
  'apple music': 'https://music.apple.com/account/settings',
  'chatgpt': 'https://chat.openai.com/account',
  'amazon prime': 'https://www.amazon.com/mc/pipelines/cancellation',
};

export const getCancellationLink = (name: string): string | null => {
  if (!name) return null;
  const normalizedName = name.toLowerCase().trim();
  
  // Exact match
  if (CANCELLATION_URLS[normalizedName]) return CANCELLATION_URLS[normalizedName];
  
  // Partial match (e.g., "Netflix Premium" -> matches "netflix")
  for (const [key, url] of Object.entries(CANCELLATION_URLS)) {
    if (normalizedName.includes(key)) return url;
  }
  
  return null; // Return null if the service is unknown
};

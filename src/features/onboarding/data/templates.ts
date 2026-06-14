export interface SubscriptionTemplate {
  id: string;
  name: string;
  category: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
}

export const subscriptionTemplates: Record<string, SubscriptionTemplate[]> = {
  "Streaming": [
    { id: 'netflix', name: 'Netflix', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'disney', name: 'Disney+', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'yt_premium', name: 'YouTube Premium', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'amazon_prime', name: 'Amazon Prime Video', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'max', name: 'Max', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'hulu', name: 'Hulu', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'crunchyroll', name: 'Crunchyroll', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'exxen', name: 'Exxen', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'blutv', name: 'BluTV', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'mubi', name: 'MUBI', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'gain', name: 'GAİN', category: 'Entertainment', billingCycle: 'monthly' },
  ],
  "Music & Audio": [
    { id: 'spotify', name: 'Spotify', category: 'Music & Audio', billingCycle: 'monthly' },
    { id: 'apple_music', name: 'Apple Music', category: 'Music & Audio', billingCycle: 'monthly' },
    { id: 'yt_music', name: 'YouTube Music', category: 'Music & Audio', billingCycle: 'monthly' },
    { id: 'tidal', name: 'Tidal', category: 'Music & Audio', billingCycle: 'monthly' },
    { id: 'soundcloud', name: 'SoundCloud Go', category: 'Music & Audio', billingCycle: 'monthly' },
    { id: 'deezer', name: 'Deezer', category: 'Music & Audio', billingCycle: 'monthly' },
  ],
  "AI & Tech": [
    { id: 'chatgpt', name: 'ChatGPT Plus', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'claude', name: 'Claude Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'gemini', name: 'Gemini Advanced', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'midjourney', name: 'Midjourney', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'perplexity', name: 'Perplexity Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'copilot', name: 'GitHub Copilot', category: 'Productivity', billingCycle: 'monthly' },
  ],
  "Gaming": [
    { id: 'xbox_pass', name: 'Xbox Game Pass', category: 'Gaming', billingCycle: 'monthly' },
    { id: 'ps_plus', name: 'PlayStation Plus', category: 'Gaming', billingCycle: 'monthly' },
    { id: 'ea_play', name: 'EA Play', category: 'Gaming', billingCycle: 'monthly' },
    { id: 'nintendo', name: 'Nintendo Switch Online', category: 'Gaming', billingCycle: 'monthly' },
    { id: 'geforce', name: 'GeForce NOW', category: 'Gaming', billingCycle: 'monthly' },
  ],
  "Cloud & Storage": [
    { id: 'google_one', name: 'Google One', category: 'Utilities & Cloud', billingCycle: 'monthly' },
    { id: 'icloud', name: 'iCloud+', category: 'Utilities & Cloud', billingCycle: 'monthly' },
    { id: 'dropbox', name: 'Dropbox Plus', category: 'Utilities & Cloud', billingCycle: 'monthly' },
    { id: 'onedrive', name: 'Microsoft OneDrive', category: 'Utilities & Cloud', billingCycle: 'monthly' },
  ],
  "Productivity & Design": [
    { id: 'notion', name: 'Notion', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'canva', name: 'Canva Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'adobe', name: 'Adobe Creative Cloud', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'office365', name: 'Microsoft 365', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'evernote', name: 'Evernote', category: 'Productivity', billingCycle: 'monthly' },
  ],
  "Developer Tools": [
    { id: 'cursor', name: 'Cursor Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'vercel', name: 'Vercel Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'jetbrains', name: 'JetBrains', category: 'Productivity', billingCycle: 'yearly' },
    { id: 'digitalocean', name: 'DigitalOcean', category: 'Utilities & Cloud', billingCycle: 'monthly' },
  ]
};

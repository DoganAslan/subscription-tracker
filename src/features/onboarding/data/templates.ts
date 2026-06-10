export interface SubscriptionTemplate {
  id: string;
  name: string;
  category: string;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
}

export const subscriptionTemplates: Record<string, SubscriptionTemplate[]> = {
  Streaming: [
    { id: 'netflix', name: 'Netflix', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'disney', name: 'Disney+', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'yt_premium', name: 'YouTube Premium', category: 'Entertainment', billingCycle: 'monthly' },
    { id: 'amazon_prime', name: 'Amazon Prime Video', category: 'Entertainment', billingCycle: 'monthly' },
  ],
  Music: [
    { id: 'spotify', name: 'Spotify', category: 'Music', billingCycle: 'monthly' },
    { id: 'apple_music', name: 'Apple Music', category: 'Music', billingCycle: 'monthly' },
  ],
  AI: [
    { id: 'chatgpt', name: 'ChatGPT Plus', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'claude', name: 'Claude Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'gemini', name: 'Gemini Advanced', category: 'Productivity', billingCycle: 'monthly' },
  ],
  Developer: [
    { id: 'github_copilot', name: 'GitHub Copilot', category: 'Productivity', billingCycle: 'yearly' },
    { id: 'cursor', name: 'Cursor Pro', category: 'Productivity', billingCycle: 'monthly' },
    { id: 'vercel', name: 'Vercel Pro', category: 'Software', billingCycle: 'monthly' },
  ],
  Cloud: [
    { id: 'google_one', name: 'Google One', category: 'Storage', billingCycle: 'monthly' },
    { id: 'icloud', name: 'iCloud+', category: 'Storage', billingCycle: 'monthly' },
  ]
};

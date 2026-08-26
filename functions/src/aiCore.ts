export type PortfolioSubscription = {
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  category?: string;
  status?: 'active' | 'paused';
  monthlyAmountInBaseCurrency: number;
  usageFrequency?: 'high' | 'medium' | 'low' | 'none';
  renewalDate?: string;
  isTrial?: boolean;
};

export type HistoryMessage = {
  sender: 'user' | 'ai';
  text: string;
};

export type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export function buildPortfolioContext(
  subscriptions: PortfolioSubscription[],
  baseCurrency: string,
  nowMs: number = Date.now(),
): string {
  const activeSubscriptions = subscriptions.filter(subscription => subscription.status !== 'paused');
  if (activeSubscriptions.length === 0) {
    return 'No active subscriptions are currently registered.';
  }

  const lines = activeSubscriptions.map(subscription => {
    const category = subscription.category || 'Uncategorized';
    const usage = subscription.usageFrequency || 'unknown';
    const renewal = subscription.renewalDate || 'unknown';
    const trial = subscription.isTrial ? ', free trial' : '';
    return `- ${subscription.name}: original ${subscription.amount.toFixed(2)} ${subscription.currency} (${subscription.billingCycle}), normalized ${subscription.monthlyAmountInBaseCurrency.toFixed(2)} ${baseCurrency}/month, category: ${category}, usage: ${usage}, renewal: ${renewal}${trial}`;
  });

  const totalMonthly = activeSubscriptions.reduce(
    (total, subscription) => total + subscription.monthlyAmountInBaseCurrency,
    0,
  );
  const lowUsageSubscriptions = activeSubscriptions.filter(subscription => (
    subscription.usageFrequency === 'low' || subscription.usageFrequency === 'none'
  ));
  const lowUsageMonthly = lowUsageSubscriptions.reduce(
    (total, subscription) => total + subscription.monthlyAmountInBaseCurrency,
    0,
  );

  const categoryCounts = new Map<string, number>();
  for (const subscription of activeSubscriptions) {
    const category = subscription.category || 'Uncategorized';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  const overlappingCategories = [...categoryCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([category, count]) => `${category} (${count})`)
    .join(', ') || 'none detected';

  const upcomingRenewals = activeSubscriptions
    .map(subscription => {
      const renewalMs = subscription.renewalDate ? Date.parse(subscription.renewalDate) : Number.NaN;
      const days = Number.isFinite(renewalMs)
        ? Math.ceil((renewalMs - nowMs) / (24 * 60 * 60 * 1_000))
        : Number.NaN;
      return { name: subscription.name, days };
    })
    .filter(item => Number.isFinite(item.days) && item.days >= 0 && item.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)
    .map(item => `${item.name} (${item.days} days)`)
    .join(', ') || 'none in the next 30 days';

  return [
    `Preferred display currency: ${baseCurrency}`,
    `Active subscription count: ${activeSubscriptions.length}`,
    `Normalized monthly commitment: ${totalMonthly.toFixed(2)} ${baseCurrency}`,
    `Known low-or-no-usage commitment: ${lowUsageMonthly.toFixed(2)} ${baseCurrency}/month across ${lowUsageSubscriptions.length} subscriptions`,
    `Overlapping categories: ${overlappingCategories}`,
    `Upcoming renewals: ${upcomingRenewals}`,
    'Subscriptions:',
    ...lines,
  ].join('\n');
}

export function detectIntent(userMessage: string): string {
  const normalized = userMessage.toLocaleLowerCase('tr-TR');
  if (/(iptal|cancel|kapat|durdur|pause)/i.test(normalized)) return 'cancel_or_pause';
  if (/(karşılaştır|compare|hangisi|which one|vs\.?)/i.test(normalized)) return 'compare_services';
  if (/(tasarruf|save|azalt|bütçe|budget|pahalı|expensive)/i.test(normalized)) return 'reduce_spending';
  if (/(yenile|renew|ödeme|payment|takvim|calendar|ne zaman|when)/i.test(normalized)) return 'renewal_planning';
  if (/(deneme|trial)/i.test(normalized)) return 'trial_review';
  return 'general_subscription_advice';
}

export function normalizeHistory(history: HistoryMessage[], userMessage: string): GeminiContent[] {
  const lastMessage = history.at(-1);
  const withoutDuplicateCurrentMessage = lastMessage?.sender === 'user'
    && lastMessage.text.trim() === userMessage.trim()
    ? history.slice(0, -1)
    : history;

  const normalized: GeminiContent[] = [];
  for (const message of withoutDuplicateCurrentMessage) {
    const role = message.sender === 'user' ? 'user' : 'model';
    if (normalized.length === 0 && role === 'model') continue;

    const previous = normalized.at(-1);
    if (previous?.role === role) {
      previous.parts[0].text = `${previous.parts[0].text}\n${message.text}`;
    } else {
      normalized.push({ role, parts: [{ text: message.text }] });
    }
  }

  if (normalized.at(-1)?.role === 'user') {
    const previous = normalized.at(-1)!;
    previous.parts[0].text = `${previous.parts[0].text}\n${userMessage}`;
  } else {
    normalized.push({ role: 'user', parts: [{ text: userMessage }] });
  }

  return normalized;
}


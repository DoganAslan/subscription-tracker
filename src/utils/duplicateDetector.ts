// src/utils/duplicateDetector.ts
import { Subscription } from '@/services/firebase/types';

export interface DuplicateAlert {
  id: string;
  type: 'exact_name' | 'brand_similarity' | 'heavy_category';
  title: string;
  description: string;
  subs: Subscription[];
  severity: 'high' | 'medium';
}

export function detectDuplicateSubscriptions(
  subscriptions: Subscription[],
  isTurkish: boolean = true
): DuplicateAlert[] {
  const alerts: DuplicateAlert[] = [];
  if (!subscriptions || subscriptions.length === 0) return alerts;

  const activeSubs = subscriptions.filter(s => s.status !== 'paused');

  // 1. Exact Name Matches
  const nameMap: Record<string, Subscription[]> = {};
  activeSubs.forEach(sub => {
    const key = sub.name.trim().toLowerCase();
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(sub);
  });

  Object.entries(nameMap).forEach(([key, list]) => {
    if (list.length >= 2) {
      alerts.push({
        id: `dup-exact-${key}`,
        type: 'exact_name',
        title: isTurkish ? `Mükerrer Çekim Riski: ${list[0].name}` : `Duplicate Charge Risk: ${list[0].name}`,
        description: isTurkish
          ? `"${list[0].name}" ismiyle ${list.length} adet aktif abonelik bulundu. Yanlışlıkla çifte ödeme yapıyor olabilirsiniz.`
          : `Found ${list.length} active subscriptions with the name "${list[0].name}". You might be double-billed.`,
        subs: list,
        severity: 'high',
      });
    }
  });

  // 2. Brand Similarity Check (e.g., Spotify & Spotify Family)
  for (let i = 0; i < activeSubs.length; i++) {
    for (let j = i + 1; j < activeSubs.length; j++) {
      const s1 = activeSubs[i];
      const s2 = activeSubs[j];
      const n1 = s1.name.toLowerCase();
      const n2 = s2.name.toLowerCase();

      // Check if one brand name contains another but names are not identical
      if (n1 !== n2 && (n1.includes(n2) || n2.includes(n1))) {
        const alertId = `dup-brand-${s1.id}-${s2.id}`;
        if (!alerts.some(a => a.id === alertId)) {
          alerts.push({
            id: alertId,
            type: 'brand_similarity',
            title: isTurkish ? `Benzer Marka Aboneliği: ${s1.name} & ${s2.name}` : `Similar Brand Subscription: ${s1.name} & ${s2.name}`,
            description: isTurkish
              ? `"${s1.name}" ve "${s2.name}" aynı platformun farklı paketleri gibi görünüyor. İkisine birden ihtiyacınız var mı?`
              : `"${s1.name}" and "${s2.name}" look like different tiers of the same brand. Do you need both?`,
            subs: [s1, s2],
            severity: 'medium',
          });
        }
      }
    }
  }

  return alerts;
}

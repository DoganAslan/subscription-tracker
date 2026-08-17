export interface CategoryMeta {
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export function getCategoryLabel(cat: string, isTurkish: boolean): string {
  const c = String(cat || '').toLowerCase().trim();

  // 1. Müzik & Ses
  if (c.includes('music') || c.includes('müzik') || c.includes('audio') || c.includes('spotify') || c.includes('apple music') || c.includes('deezer') || c.includes('tidal')) {
    return isTurkish ? 'Müzik & Ses' : 'Music & Audio';
  }

  // 2. Eğlence, TV & Sinema
  if (
    c.includes('entertain') ||
    c.includes('eğlence') ||
    c.includes('tv') ||
    c.includes('video') ||
    c.includes('stream') ||
    c.includes('netflix') ||
    c.includes('youtube') ||
    c.includes('disney') ||
    c.includes('prime') ||
    c.includes('hbo')
  ) {
    return isTurkish ? 'Eğlence & TV' : 'Entertainment';
  }

  // 3. Üretkenlik, Yazılım & Bulut
  if (
    c.includes('product') ||
    c.includes('üretken') ||
    c.includes('work') ||
    c.includes('cloud') ||
    c.includes('software') ||
    c.includes('yazılım') ||
    c.includes('tool') ||
    c.includes('chatgpt') ||
    c.includes('ai') ||
    c.includes('adobe') ||
    c.includes('github') ||
    c.includes('notion') ||
    c.includes('office') ||
    c.includes('utility') ||
    c.includes('utilities')
  ) {
    return isTurkish ? 'Üretkenlik & Yazılım' : 'Productivity & Tools';
  }

  // 4. Sağlık & Spor
  if (c.includes('health') || c.includes('fit') || c.includes('spor') || c.includes('sağlık') || c.includes('gym') || c.includes('well')) {
    return isTurkish ? 'Sağlık & Spor' : 'Health & Fitness';
  }

  // 5. Oyun & Gaming
  if (c.includes('game') || c.includes('oyun') || c.includes('ps') || c.includes('playstation') || c.includes('xbox') || c.includes('steam')) {
    return isTurkish ? 'Oyun & Gaming' : 'Gaming';
  }

  // 6. Finans, Sigorta & Banka
  if (c.includes('finan') || c.includes('sigorta') || c.includes('bank') || c.includes('card') || c.includes('para')) {
    return isTurkish ? 'Finans & Sigorta' : 'Finance & Insurance';
  }

  // 7. Eğitim & Kitap
  if (c.includes('edu') || c.includes('eğitim') || c.includes('book') || c.includes('kitap') || c.includes('read') || c.includes('coursera') || c.includes('udemy') || c.includes('news')) {
    return isTurkish ? 'Eğitim & Medya' : 'Education & News';
  }

  // 8. Yemek & Teslimat
  if (c.includes('food') || c.includes('yemek') || c.includes('grocer') || c.includes('market') || c.includes('coffee') || c.includes('getir') || c.includes('yemeksepeti')) {
    return isTurkish ? 'Yemek & Market' : 'Food & Delivery';
  }

  // 9. Alışveriş & Moda
  if (c.includes('shop') || c.includes('alışveriş') || c.includes('fashion') || c.includes('amazon') || c.includes('trendyol')) {
    return isTurkish ? 'Alışveriş & Moda' : 'Shopping & E-commerce';
  }

  // Default: Genel / Diğer
  return isTurkish ? 'Diğer' : 'Other';
}

export function getBillingCycleLabel(cycle: string, isTurkish: boolean): string {
  const c = String(cycle || '').toLowerCase().trim();
  if (c.includes('month') || c.includes('ay')) return isTurkish ? 'Aylık' : 'Monthly';
  if (c.includes('year') || c.includes('yıl')) return isTurkish ? 'Yıllık' : 'Yearly';
  if (c.includes('week') || c.includes('hafta')) return isTurkish ? 'Haftalık' : 'Weekly';
  if (c.includes('quarter') || c.includes('çeyrek') || c.includes('3 ay')) return isTurkish ? '3 Aylık' : 'Quarterly';
  return cycle;
}

export function getCategoryMeta(cat: string, isTurkish: boolean = false): CategoryMeta {
  const c = String(cat || '').toLowerCase().trim();
  const label = getCategoryLabel(cat, isTurkish);

  // 1. Müzik & Ses
  if (c.includes('music') || c.includes('müzik') || c.includes('audio') || c.includes('spotify') || c.includes('apple music') || c.includes('deezer') || c.includes('tidal')) {
    return { name: label, icon: 'musical-notes', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' };
  }

  // 2. Eğlence, TV & Sinema
  if (
    c.includes('entertain') ||
    c.includes('eğlence') ||
    c.includes('tv') ||
    c.includes('video') ||
    c.includes('stream') ||
    c.includes('netflix') ||
    c.includes('youtube') ||
    c.includes('disney') ||
    c.includes('prime') ||
    c.includes('hbo')
  ) {
    return { name: label, icon: 'film', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.14)' };
  }

  // 3. Üretkenlik, Yazılım & Bulut
  if (
    c.includes('product') ||
    c.includes('üretken') ||
    c.includes('work') ||
    c.includes('cloud') ||
    c.includes('software') ||
    c.includes('yazılım') ||
    c.includes('tool') ||
    c.includes('chatgpt') ||
    c.includes('ai') ||
    c.includes('adobe') ||
    c.includes('github') ||
    c.includes('notion') ||
    c.includes('office') ||
    c.includes('utility') ||
    c.includes('utilities')
  ) {
    return { name: label, icon: 'laptop', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' };
  }

  // 4. Sağlık & Spor
  if (c.includes('health') || c.includes('fit') || c.includes('spor') || c.includes('sağlık') || c.includes('gym') || c.includes('well')) {
    return { name: label, icon: 'fitness', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)' };
  }

  // 5. Oyun & Gaming
  if (c.includes('game') || c.includes('oyun') || c.includes('ps') || c.includes('playstation') || c.includes('xbox') || c.includes('steam')) {
    return { name: label, icon: 'game-controller', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.14)' };
  }

  // 6. Finans, Sigorta & Banka
  if (c.includes('finan') || c.includes('sigorta') || c.includes('bank') || c.includes('card') || c.includes('para')) {
    return { name: label, icon: 'wallet', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' };
  }

  // 7. Eğitim & Kitap
  if (c.includes('edu') || c.includes('eğitim') || c.includes('book') || c.includes('kitap') || c.includes('read') || c.includes('coursera') || c.includes('udemy') || c.includes('news')) {
    return { name: label, icon: 'book', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.14)' };
  }

  // 8. Yemek & Teslimat
  if (c.includes('food') || c.includes('yemek') || c.includes('grocer') || c.includes('market') || c.includes('coffee') || c.includes('getir') || c.includes('yemeksepeti')) {
    return { name: label, icon: 'fast-food', color: '#F97316', bg: 'rgba(249, 115, 22, 0.14)' };
  }

  // 9. Alışveriş & Moda
  if (c.includes('shop') || c.includes('alışveriş') || c.includes('fashion') || c.includes('amazon') || c.includes('trendyol')) {
    return { name: label, icon: 'bag-handle', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.14)' };
  }

  // Default: Genel / Diğer
  return { name: label, icon: 'sparkles', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.14)' };
}

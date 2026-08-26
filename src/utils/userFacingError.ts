type ErrorLike = {
  code?: unknown;
  message?: unknown;
};

const AUTH_MESSAGES: Record<string, { tr: string; en: string }> = {
  'auth/invalid-credential': {
    tr: 'E-posta adresi veya şifre doğru değil.',
    en: 'The email address or password is incorrect.',
  },
  'auth/wrong-password': {
    tr: 'Mevcut şifren doğru değil.',
    en: 'Your current password is incorrect.',
  },
  'auth/email-already-in-use': {
    tr: 'Bu e-posta adresi başka bir hesapta kullanılıyor.',
    en: 'This email address is already used by another account.',
  },
  'auth/invalid-email': {
    tr: 'Geçerli bir e-posta adresi girin.',
    en: 'Enter a valid email address.',
  },
  'auth/requires-recent-login': {
    tr: 'Güvenlik nedeniyle yeniden giriş yapıp işlemi tekrar deneyin.',
    en: 'For security, sign in again and retry this action.',
  },
  'auth/too-many-requests': {
    tr: 'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.',
    en: 'Too many attempts were made. Try again later.',
  },
  'auth/network-request-failed': {
    tr: 'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edin.',
    en: 'Could not connect. Check your internet connection.',
  },
  'auth/weak-password': {
    tr: 'Daha güçlü bir şifre belirleyin.',
    en: 'Choose a stronger password.',
  },
  'auth/operation-not-allowed': {
    tr: 'Bu işlem şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
    en: 'This action is currently unavailable. Please try again later.',
  },
  'permission-denied': {
    tr: 'Bu işlem için yetkiniz bulunmuyor.',
    en: 'You do not have permission to perform this action.',
  },
  unavailable: {
    tr: 'Hizmete şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.',
    en: 'The service is currently unavailable. Please try again later.',
  },
};

function normalizeCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as ErrorLike;
  return typeof candidate.code === 'string' ? candidate.code : '';
}

/**
 * Converts internal Firebase/service errors into short messages safe to show
 * to users. Raw SDK messages can expose implementation details and are never
 * returned from this helper.
 */
export function getUserFacingError(
  error: unknown,
  isTurkish: boolean,
  fallback?: { tr: string; en: string },
): string {
  const code = normalizeCode(error);
  const direct = AUTH_MESSAGES[code];
  if (direct) return isTurkish ? direct.tr : direct.en;

  const shortCode = code.includes('/') ? code.slice(code.lastIndexOf('/') + 1) : code;
  const shortMatch = AUTH_MESSAGES[shortCode];
  if (shortMatch) return isTurkish ? shortMatch.tr : shortMatch.en;

  const safeFallback = fallback ?? {
    tr: 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
    en: 'The action could not be completed. Please try again.',
  };
  return isTurkish ? safeFallback.tr : safeFallback.en;
}

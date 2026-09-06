import { privacyPolicies, termsPolicies } from '@/constants/legalPolicies';

const SUPPORT_EMAIL = 'doganaslandevelopment@gmail.com';

describe('global release legal policies', () => {
  it.each(['tr', 'en'])('accurately discloses Firebase-backed processing in %s', language => {
    const policy = privacyPolicies[language];

    expect(policy).toMatch(/Firebase/i);
    expect(policy).toMatch(/Firestore/i);
    expect(policy).toContain(SUPPORT_EMAIL);
  });

  it.each(['tr', 'en'])('describes the Android release as mobile-only and local reminders in %s', language => {
    const policy = privacyPolicies[language];

    expect(policy).not.toMatch(/web application|web uygulaması/i);
    expect(policy).not.toMatch(/notification token|bildirim belirteci/i);
  });

  it.each(['tr', 'en'])('contains a dated terms document in %s', language => {
    expect(termsPolicies[language]).toMatch(/last updated|effective date|son güncelleme|yürürlük tarihi/i);
  });
});

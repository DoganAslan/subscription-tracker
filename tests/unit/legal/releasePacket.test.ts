import { readFileSync } from 'node:fs';

const readReleaseFile = (filename: string) =>
  readFileSync(`docs/release/${filename}`, 'utf8');

describe('Google Play release packet', () => {
  it('ships Turkish and English listing copy with review prompts', () => {
    const listing = readReleaseFile('google-play-listing-tr-en.md');

    expect(listing).toMatch(/## Türkçe/);
    expect(listing).toMatch(/## English/);
    expect(listing).toContain('doganaslandevelopment@gmail.com');
    expect(listing).toMatch(/Screenshot|Ekran görüntüsü/);
  });

  it('ships a Data Safety checklist that must be verified before submission', () => {
    const checklist = readReleaseFile('google-play-data-safety-checklist.md');

    expect(checklist).toMatch(/Verify before submission/i);
    expect(checklist).toMatch(/Firebase Authentication/i);
    expect(checklist).toMatch(/Firestore/i);
    expect(checklist).toMatch(/PAN|CVV/);
  });
});

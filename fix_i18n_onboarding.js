const fs = require('fs');
const path = require('path');

const localesDir = path.join('src', 'locales', 'translations');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const keysToAdd = {
  onboarding: {
    skip: "Skip",
    next: "Next",
    start: "Get Started",
    s1Title: "Single Source of Truth",
    s1Desc: "Track all recurring subscriptions across multiple currencies with zero IEEE-754 rounding errors.",
    s2Title: "The Vampire Meter",
    s2Desc: "Algorithmic detection of duplicate categories, date clashes, and expiring commitment contracts.",
    s3Title: "Total Data Sovereignty",
    s3Desc: "100% offline-first architecture. Backup and restore your encrypted JSON ledger anytime."
  }
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.onboarding) {
    data.onboarding = {};
  }
  
  for (const [k, v] of Object.entries(keysToAdd.onboarding)) {
    if (!data.onboarding[k]) {
      data.onboarding[k] = v;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
console.log('Onboarding keys injected.');

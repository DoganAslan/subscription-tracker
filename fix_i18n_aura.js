const fs = require('fs');
const path = require('path');

const localesDir = path.join('src', 'locales', 'translations');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const keysToAdd = {
  onb: {
    s1Title: "Absolute Financial Clarity",
    s1Desc: "Eliminate currency chaos. Track EUR, USD, TRY and 17+ ledgers automatically merged into your single source of truth with zero IEEE-754 residual drift.",
    s1Pill1: "? Live Exchange",
    s1Pill2: "??? IEEE-754 Safe",
    s1Pill3: "?? Residual Zero",
    s2Title: "The Vampire Engine",
    s2Desc: "Stop silent wealth drains. Algorithmic detection of category overkill, renewal date clashes, and high-risk commitment contracts 30 days before impact.",
    s2Pill1: "?? Health Score (0-100)",
    s2Pill2: "? Doom-Clock Alarms",
    s2Pill3: "?? Clash Radar",
    s3Title: "Total Data Sovereignty",
    s3Desc: "Zero cloud monopolies. 100% offline-first local vault architecture. Your financial ledger is encrypted on your silicon, exportable to JSON anytime.",
    s3Pill1: "?? Silicon Vault",
    s3Pill2: "?? Zero Server Bloat",
    s3Pill3: "?? Sovereign Backup"
  }
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.onb) {
    data.onb = {};
  }
  
  for (const [k, v] of Object.entries(keysToAdd.onb)) {
    if (!data.onb[k]) {
      data.onb[k] = v;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
console.log('Onboarding aura keys injected.');

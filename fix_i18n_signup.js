const fs = require('fs');
const path = require('path');

const localesDir = path.join('src', 'locales', 'translations');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const keysToAdd = {
  auth: {
    createAccountTitle: "Create Account",
    signUpSub: "Start tracking your subscriptions today",
    fullNameLabel: "FULL NAME",
    confirmPasswordLabel: "CONFIRM PASSWORD",
    alreadyHaveAccount: "Already have an account?"
  }
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.auth) {
    data.auth = {};
  }
  
  for (const [k, v] of Object.entries(keysToAdd.auth)) {
    if (!data.auth[k]) {
      data.auth[k] = v;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
console.log('Sign-Up keys injected.');

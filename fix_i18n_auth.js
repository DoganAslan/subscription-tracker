const fs = require('fs');
const path = require('path');

const localesDir = path.join('src', 'locales', 'translations');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const keysToAdd = {
  auth: {
    welcomeBack: "Welcome back",
    signInSub: "Sign in to manage your subscriptions",
    emailLabel: "EMAIL ADDRESS",
    passwordLabel: "PASSWORD",
    forgotPassword: "Forgot Password?",
    loginBtn: "Log In",
    noAccount: "Don't have an account?",
    signUpLink: "Sign up"
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
console.log('Auth keys injected.');

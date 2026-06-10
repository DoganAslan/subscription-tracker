const fs = require('fs');
const path = require('path');
const os = require('os');

const localPropertiesPath = path.join(__dirname, '../android/local.properties');

if (!fs.existsSync(localPropertiesPath)) {
  const sdkDir = os.platform() === 'win32'
    ? path.join(os.homedir(), 'AppData\\\\Local\\\\Android\\\\Sdk') // Windows
    : path.join(os.homedir(), 'Library/Android/sdk'); // macOS

  const content = `# This file was generated automatically.
# Location of the SDK. This is only used by Gradle.
sdk.dir=${sdkDir}
`;

  fs.writeFileSync(localPropertiesPath, content);
  console.log('✅ Created android/local.properties with sdk.dir:', sdkDir);
} else {
  console.log('ℹ️ android/local.properties already exists.');
}

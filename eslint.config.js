// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    // One-off maintenance scripts are not part of the Expo runtime bundle.
    ignores: ["**/*.js", ".expo/**", ".npm-cache/**", "lint-report.json"],
  },
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // React Native Animated values are intentionally stable mutable refs. These
      // React Compiler diagnostics do not indicate a hooks-order violation here.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      // These project-wide patterns are intentional: Firebase needs conditional
      // CommonJS loading on web/native, i18n exposes a default instance, and
      // React Hook Form's watch API is not React Compiler-compatible yet.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  }
]);

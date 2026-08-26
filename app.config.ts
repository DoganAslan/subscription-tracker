import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: config.name || 'SubMate',
  slug: config.slug || 'submate',
  ...(config as any),
  plugins: [
    ...(config.plugins || []),
    'expo-localization',
    'expo-secure-store',
    'expo-image',
    'expo-web-browser',
    'expo-font',
    'expo-status-bar',
  ]
});

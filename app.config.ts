import { ExpoConfig, ConfigContext } from 'expo/config';

const LOCAL_IOS_FIREBASE_CONFIG = './GoogleService-Info.plist';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_INFO_PLIST?.trim()
    || LOCAL_IOS_FIREBASE_CONFIG;

  return {
    ...(config as ExpoConfig),
    name: config.name || 'SubMate',
    slug: config.slug || 'submate',
    ios: {
      ...(config.ios || {}),
      googleServicesFile,
    },
    plugins: [
      ...(config.plugins || []),
      'expo-localization',
      'expo-secure-store',
      'expo-image',
      'expo-web-browser',
      'expo-font',
      'expo-status-bar',
    ],
  };
};

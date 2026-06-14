import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widget-task-handler');
  const { registerBackgroundSync } = require('./src/services/background/widgetSync');

  registerWidgetTaskHandler(widgetTaskHandler);
  
  // Register background sync task for Android widgets
  registerBackgroundSync();
}

if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

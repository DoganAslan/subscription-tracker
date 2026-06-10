import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy Policy', presentation: 'modal' }} />
      <Stack.Screen name="terms" options={{ headerShown: true, title: 'Terms of Use', presentation: 'modal' }} />
      <Stack.Screen name="about" options={{ headerShown: true, title: 'About', presentation: 'modal' }} />
    </Stack>
  );
}

import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { fetchWithAuth } from '../lib/auth';
// Side-effect import: registers the live-location TaskManager task so
// iOS can wake the app when the pro moves while in the background.
import '../lib/location';
import { ensurePushTokenRegistered } from '../lib/push';

const API_BASE = 'https://www.speeditrades.com';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetchWithAuth(`${API_BASE}/api/native/me`);

        if (res.status === 401) {
          await SecureStore.deleteItemAsync('auth_token');
          router.replace('/login');
          return;
        }

        if (!res.ok) {
          router.replace('/(tabs)');
          return;
        }

        const user = await res.json();
        if (user?.role === 'TRADESPERSON' && user?.signupV2Confirmed !== true) {
          router.replace('/onboarding/wizard');
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        router.replace('/(tabs)');
      }
    })();
  }, [router]);

  useEffect(() => {
    // Silent: registers token with backend only if iOS has already granted
    // permission. The opt-in prompt lives at /onboarding/notifications so
    // users see context before iOS's system dialog.
    ensurePushTokenRegistered();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string };
      if (data.screen === 'waiting') {
        router.push('/(tabs)/waiting');
      } else if (data.screen === 'messages') {
        router.push('/(tabs)/messages');
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (url.includes('calendar-connected') || url.includes('calConnected=true')) {
        router.push('/(tabs)/calendar');
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    Linking.getInitialURL().then(handleUrl);

    return () => sub.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="quotes" />
        <Stack.Screen name="job-history" />
        <Stack.Screen name="approved" />
      </Stack>
    </>
  );
}

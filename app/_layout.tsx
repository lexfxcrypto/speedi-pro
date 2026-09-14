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
    /**
     * Two payload shapes, because there have always been two.
     *
     * `screen` is what this app's own pushes send and what this handler
     * was written for. `url` is what lib/sendPushNotification sends —
     * every server-side push has carried it since the helper was built,
     * and nothing here read it, so the extend prompt, the job-accepted
     * push and the review request all opened the app and stopped.
     *
     * Handling both rather than migrating one: the sends are spread
     * across routes and a cron, and a payload key changed in one place
     * and missed in another is exactly the drift that produced this.
     */
    const act = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification?.request?.content?.data as
        | { screen?: string; url?: string }
        | undefined;
      if (!data) return;

      if (data.screen === 'waiting') return router.push('/(tabs)/waiting');
      if (data.screen === 'messages') return router.push('/(tabs)/messages');

      const url = data.url;
      if (typeof url !== 'string' || !url) return;

      /**
       * A web URL has no native equivalent here — the pro's review page
       * and the map deep link are both web — so it opens outside. An
       * app path routes.
       */
      if (url.startsWith('http')) return void Linking.openURL(url);
      if (url === '/' ) return router.push('/(tabs)');
      router.push(url as never);
    };

    /**
     * Cold start first. A listener alone only catches taps while the app
     * is running, and the common case is the opposite: the extend prompt
     * arrives with the app closed and the tap launches it. Missing this
     * is the usual way a push handler ships half working.
     */
    void Notifications.getLastNotificationResponseAsync().then(act);
    const sub = Notifications.addNotificationResponseReceivedListener(act);
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

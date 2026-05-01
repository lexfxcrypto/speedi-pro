import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { fetchWithAuth } from '../lib/auth';

const API_BASE = 'https://www.speeditrades.com';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Expo push token:', token.data);
    await SecureStore.setItemAsync('expo_push_token', token.data);

    const authToken = await SecureStore.getItemAsync('auth_token');
    if (authToken) {
      fetch(`${API_BASE}/api/native/register-push`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken: token.data }),
      }).catch((e) => console.log('register-push failed:', e));
    }

    return token.data;
  } catch (e) {
    console.log('Push registration failed:', e);
    return null;
  }
}

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
    registerForPushNotifications();
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
      </Stack>
    </>
  );
}

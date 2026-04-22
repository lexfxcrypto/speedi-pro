import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';

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
    return token.data;
  } catch (e) {
    console.log('Push registration failed:', e);
    return null;
  }
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then((token) => {
      if (!token) {
        router.replace('/login');
      } else {
        router.replace('/(tabs)');
      }
    });
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
        <Stack.Screen name="quotes" />
        <Stack.Screen name="job-history" />
      </Stack>
    </>
  );
}

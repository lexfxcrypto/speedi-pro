/**
 * Push notification permission + token registration.
 *
 *   ensurePushTokenRegistered — silent. Only registers the token with
 *     our backend if the OS has already granted permission. Does NOT
 *     trigger the iOS permission prompt. Safe to call on every launch.
 *
 *   requestAndRegisterPush — explicit. Triggers the iOS permission
 *     prompt and registers if granted. Should only be called from a
 *     screen that has just explained WHY (e.g. the onboarding
 *     notifications screen) so the system prompt has context.
 *
 * iOS only shows the system permission prompt once. If we ask without
 * context and the user taps "Don't Allow", we can't re-prompt — the
 * user has to go to Settings. So `requestAndRegisterPush` lives behind
 * an explanation screen.
 */

import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://www.speeditrades.com';

async function fetchToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await SecureStore.setItemAsync('expo_push_token', token.data);
    return token.data;
  } catch (e) {
    console.log('Push token fetch failed:', e);
    return null;
  }
}

async function registerWithServer(pushToken: string): Promise<void> {
  const authToken = await SecureStore.getItemAsync('auth_token');
  if (!authToken) return;
  try {
    await fetch(`${API_BASE}/api/native/register-push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pushToken }),
    });
  } catch (e) {
    console.log('register-push failed:', e);
  }
}

export async function ensurePushTokenRegistered(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const token = await fetchToken();
    if (token) await registerWithServer(token);
  } catch (e) {
    console.log('ensurePushTokenRegistered failed:', e);
  }
}

export async function requestAndRegisterPush(): Promise<{
  granted: boolean;
  token: string | null;
}> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { granted: false, token: null };
    }
    const token = await fetchToken();
    if (token) await registerWithServer(token);
    return { granted: true, token };
  } catch (e) {
    console.log('requestAndRegisterPush failed:', e);
    return { granted: false, token: null };
  }
}

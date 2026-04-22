import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://www.speeditrades.com';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/api/native/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.token) {
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));

    const pushToken = await SecureStore.getItemAsync('expo_push_token');
    if (pushToken) {
      fetch(`${API_BASE}/api/native/register-push`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken }),
      }).catch((e) => console.log('register-push failed:', e));
    }

    return { success: true, user: data.user };
  }

  return { success: false, error: data.error };
}

export async function getToken() {
  return await SecureStore.getItemAsync('auth_token');
}

export async function logout() {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_data');
}

export async function fetchWithAuth(url: string, options: any = {}) {
  const token = await getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

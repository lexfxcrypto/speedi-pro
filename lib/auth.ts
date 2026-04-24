import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://www.speeditrades.com';

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: string;
  referralCode?: string;
  providerType?: string;
  signupIntent?: string;
  premisesMode?: string;
};

type AuthResult =
  | { success: true; user: User }
  | { success: false; error?: string };

// Shared session-saving helper — called by login() and register()
// after successful auth. Writes JWT + user to SecureStore, then
// fires push-token registration in the background.
export async function saveSession(token: string, user: User): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));

  const pushToken = await SecureStore.getItemAsync('expo_push_token');
  if (pushToken) {
    fetch(`${API_BASE}/api/native/register-push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pushToken }),
    }).catch((e) => console.log('register-push failed:', e));
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const response = await fetch(`${API_BASE}/api/native/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.token) {
    await saveSession(data.token, data.user);
    return { success: true, user: data.user };
  }

  return { success: false, error: data.error };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const response = await fetch(`${API_BASE}/api/native/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (data.token) {
    await saveSession(data.token, data.user);
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

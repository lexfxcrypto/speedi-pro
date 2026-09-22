/**
 * English and Thai, for the Pattaya launch (22 Sep 2026).
 *
 * ── Why not i18next or expo-localization ───────────────────────────────
 * Both would work, and expo-localization is a native module: adding it
 * means a store build before anybody sees a word of Thai, where this is
 * plain JS and ships over the air to 1.0.25. The device language comes
 * from Intl, which Hermes provides; the choice is kept in SecureStore,
 * which the app already has.
 *
 * ── How to use it ──────────────────────────────────────────────────────
 * In a component:   const { t } = useT();   t('login.title')
 * With values:      t('home.creditsLeft', { count: 3 })   "{count} left"
 * Outside React:    import { t } from '../lib/i18n'  (Alerts, helpers)
 *
 * Keys are typed: a key that does not exist in the English fails the
 * type check, and so does a Thai file missing one (see th/*.ts).
 *
 * What is NOT translated here: anything the server writes — push
 * notifications, emails, API error messages. Category names are data as
 * well as labels, so they are shown through categoryLabel() and never
 * replaced.
 */
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { CATEGORIES_TH } from './categoriesTh';
import en from './en';
import th from './th';

export type Lang = 'en' | 'th';

type En = typeof en;
export type TKey = {
  [N in keyof En]: `${N & string}.${keyof En[N] & string}`;
}[keyof En];

const DICTS: Record<Lang, Record<string, Record<string, string>>> = {
  en: en as unknown as Record<string, Record<string, string>>,
  th: th as unknown as Record<string, Record<string, string>>,
};

const STORE_KEY = 'app_language';

function deviceLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return locale.toLowerCase().startsWith('th') ? 'th' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = deviceLang();
const listeners = new Set<() => void>();

// A choice made in the app beats the phone's language. Read once at
// start-up; until it lands, the device language is used.
SecureStore.getItemAsync(STORE_KEY)
  .then((saved) => {
    if ((saved === 'en' || saved === 'th') && saved !== current) {
      current = saved;
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  listeners.forEach((l) => l());
  SecureStore.setItemAsync(STORE_KEY, lang).catch(() => {});
}

/**
 * The string for `key` in the current language, with {name} placeholders
 * filled from `vars`. Falls back to English, then to the key itself, so
 * a gap shows as English rather than as nothing.
 */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  const [ns, k] = key.split('.') as [string, string];
  const raw = DICTS[current]?.[ns]?.[k] ?? DICTS.en[ns]?.[k] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m,
  );
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * For components: re-renders when the language changes, so the switch in
 * Profile takes effect everywhere at once without a restart.
 */
export function useT(): { t: typeof t; lang: Lang; setLang: typeof setLang } {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  return { t, lang, setLang };
}

/**
 * A trade, service or sport as shown in the current language.
 *
 * Display only: "Plumber" stays "Plumber" in state, storage and every
 * request to the server, because that is the value the web and the
 * database match on. Unmapped names fall back to the English.
 */
export function categoryLabel(name: string): string {
  return current === 'th' ? CATEGORIES_TH[name] ?? name : name;
}

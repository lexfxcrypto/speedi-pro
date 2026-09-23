import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Take a published update now, rather than two launches later.
 *
 * expo-updates downloads in the background and applies on the NEXT cold
 * start, which is why a fix could sit unseen on a phone for a day — and
 * why a fresh install shows the built-in version first. This checks on
 * launch and again when the app comes back from a long spell in the
 * background, and reloads as soon as something has downloaded.
 *
 * ── When it will NOT reload ────────────────────────────────────────────
 * Coming back after a short break. Reloading under someone who nipped to
 * their messages mid-job would throw away what they were typing, and the
 * update can safely wait for the next launch — which is the old
 * behaviour, not a regression.
 *
 * Disabled in development, where the packager owns the bundle.
 */
const BACKGROUND_GRACE_MS = 10 * 60 * 1000;

export function useAutoUpdate(): void {
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    let cancelled = false;

    const applyIfAny = async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (cancelled || !check.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (cancelled) return;
        await Updates.reloadAsync();
      } catch {
        // Offline, or the server is unreachable: the app keeps running on
        // what it has, which is the whole point of the fallback.
      }
    };

    void applyIfAny();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next.match(/inactive|background/)) {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next !== 'active') return;
      const since = backgroundedAt.current;
      backgroundedAt.current = null;
      if (since && Date.now() - since > BACKGROUND_GRACE_MS) void applyIfAny();
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
}

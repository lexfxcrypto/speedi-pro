/**
 * Live location tracking for a pro who is "green" (live on the map).
 *
 *   startLiveLocationTracking — asks iOS for background ("Always")
 *     permission and starts a TaskManager-backed location service.
 *     iOS wakes the task when the pro moves ~500m so we can push fresh
 *     coords to the backend even when the app is suspended.
 *
 *   stopLiveLocationTracking — stops the task. MUST be called when the
 *     pro toggles offline; otherwise iOS keeps the location service
 *     running and the app burns battery.
 *
 * The task is defined at module top-level so it's registered with
 * TaskManager before iOS attempts to run it after a cold launch.
 * Importing this module anywhere (e.g. for side effects from
 * app/_layout.tsx) is enough — the defineTask call fires on import.
 */

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

export const LIVE_LOCATION_TASK = 'speedi-live-location';
const API_BASE = 'https://www.speeditrades.com';

type TaskData = { locations: Location.LocationObject[] };

TaskManager.defineTask(LIVE_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log('[live-location] task error', error);
    return;
  }
  const locations = (data as TaskData)?.locations;
  if (!locations?.length) return;

  const fresh = locations[locations.length - 1];
  const { latitude, longitude } = fresh.coords;

  try {
    const authToken = await SecureStore.getItemAsync('auth_token');
    if (!authToken) return;
    await fetch(`${API_BASE}/api/native/availability`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        availability: 'AVAILABLE',
        lat: latitude,
        lng: longitude,
      }),
    });
  } catch (e) {
    console.log('[live-location] post failed', e);
  }
});

export type LiveTrackingResult =
  | { ok: true }
  | { ok: false; reason: 'foreground-denied' | 'background-denied' | 'start-failed' };

export async function startLiveLocationTracking(): Promise<LiveTrackingResult> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { ok: false, reason: 'foreground-denied' };
  }

  const bgStatus = await Location.getBackgroundPermissionsAsync();
  let background = bgStatus.status;
  if (background !== 'granted') {
    const req = await Location.requestBackgroundPermissionsAsync();
    background = req.status;
  }
  if (background !== 'granted') {
    return { ok: false, reason: 'background-denied' };
  }

  try {
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LIVE_LOCATION_TASK);
    if (alreadyRunning) return { ok: true };

    await Location.startLocationUpdatesAsync(LIVE_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 500,
      timeInterval: 60_000,
      deferredUpdatesInterval: 60_000,
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false,
    });
    return { ok: true };
  } catch (e) {
    console.log('[live-location] start failed', e);
    return { ok: false, reason: 'start-failed' };
  }
}

export async function stopLiveLocationTracking(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LIVE_LOCATION_TASK);
    if (isRunning) await Location.stopLocationUpdatesAsync(LIVE_LOCATION_TASK);
  } catch (e) {
    console.log('[live-location] stop failed', e);
  }
}

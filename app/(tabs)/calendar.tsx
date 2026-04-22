import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../../lib/auth';

const API = 'https://www.speeditrades.com';

type CalEvent = {
  id: string;
  title: string;
  time: string;
  endTime: string;
  location: string;
  description: string;
  allDay: boolean;
};

type CalData = {
  connected: boolean;
  todayEvents: CalEvent[];
  weekEvents: CalEvent[];
};

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeek(today: Date): Date[] {
  const dow = today.getDay();
  const diffFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffFromMonday);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatEventTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
}

export default function Calendar() {
  const [calData, setCalData] = useState<CalData>({
    connected: false,
    todayEvents: [],
    weekEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/calendar`);
      const data = await res.json();
      if (data && typeof data.connected === 'boolean') setCalData(data);
    } catch (e) {
      console.log('Failed to load calendar:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url?.includes('calendar-connected')) {
        setLoading(true);
        load();
      }
    });
    return () => sub.remove();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      await Linking.openURL(
        `${API}/api/native/calendar/connect?token=${encodeURIComponent(token)}`,
      );
    } catch (e) {
      console.log('Connect failed:', e);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color="#00C67A" size="large" />
      </SafeAreaView>
    );
  }

  const today = new Date();
  const week = getWeek(today);
  const todayStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const eventsByDay: Record<number, CalEvent[]> = {};
  [...calData.todayEvents, ...calData.weekEvents].forEach((e) => {
    if (!e.time) return;
    const d = new Date(e.time);
    week.forEach((day, i) => {
      if (isSameDay(d, day)) {
        eventsByDay[i] = [...(eventsByDay[i] || []), e];
      }
    });
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.weekStrip}>
          {week.map((d, i) => {
            const isToday = isSameDay(d, today);
            const hasEvents = (eventsByDay[i]?.length ?? 0) > 0;
            return (
              <View key={d.toISOString()} style={styles.dayCol}>
                <Text style={styles.dayLetter}>{DAY_LETTERS[i]}</Text>
                <View style={[styles.dateWrap, isToday && styles.dateWrapToday]}>
                  <Text style={styles.dateNum}>{d.getDate()}</Text>
                </View>
                {hasEvents ? (
                  <View style={[styles.eventDot, { backgroundColor: '#E64A19' }]} />
                ) : (
                  <View style={styles.eventDotPlaceholder} />
                )}
              </View>
            );
          })}
        </View>

        {!calData.connected ? (
          <View style={styles.connectCard}>
            <Text style={styles.connectIcon}>📅</Text>
            <Text style={styles.connectTitle}>Connect Google Calendar</Text>
            <Text style={styles.connectSubtitle}>
              Sync your availability automatically. Speedi will auto-go red when you're on a
              job and back to green when you're free.
            </Text>
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={handleConnect}
              disabled={connecting}
              activeOpacity={0.8}
            >
              {connecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.connectBtnText}>Connect Google Calendar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gcalCard}>
            <Text style={styles.gcalIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.gcalRow}>
                <Text style={styles.gcalTitle}>Google Calendar</Text>
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>✓ Live</Text>
                </View>
              </View>
              <Text style={styles.gcalSubtitle}>Syncing availability automatically</Text>
            </View>
          </View>
        )}

        <Text style={styles.todayLabel}>TODAY — {todayStr.toUpperCase()}</Text>

        {calData.connected && calData.todayEvents.length === 0 ? (
          <Text style={styles.emptyText}>No events scheduled today</Text>
        ) : (
          calData.todayEvents.map((evt) => (
            <View key={evt.id} style={styles.slotCard}>
              <View style={[styles.slotBar, { backgroundColor: '#E64A19' }]} />
              <View style={styles.slotBody}>
                <View style={styles.slotMainRow}>
                  <Text style={styles.slotTime}>
                    {evt.allDay ? 'All day' : formatEventTime(evt.time)}
                  </Text>
                  <View style={[styles.slotPill, { backgroundColor: '#E64A1922' }]}>
                    <Text style={[styles.slotPillText, { color: '#E64A19' }]}>📅 Event</Text>
                  </View>
                </View>
                <Text style={styles.slotTitle}>{evt.title}</Text>
                {evt.location ? (
                  <Text style={styles.slotSubtitle}>{evt.location}</Text>
                ) : null}
                {!evt.allDay && evt.endTime ? (
                  <Text style={styles.slotSubtitle}>
                    Until {formatEventTime(evt.endTime)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayLetter: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateWrapToday: {
    backgroundColor: '#E64A19',
  },
  dateNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
  },
  eventDotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 6,
  },
  connectCard: {
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  connectIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  connectTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  connectSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  connectBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  gcalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  gcalIcon: {
    fontSize: 22,
  },
  gcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gcalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  livePill: {
    backgroundColor: '#00C67A22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  livePillText: {
    color: '#00C67A',
    fontSize: 11,
    fontWeight: '700',
  },
  gcalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  todayLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  slotBar: {
    width: 4,
  },
  slotBody: {
    flex: 1,
    padding: 14,
  },
  slotMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  slotPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  slotSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
});

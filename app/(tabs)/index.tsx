import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth, logout } from '../../lib/auth';

const API = 'https://www.speeditrades.com';

type Light = 'red' | 'amber' | 'green';
type TlState = Light | 'offline';

const STATUS_TEXT: Record<TlState, string> = {
  green: 'Available Now',
  amber: 'Finishing Up',
  red: 'Busy',
  offline: 'Offline — not visible on map',
};

const STATUS_COLOR: Record<TlState, string> = {
  green: '#00C67A',
  amber: '#F59E0B',
  red: '#EF4444',
  offline: '#9CA3AF',
};

const STATUS_EMOJI: Record<Light, string> = {
  green: '🟢',
  amber: '🟡',
  red: '🔴',
};

const HAPTIC: Record<Light, () => Promise<void>> = {
  green: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  amber: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  red: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

const AVAIL_MAP: Record<Light, string> = {
  green: 'AVAILABLE',
  amber: 'SOON',
  red: 'BUSY',
};

type OwnedCompany = {
  id: string;
  name: string;
  isApproved: boolean;
  creditBalance: number;
  creditsResetDate: string;
  messageMode: 'dispatcher' | 'autonomous';
  inviteCode: string;
};

type CompanyWorkerCtx = {
  id: string;
  companyId: string;
  messageMode: 'dispatcher' | 'autonomous';
  isActive: boolean;
  company: {
    id: string;
    name: string;
    isApproved: boolean;
    creditBalance: number;
  };
};

type CompanyMessage = {
  id: string;
  createdAt: string;
  content: string;
  customerPhone: string | null;
  customerEmail: string | null;
  sender: { id: string; name: string | null };
  receiver: { id: string; name: string | null };
  intendedReceiver: { id: string; name: string | null } | null;
};

function formatTime(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function countdownLabel(state: Light, time: string): string {
  if (state === 'red') return `${STATUS_EMOJI.red} Busy · Free in ${time}`;
  if (state === 'amber') return `${STATUS_EMOJI.amber} Finishing Up · Available in ${time}`;
  return `${STATUS_EMOJI.green} Available Now · ${time} remaining`;
}

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

async function updateAvailability(state: Light) {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = location.coords;
    await fetchWithAuth('https://www.speeditrades.com/api/native/availability', {
      method: 'POST',
      body: JSON.stringify({
        availability: AVAIL_MAP[state],
        lat: latitude,
        lng: longitude,
      }),
    });
    console.log('Availability updated:', state, latitude, longitude);
  } catch (e) {
    try {
      await fetchWithAuth('https://www.speeditrades.com/api/native/availability', {
        method: 'POST',
        body: JSON.stringify({
          availability: AVAIL_MAP[state],
        }),
      });
      console.log('Availability updated without location:', e);
    } catch (err) {
      console.error('updateAvailability failed', err);
    }
  }
}

export default function Home() {
  const router = useRouter();
  const [tlState, setTlState] = useState<TlState>('offline');
  const [userName, setUserName] = useState('Alex Hacking');
  const [credits, setCredits] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<{
    id: string;
    title: string;
    endTime: string;
  } | null>(null);
  const [dismissedEventId, setDismissedEventId] = useState<string | null>(null);
  const [messageAlert, setMessageAlert] = useState<{
    id: string;
    otherUserName: string;
    lastMessage: string;
  } | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const prevRequestCount = useRef(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [quoteAlert, setQuoteAlert] = useState<{
    count: number;
    latest: { id: string; jobType: string } | null;
  } | null>(null);
  const prevQuoteCount = useRef(0);
  const [jobsToday, setJobsToday] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [availableForQuotes, setAvailableForQuotes] = useState(false);
  const [quotesUntil, setQuotesUntil] = useState<string | null>(null);
  const [togglingQuotes, setTogglingQuotes] = useState(false);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ownedCompany, setOwnedCompany] = useState<OwnedCompany | null>(null);
  const [companyWorker, setCompanyWorker] = useState<CompanyWorkerCtx | null>(null);
  const [companyMessages, setCompanyMessages] = useState<CompanyMessage[]>([]);
  const [companyBannerMsg, setCompanyBannerMsg] = useState<CompanyMessage | null>(null);
  const prevCompanyMsgIds = useRef<Set<string>>(new Set());

  const pulse = useRef(new Animated.Value(0.3)).current;
  const livePulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const requestLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location needed to go live',
          'Speedi uses your location to show customers where you are on the map when you go live. Tap Settings to enable it.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    };
    requestLocation();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        console.log('Token:', token ? 'present' : 'missing');

        const res = await fetchWithAuth(`${API}/api/native/me`);

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('User data:', JSON.stringify(data));

        if (data.name) setUserName(data.name);
        if (data.credits !== undefined) setCredits(data.credits);
        if (data.availability) {
          if (data.availability === 'AVAILABLE') setTlState('green');
          if (data.availability === 'SOON') setTlState('amber');
          if (data.availability === 'BUSY') setTlState('red');
          if (data.availability === 'OFFLINE') setTlState('offline');
        }
        if (typeof data.availableForQuotes === 'boolean') {
          setAvailableForQuotes(data.availableForQuotes);
        }
        if (data.quotesAvailableUntil) {
          setQuotesUntil(data.quotesAvailableUntil);
        } else {
          setQuotesUntil(null);
        }
        if (data.ownedCompany) setOwnedCompany(data.ownedCompany);
        if (data.companyWorker) setCompanyWorker(data.companyWorker);
      } catch (e) {
        console.log('Error loading user data:', e);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/calendar`);
        const data = await res.json();
        if (!data?.connected || !Array.isArray(data.todayEvents)) return;
        const now = new Date();
        const live = data.todayEvents.find((e: { time: string; endTime: string }) => {
          const start = new Date(e.time);
          const end = new Date(e.endTime);
          return !isNaN(start.getTime()) && !isNaN(end.getTime()) && now >= start && now <= end;
        });
        if (live) {
          setCurrentEvent({ id: live.id, title: live.title, endTime: live.endTime });
        } else {
          setCurrentEvent(null);
        }
      } catch (e) {
        console.log('Calendar load failed:', e);
      }
    };
    loadCalendar();
    const interval = setInterval(loadCalendar, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkMessages = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/messages`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const unread = data.filter((m: { unread?: boolean }) => m.unread);
        if (unread.length > 0 && unread[0].id !== lastMessageIdRef.current) {
          lastMessageIdRef.current = unread[0].id;
          setMessageAlert({
            id: unread[0].id,
            otherUserName: unread[0].otherUserName ?? 'Unknown',
            lastMessage: unread[0].lastMessage ?? '',
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } catch (e) {
        console.log('Message check failed:', e);
      }
    };

    const checkQuotes = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/quotes`);
        const data = await res.json();
        const count = typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
        if (count > prevQuoteCount.current && prevQuoteCount.current > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setQuoteAlert({
            count,
            latest: data.quotes?.[0] ?? null,
          });
        }
        prevQuoteCount.current = count;
      } catch (e) {
        console.log('Quote check failed:', e);
      }
    };

    const checkRequests = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/waiting-requests`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        if (data.length > prevRequestCount.current && prevRequestCount.current > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        prevRequestCount.current = data.length;
        setWaitingCount(data.length);
      } catch (e) {
        console.log('Request check failed:', e);
      }
    };

    const loadStats = async () => {
      try {
        const [jobsRes, reviewsRes] = await Promise.all([
          fetchWithAuth(`${API}/api/native/my-jobs`),
          fetchWithAuth(`${API}/api/native/reviews`),
        ]);
        const jobs = await jobsRes.json();
        const reviews = await reviewsRes.json();

        if (Array.isArray(jobs)) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayMs = todayStart.getTime();
          const count = jobs.filter(
            (j: { acceptedAt?: string | null }) =>
              j.acceptedAt && new Date(j.acceptedAt).getTime() >= todayMs,
          ).length;
          setJobsToday(count);
        }

        if (reviews && typeof reviews.averageRating === 'number' && reviews.totalCount > 0) {
          setRating(reviews.averageRating);
        } else {
          setRating(null);
        }
      } catch (e) {
        console.log('Stats load failed:', e);
      }
    };

    checkMessages();
    checkRequests();
    checkQuotes();
    loadStats();
    const msgInterval = setInterval(() => {
      checkMessages();
      checkQuotes();
    }, 15000);
    const reqInterval = setInterval(checkRequests, 20000);
    const statsInterval = setInterval(loadStats, 60000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkMessages();
        checkRequests();
        checkQuotes();
        loadStats();
      }
    });
    return () => {
      clearInterval(msgInterval);
      clearInterval(reqInterval);
      clearInterval(statsInterval);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const hasCompanyContext =
      !!ownedCompany ||
      (!!companyWorker && companyWorker.messageMode === 'dispatcher');
    if (!hasCompanyContext) return;

    const checkCompanyMessages = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/company/messages`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const newIds = new Set<string>(data.map((m: CompanyMessage) => m.id));
        const prevIds = prevCompanyMsgIds.current;
        if (prevIds.size > 0) {
          const firstNew = data.find((m: CompanyMessage) => !prevIds.has(m.id));
          if (firstNew) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setCompanyBannerMsg(firstNew);
          }
        }
        prevCompanyMsgIds.current = newIds;
        setCompanyMessages(data);
      } catch (e) {
        console.log('Company messages check failed:', e);
      }
    };

    checkCompanyMessages();
    const interval = setInterval(checkCompanyMessages, 20000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkCompanyMessages();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [ownedCompany, companyWorker]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (tlState !== 'green') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tlState, livePulse]);

  useEffect(() => {
    if (startTime === null) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialDuration - elapsed);
      setTimerSeconds(remaining);

      if (tlState === 'red' && remaining <= 3600 && remaining > 0) {
        setTlState('amber');
      }
      if (remaining === 0) {
        if (tlState === 'red' || tlState === 'amber') setTlState('green');
        setStartTime(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, initialDuration, tlState]);

  useEffect(() => {
    if (tlState === 'green') {
      updateLocation();
      locationInterval.current = setInterval(updateLocation, 120000);
    } else if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }
    };
  }, [tlState]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const updateLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      await fetchWithAuth(`${API}/api/native/availability`, {
        method: 'POST',
        body: JSON.stringify({
          availability: 'AVAILABLE',
          lat: latitude,
          lng: longitude,
        }),
      });
      console.log('Location updated:', latitude, longitude);
    } catch (e) {
      console.log('Location update failed:', e);
    }
  };

  const handleLightPress = (light: Light) => {
    HAPTIC[light]();
    const duration = light === 'red' ? 7200 : 3600;
    setTlState(light);
    setInitialDuration(duration);
    setTimerSeconds(duration);
    setStartTime(Date.now());
    updateAvailability(light);
  };

  const handleQuotesToggle = async (next: boolean) => {
    setTogglingQuotes(true);
    setAvailableForQuotes(next);
    try {
      const res = await fetchWithAuth(`${API}/api/native/available-for-quotes`, {
        method: 'POST',
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (typeof data?.availableForQuotes === 'boolean') {
        setAvailableForQuotes(data.availableForQuotes);
      }
      setQuotesUntil(data?.quotesAvailableUntil ?? null);

      if (next && data?.diagnostics && !data.diagnostics.showsOnMap) {
        const reasons: string[] = [];
        const d = data.diagnostics;
        if (!d.roleOk) reasons.push(`• Your role is "${d.role}", needs to be TRADESPERSON`);
        if (!d.providerTypeOk)
          reasons.push(`• providerType is "service" — switch to a non-service type`);
        if (!d.hasLatLng) reasons.push('• Tap green first to share your live location');
        if (!d.notDemo) reasons.push('• Account is flagged as demo');
        if (!d.availableForQuotes) reasons.push('• Server rejected the toggle');
        if (!d.quotesAvailableUntilOk) reasons.push('• Expiry did not set correctly');
        Alert.alert(
          "You won't show on the quotes map yet",
          reasons.join('\n') || 'Unknown reason — check with support.',
          [{ text: 'OK' }],
        );
      }
    } catch (e) {
      console.log('Quotes toggle failed:', e);
      setAvailableForQuotes(!next);
    } finally {
      setTogglingQuotes(false);
    }
  };

  const handleOfflineToggle = () => {
    if (tlState === 'offline') {
      handleLightPress('green');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTlState('offline');
    setStartTime(null);
    setTimerSeconds(0);
    setInitialDuration(0);
    fetchWithAuth(`${API}/api/native/availability`, {
      method: 'POST',
      body: JSON.stringify({ availability: 'OFFLINE' }),
    }).catch((e) => console.log('offline failed', e));
  };

  const renderLight = (light: Light, baseColor: string) => {
    const isActive = tlState === light;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleLightPress(light)}
        style={[
          styles.light,
          { backgroundColor: baseColor },
          isActive && {
            shadowColor: baseColor,
            shadowOpacity: 0.9,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
            elevation: 16,
          },
          !isActive && styles.lightDim,
        ]}
      />
    );
  };

  const hasTimer = startTime !== null;
  const progress =
    hasTimer && initialDuration > 0 ? (timerSeconds / initialDuration) * 100 : 0;
  const activeColor = STATUS_COLOR[tlState];

  return (
    <SafeAreaView style={styles.safe}>
      {messageAlert && (
        <View style={styles.messageBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.messageBannerTitle}>
              💬 New message from {messageAlert.otherUserName}
            </Text>
            <Text style={styles.messageBannerBody} numberOfLines={1}>
              {messageAlert.lastMessage?.substring(0, 50)}
              {messageAlert.lastMessage && messageAlert.lastMessage.length > 50 ? '…' : ''}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setMessageAlert(null);
              router.push('/(tabs)/messages');
            }}
            style={styles.bannerReplyBtn}
          >
            <Text style={styles.bannerReplyText}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMessageAlert(null)}
            style={styles.bannerDismissBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.bannerDismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {quoteAlert && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setQuoteAlert(null);
            router.push('/(tabs)/messages');
          }}
          style={styles.messageBanner}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.messageBannerTitle}>📋 New quote request</Text>
            <Text style={styles.messageBannerBody} numberOfLines={1}>
              {quoteAlert.latest?.jobType || 'Tap to view'} — tap to respond
            </Text>
          </View>
          <Text style={styles.messageBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {companyBannerMsg && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setCompanyBannerMsg(null);
            /* scroll to inbox */
          }}
          style={styles.messageBanner}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.messageBannerTitle}>
              📨 New company message
              {companyBannerMsg.intendedReceiver?.name
                ? ` for ${companyBannerMsg.intendedReceiver.name}`
                : ''}
            </Text>
            <Text style={styles.messageBannerBody} numberOfLines={1}>
              {companyBannerMsg.sender.name ?? 'Someone'} —{' '}
              {companyBannerMsg.content?.substring(0, 60)}
            </Text>
          </View>
          <Text style={styles.messageBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.logoutPill}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutPillText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/speedi-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.greeting}>
            {greetingForNow()},{'\n'}
            {userName || 'there'} 👋
          </Text>
        </View>

        <View style={styles.trafficLight}>
          {renderLight('red', '#EF4444')}
          {renderLight('amber', '#F59E0B')}
          {renderLight('green', '#00C67A')}
        </View>

        <Text style={[styles.statusText, { color: activeColor }]}>{STATUS_TEXT[tlState]}</Text>

        {hasTimer && tlState !== 'offline' && (
          <View style={styles.countdownBlock}>
            <Text style={[styles.countdownText, { color: activeColor }]}>
              {countdownLabel(tlState as Light, formatTime(timerSeconds))}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: activeColor },
                ]}
              />
            </View>
          </View>
        )}

        {tlState === 'green' && (
          <View style={styles.liveIndicator}>
            <Animated.View style={[styles.liveDot, { opacity: livePulse }]} />
            <Text style={styles.liveText}>Live · updating location</Text>
          </View>
        )}

        <View style={styles.offlineBtnWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOfflineToggle}
            style={[
              styles.offlineBtn,
              tlState === 'offline' && { borderColor: 'rgba(0,198,122,0.4)' },
            ]}
          >
            <Text
              style={[
                styles.offlineBtnText,
                tlState === 'offline' && { color: '#00C67A' },
              ]}
            >
              {tlState === 'offline' ? '● Go Online' : '● Go Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {currentEvent &&
        tlState === 'green' &&
        dismissedEventId !== currentEvent.id ? (
          <View style={styles.eventSuggest}>
            <Text style={styles.eventSuggestText}>
              📅 You have <Text style={styles.eventSuggestStrong}>{currentEvent.title}</Text>{' '}
              until{' '}
              {new Date(currentEvent.endTime).toLocaleTimeString('en-GB', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.eventSuggestSub}>Want to go red automatically?</Text>
            <View style={styles.eventSuggestRow}>
              <TouchableOpacity
                style={styles.eventSuggestPrimary}
                onPress={() => {
                  handleLightPress('red');
                  setDismissedEventId(currentEvent.id);
                }}
              >
                <Text style={styles.eventSuggestPrimaryText}>Go Red</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.eventSuggestSecondary}
                onPress={() => setDismissedEventId(currentEvent.id)}
              >
                <Text style={styles.eventSuggestSecondaryText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#E64A19' }]}>{credits}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00C67A' }]}>{jobsToday}</Text>
            <Text style={styles.statLabel}>Jobs Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>
              {rating !== null ? `${rating.toFixed(1)}★` : '—'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {(ownedCompany || companyWorker?.messageMode === 'dispatcher') &&
          companyMessages.length > 0 && (
            <View style={styles.companyInbox}>
              <View style={styles.companyInboxHeader}>
                <Text style={styles.companyInboxTitle}>📨 Company Inbox</Text>
                <Text style={styles.companyInboxCount}>
                  {companyMessages.length} pending
                </Text>
              </View>
              {companyMessages.slice(0, 5).map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.companyMsgCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/messages')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyMsgFor}>
                      For {m.intendedReceiver?.name ?? 'your company'}
                    </Text>
                    <Text style={styles.companyMsgPreview} numberOfLines={2}>
                      {m.content}
                    </Text>
                    <Text style={styles.companyMsgMeta}>
                      From {m.sender.name ?? 'Unknown'} ·{' '}
                      {new Date(m.createdAt).toLocaleTimeString('en-GB', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.companyMsgArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        <View style={styles.buyCreditsCard}>
          <Text style={styles.buyIcon}>💳</Text>
          <Text style={styles.buyLabel}>{credits} credits remaining</Text>
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={() => Alert.alert('Buy Credits', 'Credit packs coming soon')}
          >
            <Text style={styles.topUpText}>Top up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quotesCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.quotesTitle}>Available for Quotes</Text>
            <Text style={styles.quotesSubtitle}>
              {availableForQuotes && quotesUntil
                ? `On the live quotes map until ${new Date(quotesUntil).toLocaleTimeString(
                    'en-GB',
                    { hour: 'numeric', minute: '2-digit' },
                  )}`
                : 'Show up on the live map for customers looking for quotes (2h)'}
            </Text>
          </View>
          <Switch
            value={availableForQuotes}
            onValueChange={handleQuotesToggle}
            disabled={togglingQuotes}
            trackColor={{ false: '#2A2A2A', true: '#E64A19' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.approvedCard}>
          <Text style={styles.approvedTitle}>✅ Speedi Approved</Text>
          <Text style={styles.approvedSubtitle}>Active · Verified credentials</Text>
        </View>

        {waitingCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.yoriNotif}
            onPress={() => router.push('/(tabs)/waiting')}
          >
            <Animated.View style={[styles.yoriDot, { opacity: pulse }]} />
            <Text style={styles.yoriNotifText}>
              <Text style={styles.yoriNotifStrong}>Yori</Text> — {waitingCount} waiting
              nearby
            </Text>
            <Text style={styles.yoriChevron}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.calendarCard}
          onPress={() => router.push('/(tabs)/calendar')}
        >
          <View style={styles.calendarIconBox}>
            <Text style={styles.calendarIcon}>📅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.calendarTitle}>Today's Schedule</Text>
            <Text style={styles.calendarSubtitle}>Next: 12:00 PM · Boiler Service</Text>
          </View>
          <Text style={styles.calendarChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  logoutPill: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  logoutPillText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 24,
    gap: 12,
  },
  logo: {
    height: 160,
    width: 220,
  },
  greeting: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  trafficLight: {
    alignSelf: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 18,
  },
  light: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  lightDim: {
    opacity: 0.25,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  countdownBlock: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  countdownText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  liveText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  offlineBtnWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  offlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  offlineBtnText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
  },
  eventSuggest: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  eventSuggestText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
  },
  eventSuggestStrong: {
    fontWeight: '700',
  },
  eventSuggestSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  eventSuggestRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  eventSuggestPrimary: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  eventSuggestPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  eventSuggestSecondary: {
    backgroundColor: '#1C1C1C',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  eventSuggestSecondaryText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBanner: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  messageBannerBody: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  messageBannerArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  bannerReplyBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 10,
  },
  bannerReplyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerDismissBtn: {
    marginLeft: 8,
    padding: 4,
  },
  bannerDismissText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  buyCreditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  buyIcon: {
    fontSize: 20,
  },
  buyLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topUpBtn: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  topUpText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quotesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  quotesTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  quotesSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  approvedCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00C67A',
    marginBottom: 16,
  },
  approvedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  approvedSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  yoriNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230,74,25,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230,74,25,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 10,
  },
  yoriDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E64A19',
  },
  yoriNotifText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  yoriNotifStrong: {
    color: '#E64A19',
    fontWeight: '700',
  },
  yoriChevron: {
    color: '#E64A19',
    fontSize: 20,
    fontWeight: '300',
  },
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  calendarIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  calendarTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  calendarSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  calendarChevron: {
    color: '#6B7280',
    fontSize: 22,
    fontWeight: '300',
  },
  companyInbox: {
    marginBottom: 12,
  },
  companyInboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  companyInboxTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  companyInboxCount: {
    color: '#E64A19',
    fontSize: 13,
    fontWeight: '600',
  },
  companyMsgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E64A19',
  },
  companyMsgFor: {
    color: '#E64A19',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  companyMsgPreview: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  companyMsgMeta: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 6,
  },
  companyMsgArrow: {
    color: '#6B7280',
    fontSize: 22,
    fontWeight: '300',
  },
});

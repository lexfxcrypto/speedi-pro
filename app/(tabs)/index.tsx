import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Light = 'red' | 'amber' | 'green';

const STATUS_TEXT: Record<Light, string> = {
  green: 'Available Now',
  amber: 'Finishing Up',
  red: 'Busy',
};

const STATUS_COLOR: Record<Light, string> = {
  green: '#00C67A',
  amber: '#F59E0B',
  red: '#EF4444',
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

function formatTime(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function countdownLabel(active: Light, time: string): string {
  if (active === 'red') return `${STATUS_EMOJI.red} Busy · Free in ${time}`;
  if (active === 'amber') return `${STATUS_EMOJI.amber} Finishing Up · Available in ${time}`;
  return `${STATUS_EMOJI.green} Available Now · ${time} remaining`;
}

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState<Light>('green');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const pulse = useRef(new Animated.Value(0.3)).current;

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
    if (startTime === null) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialDuration - elapsed);
      setTimerSeconds(remaining);

      if (active === 'red' && remaining <= 3600 && remaining > 0) {
        setActive('amber');
      }
      if (remaining === 0) {
        if (active === 'red' || active === 'amber') setActive('green');
        setStartTime(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, initialDuration, active]);

  const handleLightPress = (light: Light) => {
    HAPTIC[light]();
    const duration = light === 'red' ? 7200 : 3600;
    setActive(light);
    setInitialDuration(duration);
    setTimerSeconds(duration);
    setStartTime(Date.now());
  };

  const renderLight = (light: Light, baseColor: string) => {
    const isActive = active === light;
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
  const activeColor = STATUS_COLOR[active];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good evening 👋</Text>
            <Text style={styles.name}>Alex Hacking</Text>
          </View>
          <View style={styles.creditsChip}>
            <Text style={styles.creditsText}>179 cr</Text>
          </View>
        </View>

        <View style={styles.trafficLight}>
          {renderLight('red', '#EF4444')}
          {renderLight('amber', '#F59E0B')}
          {renderLight('green', '#00C67A')}
        </View>

        <Text style={[styles.statusText, { color: activeColor }]}>{STATUS_TEXT[active]}</Text>

        {hasTimer && (
          <View style={styles.countdownBlock}>
            <Text style={[styles.countdownText, { color: activeColor }]}>
              {countdownLabel(active, formatTime(timerSeconds))}
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#E64A19' }]}>179</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00C67A' }]}>3</Text>
            <Text style={styles.statLabel}>Jobs Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>4.9★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.buyCreditsCard}>
          <Text style={styles.buyIcon}>💳</Text>
          <Text style={styles.buyLabel}>179 credits remaining</Text>
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={() => Alert.alert('Buy Credits', 'Credit packs coming soon')}
          >
            <Text style={styles.topUpText}>Top up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.approvedCard}>
          <Text style={styles.approvedTitle}>✅ Speedi Approved</Text>
          <Text style={styles.approvedSubtitle}>Active · Verified credentials</Text>
        </View>

        <View style={styles.yoriCard}>
          <View style={styles.yoriHeader}>
            <Animated.View style={[styles.yoriDot, { opacity: pulse }]} />
            <Text style={styles.yoriTitle}>Yori — Live Demand</Text>
            <View style={styles.yoriPill}>
              <Text style={styles.yoriPillText}>5 waiting</Text>
            </View>
          </View>
          <Text style={styles.yoriBody}>
            5 customers need a plumber in Preston right now. Go red to queue them or green to
            match instantly.
          </Text>
          <TouchableOpacity
            style={styles.yoriBtn}
            onPress={() => router.push('/(tabs)/waiting')}
          >
            <Text style={styles.yoriBtnText}>⚡ View Requests</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  creditsChip: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  creditsText: {
    color: '#E64A19',
    fontSize: 14,
    fontWeight: '600',
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
  yoriCard: {
    backgroundColor: 'rgba(230,74,25,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230,74,25,0.2)',
    borderRadius: 18,
    padding: 14,
  },
  yoriHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yoriDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E64A19',
  },
  yoriTitle: {
    flex: 1,
    color: '#E64A19',
    fontSize: 14,
    fontWeight: 'bold',
  },
  yoriPill: {
    backgroundColor: '#E64A1922',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  yoriPillText: {
    color: '#E64A19',
    fontSize: 11,
    fontWeight: '700',
  },
  yoriBody: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  yoriBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  yoriBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

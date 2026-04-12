import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const HAPTIC: Record<Light, () => Promise<void>> = {
  green: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  amber: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  red: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

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

export default function Home() {
  const [active, setActive] = useState<Light>('green');

  const renderLight = (light: Light, baseColor: string) => {
    const isActive = active === light;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          HAPTIC[light]();
          setActive(light);
        }}
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

        <Text style={[styles.statusText, { color: STATUS_COLOR[active] }]}>
          {STATUS_TEXT[active]}
        </Text>

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

        <View style={styles.approvedCard}>
          <Text style={styles.approvedTitle}>✅ Speedi Approved</Text>
          <Text style={styles.approvedSubtitle}>Active · Verified credentials</Text>
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
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  approvedCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00C67A',
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
});

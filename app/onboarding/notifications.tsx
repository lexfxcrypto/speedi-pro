import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { requestAndRegisterPush } from '../../lib/push';

const BULLETS: Array<{ icon: keyof typeof Ionicons.glyphMap; title: string; body: string }> = [
  {
    icon: 'flash',
    title: 'Live jobs near you',
    body: "Customers in your area asking for help right now — be the first to respond.",
  },
  {
    icon: 'checkmark-circle',
    title: "When you've been accepted",
    body: 'A ping the moment a customer accepts your quote so you can get straight to work.',
  },
  {
    icon: 'calendar',
    title: 'Approved deadline reminders',
    body: 'Heads-up before any credential is about to expire — never lose your badge.',
  },
];

export default function NotificationsOptIn() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleAllow = async () => {
    setSubmitting(true);
    try {
      await requestAndRegisterPush();
    } finally {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={56} color="#E64A19" />
        </View>

        <Text style={styles.title}>Don&apos;t miss a job</Text>
        <Text style={styles.subtext}>
          Speedi works because Pros respond fast. Push notifications let us
          reach you the second a customer needs you.
        </Text>

        <View style={styles.bullets}>
          {BULLETS.map((b) => (
            <View key={b.title} style={styles.bullet}>
              <View style={styles.bulletIconWrap}>
                <Ionicons name={b.icon} size={20} color="#E64A19" />
              </View>
              <View style={styles.bulletText}>
                <Text style={styles.bulletTitle}>{b.title}</Text>
                <Text style={styles.bulletBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleAllow}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Turn on notifications</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSkip}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  iconWrap: {
    alignSelf: 'center',
    marginTop: 24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtext: {
    color: '#A1A1AA',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 22,
  },
  bullets: {
    flex: 1,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  bulletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(230,74,25,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
  },
  bulletTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  bulletBody: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingTop: 8,
  },
  primaryButton: {
    backgroundColor: '#E64A19',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../lib/auth';

const API = 'https://www.speeditrades.com';

type SpeedyApproved = {
  id: string;
  tier: string;
  status: string;
  credentialsStatus: string;
  activatedAt: string;
  docsDeadline: string;
  docsSubmittedAt: string | null;
  verifiedAt: string | null;
  monthlyCredits: number;
  nextBillingDate: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function tierLabel(tier: string): string {
  if (tier === 'premises') return 'Approved Premises';
  if (tier === 'mobile') return 'Approved Mobile';
  return tier;
}

export default function Approved() {
  const router = useRouter();
  const [approved, setApproved] = useState<SpeedyApproved | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadApproved = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/approved`);
      const data = await res.json();
      setApproved(data && data.id ? data : null);
    } catch (e) {
      console.log('Failed to load approved status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApproved();
  }, []);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Speedi Approved?',
      "Your badge will be removed immediately. Credits already deducted won't be refunded.",
      [
        { text: 'Keep subscription', style: 'cancel' },
        {
          text: 'Cancel subscription',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await fetchWithAuth(`${API}/api/approved/cancel`, {
                method: 'POST',
              });
              if (!res.ok) throw new Error('Cancel failed');
              await loadApproved();
            } catch (e) {
              Alert.alert(
                'Cancel failed',
                e instanceof Error ? e.message : 'Please try again.',
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Speedi Approved</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#E64A19" />
        </View>
      ) : !approved ? (
        <NotEnrolled />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <EnrolledView
            approved={approved}
            cancelling={cancelling}
            onCancel={handleCancel}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function NotEnrolled() {
  return (
    <View style={styles.body}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👑 Speedi Approved</Text>
        <Text style={styles.cardBody}>
          Verified providers stand out — more trust, more jobs. Sign up on the
          web to choose a tier and upload your credentials.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => Linking.openURL(`${API}/approved`)}
        activeOpacity={0.85}
      >
        <Text style={styles.outlineButtonText}>Sign up on the web</Text>
      </TouchableOpacity>
    </View>
  );
}

function EnrolledView({
  approved,
  cancelling,
  onCancel,
}: {
  approved: SpeedyApproved;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const isVerified = approved.credentialsStatus === 'verified';
  const isActive = approved.status === 'active';
  const isCancelled = approved.status === 'cancelled';
  const isPaused = approved.status === 'paused';

  let pillColor = '#6B7280';
  let pillLabel = approved.status;
  if (isActive && isVerified) {
    pillColor = '#00C67A';
    pillLabel = 'Badge active';
  } else if (isActive) {
    pillColor = '#F59E0B';
    pillLabel = 'Badge pending docs';
  } else if (isCancelled) {
    pillLabel = 'Cancelled';
  } else if (isPaused) {
    pillLabel = 'Paused';
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Current tier</Text>
            <Text style={styles.cardTitle}>{tierLabel(approved.tier)}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: `${pillColor}22` }]}>
            <Text style={[styles.pillText, { color: pillColor }]}>{pillLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>Monthly credits</Text>
          <Text style={styles.value}>{approved.monthlyCredits}</Text>
        </View>

        {isActive ? (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Next billing</Text>
            <Text style={styles.value}>{formatDate(approved.nextBillingDate)}</Text>
          </View>
        ) : null}

        {isActive && !isVerified ? (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Docs deadline</Text>
            <Text style={[styles.value, { color: '#F59E0B' }]}>
              {formatDate(approved.docsDeadline)}
            </Text>
          </View>
        ) : null}
      </View>

      {isActive && !isVerified ? (
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => Linking.openURL(`${API}/approved/credentials`)}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineButtonText}>Upload credentials on the web</Text>
        </TouchableOpacity>
      ) : null}

      {isCancelled ? (
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => Linking.openURL(`${API}/approved`)}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineButtonText}>Re-enrol on the web</Text>
        </TouchableOpacity>
      ) : null}

      {isPaused ? (
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => Linking.openURL(`${API}/approved`)}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineButtonText}>Resume on the web</Text>
        </TouchableOpacity>
      ) : null}

      {isActive ? (
        <TouchableOpacity
          style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
          onPress={onCancel}
          disabled={cancelling}
          activeOpacity={0.85}
        >
          {cancelling ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Speedi Approved</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 90,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    minWidth: 90,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 18,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#E64A19',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});

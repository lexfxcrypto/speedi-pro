import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
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

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadApproved();
    });
    return () => sub.remove();
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
  const [selectedTier, setSelectedTier] = useState<'mobile' | 'premises'>('mobile');

  const handleOpenWeb = async () => {
    await WebBrowser.openBrowserAsync(
      `https://speedi.co.uk/approved?tier=${selectedTier}`,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.heroBlock}>
        <Text style={styles.heroEmoji}>👑</Text>
        <Text style={styles.heroTitle}>Get Speedi Approved</Text>
        <Text style={styles.heroSubtitle}>Verified providers get more jobs.</Text>
      </View>

      <TierCard
        selected={selectedTier === 'mobile'}
        onSelect={() => setSelectedTier('mobile')}
        title="👑 Speedi Approved Mobile"
        body="Standard verified provider. Crown badge on your pin."
        price="5 cr/mo"
      />

      <TierCard
        selected={selectedTier === 'premises'}
        onSelect={() => setSelectedTier('premises')}
        title="👑 Speedi Approved Premises"
        body="Fixed business address. Building pin with crown. Instant contact."
        price="15 cr/mo"
      />

      <View style={styles.calloutCard}>
        <Text style={styles.calloutHeader}>What you get</Text>
        <Text style={styles.calloutLine}>👑 Gold crown badge on your map pin</Text>
        <Text style={styles.calloutLine}>
          ✓ &quot;Speedi Approved&quot; on your profile
        </Text>
        <Text style={styles.calloutLine}>📈 Higher placement in search results</Text>
        <Text style={styles.calloutLine}>
          14 days to upload credentials — badge active immediately
        </Text>
        {selectedTier === 'premises' ? (
          <>
            <Text style={styles.calloutLine}>
              📞 Instant &quot;Call to book&quot; button visible on first tap
            </Text>
            <Text style={styles.calloutLine}>
              🏢 Building pin with your business address
            </Text>
          </>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleOpenWeb}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Open speedi.co.uk</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TierCard({
  selected,
  onSelect,
  title,
  body,
  price,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
  price: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.tierCard, selected && styles.tierCardSelected]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      <View style={styles.tierHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierTitle}>{title}</Text>
          <Text style={styles.tierBody}>{body}</Text>
        </View>
        <View style={styles.tierRightCol}>
          <Text style={styles.tierPrice}>{price}</Text>
          {selected ? (
            <View style={styles.tierCheckBadge}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
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
  const router = useRouter();
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
          style={styles.primaryButton}
          onPress={() => router.push('/approved/credentials')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Upload credentials</Text>
        </TouchableOpacity>
      ) : null}

      {isCancelled ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Linking.openURL(`${API}/approved`)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Re-enrol on the web</Text>
        </TouchableOpacity>
      ) : null}

      {isPaused ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Linking.openURL(`${API}/approved`)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Resume on the web</Text>
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
  primaryButton: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  heroBlock: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tierCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 16,
  },
  tierCardSelected: {
    backgroundColor: '#E64A1916',
    borderColor: '#E64A19',
  },
  tierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tierRightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  tierTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tierBody: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  tierPrice: {
    color: '#E64A19',
    fontSize: 15,
    fontWeight: '700',
  },
  tierCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E64A19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  calloutHeader: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calloutLine: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
  },
});

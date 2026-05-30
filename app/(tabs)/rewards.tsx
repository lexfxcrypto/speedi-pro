import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../../lib/auth';
import { SHOW_IAP_CREDITS } from '../../lib/featureFlags';

// Lazy-mount the IAP sheet. expo-iap's native module pulls in StoreKit
// observers on first JS-side require, which on certain iOS builds
// trips a Privacy guard (EXC_GUARD / LIBXPC / bug_type 308) and kills
// the app the moment the user taps the Rewards tab. Importing only
// when the user actually wants to buy credits keeps StoreKit
// completely uninvolved with regular tab navigation.
const CreditsPurchaseSheet = lazy(() => import('../../components/CreditsPurchaseSheet'));

const API = 'https://www.speeditrades.com';

type HistoryItem = {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
  description: string;
  icon: string;
  positive: boolean;
};

type RewardsData = {
  referralCode: string | null;
  totalEarned: number;
  referralCount: number;
  history: HistoryItem[];
};

function formatRelative(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m}m ago`;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= today) {
    return `Today ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`;
  }
  const yesterday = new Date(today.getTime() - day);
  if (d >= yesterday) return 'Yesterday';
  if (diffMs < week) {
    const days = Math.floor(diffMs / day);
    return `${days} days ago`;
  }
  if (diffMs < 2 * week) return '1 week ago';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Rewards() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/rewards`);
        const body = await res.json();
        setData(body);
      } catch (e) {
        console.log('Failed to load rewards:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const referralCode = data?.referralCode ?? '';
  const referralUrl = referralCode ? `speedi.co.uk/register?ref=${referralCode}` : 'speedi.co.uk';
  const shareUrl = `https://${referralUrl}`;

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await Share.share({ message: referralCode });
    } catch (e) {
      console.log('Share failed:', e);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;
    try {
      await Share.share({ message: shareUrl });
    } catch (e) {
      console.log('Share failed:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.loading]}>
        <ActivityIndicator color="#E64A19" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Speedi Affiliate Programme entry point. Web-hosted dashboard;
            Linking.openURL opens the system browser so cookies/session
            persist. Kept distinct from the "Refer a pro" hero below —
            that one's the casual 10%-in-credits user-to-user scheme;
            this is the formal 15% cash-via-Stripe partner programme. */}
        <TouchableOpacity
          style={styles.affiliatePill}
          onPress={() => Linking.openURL('https://www.speedi.co.uk/affiliate')}
          activeOpacity={0.85}
        >
          <Text style={styles.affiliatePillText} numberOfLines={1}>
            Join our Affiliate Scheme — earn 15% cash back
          </Text>
          <Text style={styles.affiliatePillChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Refer a pro</Text>
          <Text style={styles.heroSubtitle}>
            Share your code. When they sign up you both earn — you get 10% of every credit pack
            they buy for 6 months.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode || '—'}</Text>
            <TouchableOpacity onPress={handleCopyCode} disabled={!referralCode}>
              <Text style={styles.copyText}>📋 Copy</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.linkText}>🔗 {referralUrl}</Text>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            disabled={!referralCode}
          >
            <Text style={styles.shareText}>📤 Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.totalEarned ?? 0}</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.referralCount ?? 0}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Credit History</Text>
          {(data?.history.length ?? 0) === 0 ? (
            <Text style={styles.historyEmpty}>
              No credit activity yet. Accept a job or buy a pack to get started.
            </Text>
          ) : (
            data!.history.map((item, i) => (
              <View
                key={item.id}
                style={[
                  styles.historyRow,
                  i < data!.history.length - 1 && styles.historyDivider,
                ]}
              >
                <Text style={styles.historyIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDesc}>{item.description}</Text>
                  <Text style={styles.historyDate}>{formatRelative(item.createdAt)}</Text>
                </View>
                <Text
                  style={[
                    styles.historyAmount,
                    { color: item.positive ? '#00C67A' : '#EF4444' },
                  ]}
                >
                  {item.positive ? '+' : ''}
                  {item.amount}
                </Text>
              </View>
            ))
          )}
        </View>

        {SHOW_IAP_CREDITS ? (
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => setShowPurchaseSheet(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.buyBtnText}>💳 Buy credits</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.creditsInfo}>
            <Text style={styles.creditsInfoTitle}>Need more credits?</Text>
            <Text style={styles.creditsInfoBody}>
              Credit packs are managed on speedi.co.uk — sign in to your account from any
              web browser to top up.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Only mount the IAP sheet (and pull in expo-iap) once the user
          has tapped Buy. Avoids loading StoreKit on every Rewards
          visit. */}
      {showPurchaseSheet && (
        <Suspense fallback={null}>
          <CreditsPurchaseSheet
            visible={showPurchaseSheet}
            onClose={() => setShowPurchaseSheet(false)}
          />
        </Suspense>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  codeText: {
    color: '#E64A19',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    color: '#60A5FA',
    fontSize: 12,
    marginTop: 10,
  },
  shareBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statValue: {
    color: '#E64A19',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  affiliatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E64A19',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#E64A19',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  affiliatePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  affiliatePillChevron: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
    opacity: 0.9,
  },
  historyCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyEmpty: {
    color: '#6B7280',
    fontSize: 13,
    paddingVertical: 12,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  historyDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  historyIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  historyDesc: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  historyDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  creditsInfo: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  creditsInfoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  creditsInfoBody: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
  },
});

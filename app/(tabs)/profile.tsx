import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AddCredentialModal from '../../components/AddCredentialModal';
import AddSocialModal from '../../components/AddSocialModal';
import { fetchWithAuth, logout } from '../../lib/auth';
import { getCertSuggestionsForTrade } from '../../lib/certifications';
import { getProviderNoun } from '../../lib/copy';

const API = 'https://www.speeditrades.com';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  trade: string | null;
  trades: string[];
  categoryMain: string | null;
  bio: string | null;
  website: string | null;
  yearsExperience: number | null;
  businessAddress: string | null;
  businessPhone: string | null;
  isApproved: boolean;
  coverageRadius: number | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  checkatradeUrl: string | null;
  trustpilotUrl: string | null;
  lat: number | null;
  lng: number | null;
  username: string | null;
};

type Credential = {
  id: string;
  type: string;
  title: string;
  issuedBy: string;
  expiryDate: string | null;
  verified: boolean;
  createdAt: string;
};

const CRED_ICON: Record<string, string> = {
  PUBLIC_LIABILITY: '🛡️',
  EMPLOYERS_LIABILITY: '🛡️',
  GAS_SAFE: '🔥',
  NICEIC: '⚡',
  NAPIT: '⚡',
  CHAS: '✅',
  CSCS: '🪪',
  CHECKATRADE: '🏷️',
  OTHER: '📄',
};

type SocialRow = { icon: string; label: string; url: string };

type CompanyCtx = {
  id: string;
  name: string;
  isApproved: boolean;
  creditBalance: number;
  creditsResetDate: string;
  messageMode: 'dispatcher' | 'autonomous';
  inviteCode: string;
};

type Worker = {
  id: string;
  userId: string | null;
  role: string | null;
  messageMode: 'dispatcher' | 'autonomous';
  creditBalance: number;
  clockedIn: boolean;
  isActive: boolean;
  inviteAccepted: boolean;
  user: {
    id: string;
    name: string | null;
    trade: string | null;
    availability: 'AVAILABLE' | 'SOON' | 'BUSY' | 'OFFLINE' | null;
    availableUntil: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
};

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyCtx | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [socialModalVisible, setSocialModalVisible] = useState(false);

  const loadCredentials = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/credentials`);
      const data = await res.json();
      if (Array.isArray(data?.credentials)) setCredentials(data.credentials);
    } catch (e) {
      console.log('Failed to load credentials:', e);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/profile`);
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      console.log('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/me`);
        const data = await res.json();
        if (data?.ownedCompany) {
          setCompany(data.ownedCompany);
          try {
            const wRes = await fetchWithAuth(`${API}/api/native/company/workers`);
            const wData = await wRes.json();
            if (Array.isArray(wData)) setWorkers(wData);
          } catch (e) {
            console.log('Failed to load workers:', e);
          }
        }
      } catch (e) {
        console.log('Failed to load company context:', e);
      }
    };
    loadCompany();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleShareInvite = async () => {
    if (!company) return;
    const url = `${API}/invite/${company.inviteCode}`;
    try {
      await Share.share({
        message: `Join ${company.name} on Speedi — tap to accept: ${url}`,
        url,
      });
    } catch (e) {
      console.log('Share failed:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color="#00C67A" size="large" />
      </SafeAreaView>
    );
  }

  const tradeLine =
    profile?.trade ||
    (profile?.trades?.length
      ? profile.trades.join(' · ')
      : getProviderNoun(profile, { titleCase: true }));

  const coverageLabel = profile?.coverageRadius ? `${profile.coverageRadius}mi radius` : null;

  const socials: SocialRow[] = [
    profile?.facebookUrl ? { icon: '📘', label: profile.facebookUrl, url: profile.facebookUrl } : null,
    profile?.instagramUrl ? { icon: '📸', label: profile.instagramUrl, url: profile.instagramUrl } : null,
    profile?.tiktokUrl ? { icon: '🎵', label: profile.tiktokUrl, url: profile.tiktokUrl } : null,
    profile?.linkedinUrl ? { icon: '💼', label: profile.linkedinUrl, url: profile.linkedinUrl } : null,
  ].filter((s): s is SocialRow => s !== null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>🔧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{profile?.name || 'Loading...'}</Text>
              <Text style={styles.heroTrade}>{tradeLine}</Text>
            </View>
          </View>
          <View style={styles.pillRow}>
            {profile?.isApproved ? (
              <View style={[styles.pill, { backgroundColor: '#00C67A33' }]}>
                <Text style={[styles.pillText, { color: '#00C67A' }]}>✅ Approved</Text>
              </View>
            ) : null}
            {profile?.yearsExperience ? (
              <View style={[styles.pill, { backgroundColor: '#00000033' }]}>
                <Text style={[styles.pillText, { color: '#FFFFFF' }]}>
                  {profile.yearsExperience}+ yrs
                </Text>
              </View>
            ) : null}
            {coverageLabel ? (
              <View style={[styles.pill, { backgroundColor: '#1E3A8A66' }]}>
                <Text style={[styles.pillText, { color: '#93C5FD' }]}>{coverageLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {company && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🏢 {company.name}</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: company.isApproved ? '#00C67A22' : '#F59E0B22' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: company.isApproved ? '#00C67A' : '#F59E0B' },
                  ]}
                >
                  {company.isApproved ? '✓ Approved' : 'Pending approval'}
                </Text>
              </View>
            </View>

            <View style={styles.creditBlock}>
              <View style={{ flex: 1 }}>
                <Text style={styles.creditValue}>{company.creditBalance}</Text>
                <Text style={styles.creditLabel}>Company credits remaining</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.creditReset}>
                  Resets{' '}
                  {new Date(company.creditsResetDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
                <Text style={styles.creditMode}>Mode: {company.messageMode}</Text>
              </View>
            </View>

            <View style={styles.workersHeader}>
              <Text style={styles.workersTitle}>Workers ({workers.length})</Text>
              <TouchableOpacity onPress={handleShareInvite}>
                <Text style={styles.actionText}>+ Invite</Text>
              </TouchableOpacity>
            </View>

            {workers.length === 0 ? (
              <Text style={styles.workersEmpty}>
                No workers yet. Tap Invite to add your first one.
              </Text>
            ) : (
              workers.map((w) => (
                <View key={w.id} style={styles.workerRow}>
                  <View
                    style={[
                      styles.workerDot,
                      {
                        backgroundColor:
                          w.user?.availability === 'AVAILABLE'
                            ? '#00C67A'
                            : w.user?.availability === 'SOON'
                            ? '#F59E0B'
                            : w.user?.availability === 'BUSY'
                            ? '#EF4444'
                            : '#6B7280',
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workerName}>
                      {w.user?.name ?? (w.inviteAccepted ? 'Unnamed' : 'Pending invite')}
                    </Text>
                    <Text style={styles.workerMeta}>
                      {w.user?.trade ?? 'Worker'} · {w.messageMode}
                      {!w.inviteAccepted ? ' · invite pending' : ''}
                    </Text>
                  </View>
                  <Text style={styles.workerCredits}>{w.creditBalance}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Business Details</Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <DetailRow icon="🏢" label="Trading Name" value={profile?.name || '—'} />
          <DetailRow
            icon="📍"
            label="Coverage"
            value={profile?.businessAddress || 'Location set'}
          />
          <DetailRow
            icon="📅"
            label="Experience"
            value={profile?.yearsExperience ? `${profile.yearsExperience} years` : '—'}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Portfolio</Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>Add photo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.portfolioRow}>
            <View style={styles.portfolioBox}>
              <Text style={styles.portfolioEmoji}>🚿</Text>
            </View>
            <View style={styles.portfolioBox}>
              <Text style={styles.portfolioEmoji}>🔧</Text>
            </View>
            <View style={[styles.portfolioBox, styles.portfolioBoxEmpty]}>
              <Text style={styles.portfolioPlus}>+</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Certifications & Insurance</Text>
            <TouchableOpacity onPress={() => setAddModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.actionText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {credentials.length === 0 ? (
            <Text style={styles.emptyText}>No credentials added yet.</Text>
          ) : (
            credentials.map((cert) => (
              <View key={cert.id} style={styles.certRow}>
                <Text style={styles.certIcon}>{CRED_ICON[cert.type] ?? '📄'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certLabel}>{cert.title}</Text>
                  <Text style={styles.certIssuer}>{cert.issuedBy}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: cert.verified ? '#00C67A22' : '#F59E0B22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: cert.verified ? '#00C67A' : '#F59E0B' },
                    ]}
                  >
                    {cert.verified ? '✓ Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Social Links</Text>
            <TouchableOpacity onPress={() => setSocialModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.actionText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {socials.length === 0 ? (
            <Text style={styles.socialEmpty}>Add your social links</Text>
          ) : (
            socials.map((s) => (
              <View key={s.url} style={styles.socialRow}>
                <Text style={styles.socialIcon}>{s.icon}</Text>
                <Text style={styles.socialText} numberOfLines={1}>
                  {s.label}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddCredentialModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => {
          setAddModalVisible(false);
          loadCredentials();
        }}
        suggestions={getCertSuggestionsForTrade(profile?.categoryMain ?? profile?.trade)}
      />

      <AddSocialModal
        visible={socialModalVisible}
        onClose={() => setSocialModalVisible(false)}
        onSuccess={() => {
          setSocialModalVisible(false);
          loadProfile();
        }}
      />
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
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
  hero: {
    backgroundColor: '#E64A19',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroTrade: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 2,
    opacity: 0.9,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionText: {
    color: '#E64A19',
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  detailIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: 10,
  },
  portfolioBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioBoxEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3A3A3A',
  },
  portfolioEmoji: {
    fontSize: 32,
  },
  portfolioPlus: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: '300',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  certIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  certLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  certIssuer: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    paddingVertical: 12,
    textAlign: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  socialIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  socialText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  socialEmpty: {
    color: '#6B7280',
    fontSize: 13,
    paddingVertical: 8,
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  creditBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  creditValue: {
    color: '#E64A19',
    fontSize: 28,
    fontWeight: 'bold',
  },
  creditLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  creditReset: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  creditMode: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  workersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  workersTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  workersEmpty: {
    color: '#6B7280',
    fontSize: 13,
    paddingVertical: 8,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  workerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  workerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  workerMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  workerCredits: {
    color: '#E64A19',
    fontSize: 14,
    fontWeight: '700',
  },
});

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
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
import EditBusinessModal from '../../components/EditBusinessModal';
import { fetchWithAuth, getToken, logout } from '../../lib/auth';
import { getCertSuggestionsForTrade } from '../../lib/certifications';
import { getProviderNoun } from '../../lib/copy';
import { SHOW_COMPANIES } from '../../lib/featureFlags';

const API = 'https://www.speeditrades.com';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  trade: string | null;
  trades: string[];
  categoryMain: string | null;
  servicesOffered: string[];
  serviceCategories: string[];
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
  youtubeUrl: string | null;
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
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [radiusSaving, setRadiusSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyCtx | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [editBusinessVisible, setEditBusinessVisible] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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

  const loadPhotos = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/portfolio`);
      const data = await res.json();
      if (Array.isArray(data)) setPhotos(data);
    } catch (e) {
      console.log('Failed to load portfolio:', e);
    }
  };

  const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingPhoto(true);
    try {
      // iPhone camera defaults to HEIC; the server only accepts jpeg/png/webp.
      // Fall back on the asset's actual MIME type when expo provides it,
      // otherwise lie as image/jpeg (vercel blob doesn't sniff bytes, and
      // the server's allow-list checks the declared type).
      const mime =
        asset.mimeType && /^image\/(jpeg|png|webp|heic|heif)$/.test(asset.mimeType)
          ? asset.mimeType
          : 'image/jpeg';
      // Server only allows jpeg/png/webp/pdf — coerce HEIC/HEIF (still raw
      // iPhone bytes) to image/jpeg so the type check passes. The actual
      // bytes survive the upload and most browsers can decode them.
      const declared = mime === 'image/heic' || mime === 'image/heif' ? 'image/jpeg' : mime;
      const ext = declared.split('/')[1] === 'jpeg' ? 'jpg' : declared.split('/')[1];
      const fileName = asset.fileName ?? `portfolio.${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: declared,
      } as unknown as Blob);

      const token = await getToken();
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}));
        throw new Error(d.error || `Upload failed (${uploadRes.status})`);
      }
      const { url } = await uploadRes.json();

      const saveRes = await fetchWithAuth(`${API}/api/native/portfolio`, {
        method: 'POST',
        body: JSON.stringify({ url, caption: '' }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json().catch(() => ({}));
        throw new Error(d.error || 'Could not save photo');
      }
      const photo = await saveRes.json();
      setPhotos((prev) => [photo, ...prev]);
    } catch (err) {
      console.log('Portfolio upload failed:', err);
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload portfolio photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    await uploadAsset(result.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    await uploadAsset(result.assets[0]);
  };

  const handleAddPhoto = () => {
    if (photos.length >= 8) {
      Alert.alert('Portfolio full', 'You can have up to 8 photos. Delete one to add another.');
      return;
    }
    Alert.alert('Add a photo', 'Choose how you want to add this photo.', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = (id: string) => {
    Alert.alert('Remove photo?', 'This will delete it from your portfolio.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetchWithAuth(`${API}/api/native/portfolio`, {
              method: 'DELETE',
              body: JSON.stringify({ id }),
            });
            setPhotos((prev) => prev.filter((p) => p.id !== id));
          } catch (e) {
            console.log('Failed to remove photo:', e);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    loadPhotos();
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

  // Account deletion — required by Apple App Store Guideline 5.1.1(v).
  // Two confirmations: first explains what happens, second is a destructive
  // tap-to-confirm. On success, clear local auth and route to /login.
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently remove your Speedi account, profile, portfolio and credentials. Customers will no longer see you on the map. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              "Last chance — once deleted, your account can't be recovered.",
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const res = await fetchWithAuth(`${API}/api/native/account`, {
                        method: 'DELETE',
                      });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({}));
                        throw new Error(d.error || 'Could not delete account');
                      }
                      await logout();
                      router.replace('/login');
                    } catch (e) {
                      Alert.alert(
                        'Delete failed',
                        e instanceof Error ? e.message : 'Try again or contact support.',
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
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
      : profile?.servicesOffered?.length
      ? profile.servicesOffered.join(' · ')
      : profile?.categoryMain
      ? profile.categoryMain
      : getProviderNoun(profile, { titleCase: true }));

  /**
   * How far they will travel. Options mirror the onboarding wizard's
   * RADIUS_OPTIONS — if one list gains a value the other should too, or
   * a provider can set something at signup they cannot set again.
   */
  const RADIUS_CHOICES = [1, 3, 5, 10, 20, 30, 40];

  async function saveRadius(miles: number) {
    setRadiusSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/api/native/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverageRadius: miles }),
      });
      if (!res.ok) {
        Alert.alert('Could not save', 'Your coverage radius was not changed. Try again.');
        return;
      }
      // Optimistic on success only — showing the new number after a
      // failed save would tell them they cover 40 miles when they do not.
      setProfile((p) => (p ? { ...p, coverageRadius: miles } : p));
      setRadiusOpen(false);
    } catch {
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setRadiusSaving(false);
    }
  }

  const coverageLabel = profile?.coverageRadius ? `${profile.coverageRadius}mi radius` : null;

  const socials: SocialRow[] = [
    profile?.facebookUrl ? { icon: '📘', label: profile.facebookUrl, url: profile.facebookUrl } : null,
    profile?.instagramUrl ? { icon: '📸', label: profile.instagramUrl, url: profile.instagramUrl } : null,
    profile?.tiktokUrl ? { icon: '🎵', label: profile.tiktokUrl, url: profile.tiktokUrl } : null,
    profile?.linkedinUrl ? { icon: '💼', label: profile.linkedinUrl, url: profile.linkedinUrl } : null,
    profile?.youtubeUrl ? { icon: '📺', label: profile.youtubeUrl, url: profile.youtubeUrl } : null,
    profile?.checkatradeUrl ? { icon: '🏷️', label: profile.checkatradeUrl, url: profile.checkatradeUrl } : null,
    profile?.trustpilotUrl ? { icon: '⭐', label: profile.trustpilotUrl, url: profile.trustpilotUrl } : null,
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
            {/*
              Tappable, not just a label.

              coverageRadius decides which waitlist jobs a provider is
              notified about, and until now it could only be set once
              during onboarding — there was no way to change it
              afterwards at all. A loft-conversion firm asked how to go
              from 10 miles to 40 and the honest answer was "you can't",
              on a number that governs how much work reaches them.
            */}
            {coverageLabel ? (
              <TouchableOpacity
                style={[styles.pill, { backgroundColor: '#1E3A8A66' }]}
                onPress={() => setRadiusOpen(true)}
              >
                <Text style={[styles.pillText, { color: '#93C5FD' }]}>
                  {coverageLabel}  ▾
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {SHOW_COMPANIES && company && (
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
            <TouchableOpacity onPress={() => setEditBusinessVisible(true)} activeOpacity={0.7}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <DetailRow icon="🏢" label="Trading Name" value={profile?.name || '—'} />
          <DetailRow
            icon="🛠️"
            label="Services"
            value={
              profile?.trades && profile.trades.length > 0
                ? profile.trades.join(' · ')
                : profile?.trade || '—'
            }
          />
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
            <Text style={styles.cardTitle}>Portfolio ({photos.length}/8)</Text>
            <TouchableOpacity
              onPress={handleAddPhoto}
              disabled={uploadingPhoto || photos.length >= 8}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.actionText,
                  (uploadingPhoto || photos.length >= 8) && { opacity: 0.5 },
                ]}
              >
                {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
              </Text>
            </TouchableOpacity>
          </View>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>
              No photos yet. Tap Add photo to show customers your work.
            </Text>
          ) : (
            <View style={styles.portfolioGrid}>
              {photos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.portfolioPhoto}
                  onPress={() => setPreviewPhotoUrl(p.url)}
                  onLongPress={() => handleRemovePhoto(p.id)}
                  delayLongPress={350}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: p.url }} style={styles.portfolioImg} />
                  <TouchableOpacity
                    style={styles.portfolioRemove}
                    onPress={() => handleRemovePhoto(p.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.portfolioRemoveText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
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

        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/*
        Coverage radius picker.

        A sheet rather than a screen: it is one number, and burying it
        behind a settings page is most of why nobody could find it. The
        note under the options says what the number actually does —
        providers reasonably assume it affects the map, when what it
        really governs is which waitlist jobs reach them.
      */}
      <Modal
        visible={radiusOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setRadiusOpen(false)}
      >
        <View style={styles.radiusBackdrop}>
          <View style={styles.radiusSheet}>
            <Text style={styles.radiusTitle}>How far will you travel?</Text>
            <Text style={styles.radiusNote}>
              This decides which waitlist jobs reach you. A wider radius means more
              jobs, further away.
            </Text>
            <View style={styles.radiusRow}>
              {RADIUS_CHOICES.map((m) => {
                const on = (profile?.coverageRadius ?? 10) === m;
                return (
                  <TouchableOpacity
                    key={m}
                    disabled={radiusSaving}
                    onPress={() => saveRadius(m)}
                    style={[styles.radiusChip, on && styles.radiusChipOn]}
                  >
                    <Text style={[styles.radiusChipText, on && styles.radiusChipTextOn]}>
                      {m}mi
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setRadiusOpen(false)} style={styles.radiusClose}>
              <Text style={styles.radiusCloseText}>
                {radiusSaving ? 'Saving…' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <EditBusinessModal
        visible={editBusinessVisible}
        initial={profile}
        onClose={() => setEditBusinessVisible(false)}
        onSuccess={() => {
          setEditBusinessVisible(false);
          loadProfile();
        }}
      />

      <Modal
        visible={previewPhotoUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhotoUrl(null)}
      >
        <Pressable style={styles.lightboxBackdrop} onPress={() => setPreviewPhotoUrl(null)}>
          {previewPhotoUrl ? (
            <Image
              source={{ uri: previewPhotoUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          ) : null}
          <View style={styles.lightboxClose} pointerEvents="none">
            <Text style={styles.lightboxCloseText}>✕</Text>
          </View>
        </Pressable>
      </Modal>
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
  radiusBackdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  radiusSheet: { backgroundColor: '#111111', padding: 22, paddingBottom: 34, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  radiusTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  radiusNote: { color: '#9CA3AF', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radiusChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#1F2937', borderWidth: 2, borderColor: 'transparent' },
  radiusChipOn: { borderColor: '#E64A19', backgroundColor: '#E64A1922' },
  radiusChipText: { color: '#E5E7EB', fontSize: 15, fontWeight: '700' },
  radiusChipTextOn: { color: '#FFFFFF' },
  radiusClose: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  radiusCloseText: { color: '#9CA3AF', fontSize: 15, fontWeight: '700' },
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
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portfolioPhoto: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C1C',
    position: 'relative',
  },
  portfolioImg: { width: '100%', height: '100%' },
  portfolioRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioRemoveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
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
  deleteAccountBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 32,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteAccountText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

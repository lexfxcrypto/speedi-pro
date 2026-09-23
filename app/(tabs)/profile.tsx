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
import { useT, type Lang } from '../../lib/i18n';

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

// Each language named in itself, so either can be found whichever is on.
const LANG_CHOICES: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'th', label: 'ไทย' },
];

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
  const { t, lang, setLang } = useT();
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
        throw new Error(d.error || t('profile.uploadFailedStatus', { status: uploadRes.status }));
      }
      const { url } = await uploadRes.json();

      const saveRes = await fetchWithAuth(`${API}/api/native/portfolio`, {
        method: 'POST',
        body: JSON.stringify({ url, caption: '' }),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json().catch(() => ({}));
        throw new Error(d.error || t('profile.couldNotSavePhoto'));
      }
      const photo = await saveRes.json();
      setPhotos((prev) => [photo, ...prev]);
    } catch (err) {
      console.log('Portfolio upload failed:', err);
      Alert.alert(t('profile.uploadFailedTitle'), err instanceof Error ? err.message : t('common.retry'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionNeeded'), t('profile.permissionPhotos'));
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
      Alert.alert(t('profile.permissionNeeded'), t('profile.permissionCamera'));
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
      Alert.alert(t('profile.portfolioFullTitle'), t('profile.portfolioFullMessage'));
      return;
    }
    Alert.alert(t('profile.addPhotoTitle'), t('profile.addPhotoMessage'), [
      { text: t('profile.takePhoto'), onPress: takePhoto },
      { text: t('profile.chooseFromLibrary'), onPress: pickFromLibrary },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = (id: string) => {
    Alert.alert(t('profile.removePhotoTitle'), t('profile.removePhotoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.remove'),
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
      t('profile.deleteAccountTitle'),
      t('profile.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteAccountConfirm'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('profile.deleteAccountSureTitle'),
              t('profile.deleteAccountSureMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const res = await fetchWithAuth(`${API}/api/native/account`, {
                        method: 'DELETE',
                      });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({}));
                        throw new Error(d.error || t('profile.couldNotDeleteAccount'));
                      }
                      await logout();
                      router.replace('/login');
                    } catch (e) {
                      Alert.alert(
                        t('profile.deleteFailedTitle'),
                        e instanceof Error ? e.message : t('profile.deleteFailedMessage'),
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
        message: t('profile.inviteShareMessage', { company: company.name, url }),
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
        Alert.alert(t('profile.couldNotSave'), t('profile.radiusNotChanged'));
        return;
      }
      // Optimistic on success only — showing the new number after a
      // failed save would tell them they cover 40 miles when they do not.
      setProfile((p) => (p ? { ...p, coverageRadius: miles } : p));
      setRadiusOpen(false);
    } catch {
      Alert.alert(t('profile.couldNotSave'), t('profile.checkConnection'));
    } finally {
      setRadiusSaving(false);
    }
  }

  const coverageLabel = profile?.coverageRadius
    ? t('profile.radiusPill', { miles: profile.coverageRadius })
    : null;

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
              <Text style={styles.heroName}>{profile?.name || t('common.loading')}</Text>
              <Text style={styles.heroTrade}>{tradeLine}</Text>
            </View>
          </View>
          <View style={styles.pillRow}>
            {profile?.isApproved ? (
              <View style={[styles.pill, { backgroundColor: '#00C67A33' }]}>
                <Text style={[styles.pillText, { color: '#00C67A' }]}>{t('profile.approved')}</Text>
              </View>
            ) : null}
            {profile?.yearsExperience ? (
              <View style={[styles.pill, { backgroundColor: '#00000033' }]}>
                <Text style={[styles.pillText, { color: '#FFFFFF' }]}>
                  {t('profile.yearsShort', { years: profile.yearsExperience })}
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
                  {company.isApproved ? t('profile.companyApproved') : t('profile.companyPending')}
                </Text>
              </View>
            </View>

            <View style={styles.creditBlock}>
              <View style={{ flex: 1 }}>
                <Text style={styles.creditValue}>{company.creditBalance}</Text>
                <Text style={styles.creditLabel}>{t('profile.companyCreditsRemaining')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.creditReset}>
                  {t('profile.companyResets', {
                    date: new Date(company.creditsResetDate).toLocaleDateString(
                      lang === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB',
                      { day: 'numeric', month: 'short' },
                    ),
                  })}
                </Text>
                <Text style={styles.creditMode}>
                  {t('profile.companyMode', {
                    mode:
                      company.messageMode === 'dispatcher'
                        ? t('profile.modeDispatcher')
                        : t('profile.modeAutonomous'),
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.workersHeader}>
              <Text style={styles.workersTitle}>{t('profile.workersTitle', { count: workers.length })}</Text>
              <TouchableOpacity onPress={handleShareInvite}>
                <Text style={styles.actionText}>{t('profile.invite')}</Text>
              </TouchableOpacity>
            </View>

            {workers.length === 0 ? (
              <Text style={styles.workersEmpty}>{t('profile.workersEmpty')}</Text>
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
                      {w.user?.name ?? (w.inviteAccepted ? t('profile.workerUnnamed') : t('profile.workerPendingInvite'))}
                    </Text>
                    <Text style={styles.workerMeta}>
                      {w.user?.trade ?? t('profile.workerFallback')} ·{' '}
                      {w.messageMode === 'dispatcher'
                        ? t('profile.modeDispatcher')
                        : t('profile.modeAutonomous')}
                      {!w.inviteAccepted ? t('profile.workerInvitePending') : ''}
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
            <Text style={styles.cardTitle}>{t('profile.businessDetails')}</Text>
            <TouchableOpacity onPress={() => setEditBusinessVisible(true)} activeOpacity={0.7}>
              <Text style={styles.actionText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
          <DetailRow icon="🏢" label={t('profile.tradingName')} value={profile?.name || '—'} />
          <DetailRow
            icon="🛠️"
            label={t('profile.services')}
            value={
              profile?.trades && profile.trades.length > 0
                ? profile.trades.join(' · ')
                : profile?.trade || '—'
            }
          />
          <DetailRow
            icon="📍"
            label={t('profile.coverage')}
            value={profile?.businessAddress || t('profile.locationSet')}
          />
          <DetailRow
            icon="📅"
            label={t('profile.experience')}
            value={
              profile?.yearsExperience
                ? t('profile.experienceYears', { years: profile.yearsExperience })
                : '—'
            }
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.portfolioTitle', { count: photos.length })}</Text>
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
                {uploadingPhoto ? t('profile.uploading') : t('profile.addPhoto')}
              </Text>
            </TouchableOpacity>
          </View>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>{t('profile.portfolioEmpty')}</Text>
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
            <Text style={styles.cardTitle}>{t('profile.certsTitle')}</Text>
            <TouchableOpacity onPress={() => setAddModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.actionText}>{t('profile.add')}</Text>
            </TouchableOpacity>
          </View>
          {credentials.length === 0 ? (
            <Text style={styles.emptyText}>{t('profile.certsEmpty')}</Text>
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
                    {cert.verified ? t('profile.certVerified') : t('profile.certPending')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.socialTitle')}</Text>
            <TouchableOpacity onPress={() => setSocialModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.actionText}>{t('profile.add')}</Text>
            </TouchableOpacity>
          </View>
          {socials.length === 0 ? (
            <Text style={styles.socialEmpty}>{t('profile.socialEmpty')}</Text>
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

        {/*
          Language. The same chips as the radius sheet, so it reads as part
          of the app rather than a bolted-on setting; the choice is saved
          and beats the phone's own language from then on.
        */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('common.language')}</Text>
          </View>
          <View style={styles.radiusRow}>
            {LANG_CHOICES.map((c) => {
              const on = lang === c.lang;
              return (
                <TouchableOpacity
                  key={c.lang}
                  onPress={() => setLang(c.lang)}
                  style={[styles.radiusChip, on && styles.radiusChipOn]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.radiusChipText, on && styles.radiusChipTextOn]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>{t('profile.logOut')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteAccountText}>{t('profile.deleteAccount')}</Text>
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
            <Text style={styles.radiusTitle}>{t('profile.radiusTitle')}</Text>
            <Text style={styles.radiusNote}>{t('profile.radiusNote')}</Text>
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
                      {t('profile.radiusChip', { miles: m })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setRadiusOpen(false)} style={styles.radiusClose}>
              <Text style={styles.radiusCloseText}>
                {radiusSaving ? t('common.saving') : t('common.done')}
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
    // Transparent: the app's dark background and its watermark live in
    // the tabs layout now, one layer behind every screen.
    backgroundColor: 'transparent',
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

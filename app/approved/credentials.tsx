import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth, getToken } from '../../lib/auth';
import { useT, type TKey } from '../../lib/i18n';

const API = 'https://www.speeditrades.com';

const REQUIRED_BY_TIER: Record<string, string[]> = {
  mobile: ['profile_photo', 'public_liability_insurance', 'trade_certification', 'photo_id'],
  premises: [
    'profile_photo',
    'public_liability_insurance',
    'trade_certification',
    'photo_id',
    'business_address',
    'companies_house',
  ],
};

const DOC_LABELS: Record<string, TKey> = {
  profile_photo: 'approved.docProfilePhoto',
  public_liability_insurance: 'approved.docPublicLiability',
  trade_certification: 'approved.docTradeCertification',
  photo_id: 'approved.docPhotoId',
  business_address: 'approved.docBusinessAddress',
  companies_house: 'approved.docCompaniesHouse',
};

type Doc = {
  id: string;
  documentType: string;
  status: string;
  confidence: number;
  summary: string;
  flags: string[];
  detectedName: string | null;
  registrationNumber: string | null;
  expiryDate: string | null;
  fileUrl: string;
};

export default function ApprovedCredentials() {
  const { t } = useT();
  const router = useRouter();
  const [tier, setTier] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [approvedRes, docsRes] = await Promise.all([
        fetchWithAuth(`${API}/api/approved`),
        fetchWithAuth(`${API}/api/approved/documents`),
      ]);
      console.log(
        '[/approved/credentials] approved status:', approvedRes.status,
        'docs status:', docsRes.status,
      );
      const approvedData = await approvedRes.json();
      const docsData = await docsRes.json();
      console.log('[/approved/credentials] approvedData:', JSON.stringify(approvedData));
      setTier(approvedData?.tier ?? null);
      if (Array.isArray(docsData?.documents)) setDocs(docsData.documents);
    } catch (e) {
      console.log('Failed to load credentials state:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const latestFor = (type: string): Doc | undefined =>
    docs.find((d) => d.documentType === type);

  type PickedAsset = { uri: string; name: string; mimeType: string };

  const normaliseImageAsset = (
    asset: ImagePicker.ImagePickerAsset,
    fallbackName: string,
  ): PickedAsset => {
    const raw =
      asset.mimeType && /^image\/(jpeg|png|webp|heic|heif)$/.test(asset.mimeType)
        ? asset.mimeType
        : 'image/jpeg';
    // Server's allow-list rejects HEIC/HEIF — declare as JPEG so the type check
    // passes; raw bytes survive the upload and decode fine downstream.
    const declared = raw === 'image/heic' || raw === 'image/heif' ? 'image/jpeg' : raw;
    const ext = declared.split('/')[1] === 'jpeg' ? 'jpg' : declared.split('/')[1];
    return {
      uri: asset.uri,
      name: asset.fileName ?? `${fallbackName}.${ext}`,
      mimeType: declared,
    };
  };

  const pickFromCamera = async (type: string): Promise<PickedAsset | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('approved.permissionNeeded'), t('approved.cameraPermissionBody'));
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.92,
    });
    if (result.canceled) return null;
    return normaliseImageAsset(result.assets[0], type);
  };

  const pickFromLibrary = async (type: string): Promise<PickedAsset | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('approved.permissionNeeded'), t('approved.libraryPermissionBody'));
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.92,
    });
    if (result.canceled) return null;
    return normaliseImageAsset(result.assets[0], type);
  };

  const pickFromFiles = async (): Promise<PickedAsset | null> => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]) return null;
    const asset = picked.assets[0];
    return {
      uri: asset.uri,
      name: asset.name ?? 'document',
      mimeType: asset.mimeType ?? 'application/octet-stream',
    };
  };

  const uploadAsset = async (type: string, asset: PickedAsset) => {
    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
      } as unknown as Blob);

      const token = await getToken();
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error ?? t('approved.uploadFailed'));
      }
      const { url } = await uploadRes.json();

      const verifyRes = await fetchWithAuth(`${API}/api/approved/verify-document`, {
        method: 'POST',
        body: JSON.stringify({ fileUrl: url, documentType: type }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(result.error ?? t('approved.verificationFailed'));
      }

      const newDoc: Doc = {
        id: result.id,
        documentType: type,
        status: result.status,
        confidence: result.confidence,
        summary: result.summary ?? '',
        flags: result.flags ?? [],
        detectedName: result.extracted?.name ?? null,
        registrationNumber: result.extracted?.registrationNumber ?? null,
        expiryDate: result.extracted?.expiryDate ?? null,
        fileUrl: url,
      };
      setDocs((prev) => [newDoc, ...prev.filter((d) => d.documentType !== type)]);

      if (result.badgeJustApplied) {
        Alert.alert(t('approved.badgeLiveTitle'), t('approved.badgeLiveBody'), [
          { text: t('common.done'), onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert(
        t('approved.uploadFailed'),
        e instanceof Error ? e.message : t('approved.pleaseTryAgain'),
      );
    } finally {
      setUploadingType(null);
    }
  };

  const handleUpload = (type: string) => {
    if (uploadingType) return;
    Alert.alert(
      t('approved.addDocumentTitle'),
      t('approved.addDocumentBody'),
      [
        {
          text: t('approved.takePhoto'),
          onPress: async () => {
            const asset = await pickFromCamera(type);
            if (asset) await uploadAsset(type, asset);
          },
        },
        {
          text: t('approved.chooseFromCameraRoll'),
          onPress: async () => {
            const asset = await pickFromLibrary(type);
            if (asset) await uploadAsset(type, asset);
          },
        },
        {
          text: t('approved.chooseFilePdf'),
          onPress: async () => {
            const asset = await pickFromFiles();
            if (asset) await uploadAsset(type, asset);
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const requiredDocs = tier ? REQUIRED_BY_TIER[tier] ?? [] : [];
  const allApproved =
    requiredDocs.length > 0 &&
    requiredDocs.every((t) => latestFor(t)?.status === 'approved');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('approved.verifyCredentials')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#E64A19" />
        </View>
      ) : !tier ? (
        <View style={styles.body}>
          <Text style={styles.emptyText}>{t('approved.notEnrolled')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {allApproved ? (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#00C67A' }]}>
              <Text style={styles.cardTitle}>{t('approved.allVerifiedTitle')}</Text>
              <Text style={styles.cardBody}>{t('approved.allVerifiedBody')}</Text>
            </View>
          ) : (
            <Text style={styles.intro}>{t('approved.uploadIntro')}</Text>
          )}
          {requiredDocs.map((type) => (
            <DocSlot
              key={type}
              type={type}
              latest={latestFor(type)}
              uploading={uploadingType === type}
              onUpload={() => handleUpload(type)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DocSlot({
  type,
  latest,
  uploading,
  onUpload,
}: {
  type: string;
  latest: Doc | undefined;
  uploading: boolean;
  onUpload: () => void;
}) {
  const { t, lang } = useT();
  const label = DOC_LABELS[type] ? t(DOC_LABELS[type]) : type;
  const status = latest?.status;

  let pillColor = '#6B7280';
  let pillLabel = t('approved.notUploaded');
  let pillIcon = '•';
  if (status === 'approved') {
    pillColor = '#00C67A';
    pillLabel = t('approved.verified');
    pillIcon = '✓';
  } else if (status === 'pending') {
    pillColor = '#F59E0B';
    pillLabel = t('approved.needsReview');
    pillIcon = '⚠';
  } else if (status === 'rejected') {
    pillColor = '#EF4444';
    pillLabel = t('approved.rejected');
    pillIcon = '✕';
  }

  return (
    <View style={styles.docCard}>
      <View style={styles.docHeader}>
        <Text style={styles.docLabel}>{label}</Text>
        <View style={[styles.pill, { backgroundColor: `${pillColor}22` }]}>
          <Text style={[styles.pillText, { color: pillColor }]}>
            {pillIcon} {pillLabel}
          </Text>
        </View>
      </View>

      {latest?.summary ? (
        <Text style={styles.docSummary}>{latest.summary}</Text>
      ) : (
        <Text style={styles.docSummary}>{t('approved.notUploadedYet')}</Text>
      )}

      {status === 'approved' ? (
        <View style={styles.metaBlock}>
          {latest?.registrationNumber ? (
            <Text style={styles.metaText}>
              {t('approved.regNumber', { value: latest.registrationNumber })}
            </Text>
          ) : null}
          {latest?.expiryDate ? (
            <Text style={styles.metaText}>
              {t('approved.expires', { value: latest.expiryDate })}
            </Text>
          ) : null}
          {latest?.detectedName ? (
            <Text style={styles.metaText}>
              {t('approved.detectedName', { value: latest.detectedName })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {status === 'pending' ? (
        <Text style={[styles.metaText, { color: '#F59E0B' }]}>
          {t('approved.checkWithin24h')}
        </Text>
      ) : null}

      {status === 'rejected' && latest?.flags && latest.flags.length > 0 ? (
        <Text style={[styles.metaText, { color: '#EF4444' }]}>
          {latest.flags.join(' · ')}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={onUpload}
        disabled={uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <ActivityIndicator color="#E64A19" />
        ) : (
          <Text style={styles.uploadButtonText}>
            {latest
              ? t('approved.uploadAnother')
              : t('approved.uploadDoc', {
                  // Lower-casing suits the English sentence only; the Thai
                  // labels carry proper nouns (Gas Safe, NICEIC) that must keep
                  // their capitals.
                  doc: lang === 'en' ? label.toLowerCase() : label,
                })}
          </Text>
        )}
      </TouchableOpacity>
    </View>
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
    gap: 14,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 40,
  },
  intro: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 18,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  docCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  docLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  docSummary: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  metaBlock: {
    gap: 2,
    marginBottom: 10,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  uploadButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#E64A19',
    fontSize: 13,
    fontWeight: '600',
  },
});

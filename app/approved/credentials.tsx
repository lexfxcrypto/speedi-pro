import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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

const DOC_LABELS: Record<string, string> = {
  profile_photo: 'Profile photo',
  public_liability_insurance: 'Public liability insurance',
  trade_certification: 'Trade certification (Gas Safe / NICEIC / OFTEC etc.)',
  photo_id: 'Photo ID (passport or driving licence)',
  business_address: 'Business address verification',
  companies_house: 'Companies House document',
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

  const handleUpload = async (type: string) => {
    if (uploadingType) return;

    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name ?? 'document',
        type: asset.mimeType ?? 'application/octet-stream',
      } as unknown as Blob);

      const token = await getToken();
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error ?? 'Upload failed');
      }
      const { url } = await uploadRes.json();

      const verifyRes = await fetchWithAuth(`${API}/api/approved/verify-document`, {
        method: 'POST',
        body: JSON.stringify({ fileUrl: url, documentType: type }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(result.error ?? 'Verification failed');
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
        Alert.alert('Badge active 🎉', 'All credentials verified — your badge is live.', [
          { text: 'Done', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert(
        'Upload failed',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setUploadingType(null);
    }
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
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify credentials</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#E64A19" />
        </View>
      ) : !tier ? (
        <View style={styles.body}>
          <Text style={styles.emptyText}>
            You&apos;re not enrolled in Speedi Approved yet. Sign up first to upload
            credentials.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {allApproved ? (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#00C67A' }]}>
              <Text style={styles.cardTitle}>All documents verified ✓</Text>
              <Text style={styles.cardBody}>
                Your Speedi Approved badge is active. Re-upload any document below
                if it changes or expires.
              </Text>
            </View>
          ) : (
            <Text style={styles.intro}>
              Upload each required document. Verification is automatic and usually
              takes a few seconds.
            </Text>
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
  const label = DOC_LABELS[type] ?? type;
  const status = latest?.status;

  let pillColor = '#6B7280';
  let pillLabel = 'Not uploaded';
  let pillIcon = '•';
  if (status === 'approved') {
    pillColor = '#00C67A';
    pillLabel = 'Verified';
    pillIcon = '✓';
  } else if (status === 'pending') {
    pillColor = '#F59E0B';
    pillLabel = 'Needs review';
    pillIcon = '⚠';
  } else if (status === 'rejected') {
    pillColor = '#EF4444';
    pillLabel = 'Rejected';
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
        <Text style={styles.docSummary}>Not uploaded yet</Text>
      )}

      {status === 'approved' ? (
        <View style={styles.metaBlock}>
          {latest?.registrationNumber ? (
            <Text style={styles.metaText}>Reg: {latest.registrationNumber}</Text>
          ) : null}
          {latest?.expiryDate ? (
            <Text style={styles.metaText}>Expires: {latest.expiryDate}</Text>
          ) : null}
          {latest?.detectedName ? (
            <Text style={styles.metaText}>Name: {latest.detectedName}</Text>
          ) : null}
        </View>
      ) : null}

      {status === 'pending' ? (
        <Text style={[styles.metaText, { color: '#F59E0B' }]}>
          We&apos;ll check this within 24 hours.
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
            {latest ? 'Upload another' : `Upload ${label.toLowerCase()}`}
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

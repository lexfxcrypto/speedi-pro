import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../lib/auth';

const API = 'https://www.speeditrades.com';
const THEME = '#E64A19';

type Platform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'checkatrade'
  | 'trustpilot';

const PLATFORMS: { key: Platform; label: string; icon: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'instagram.com/yourname' },
  { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'facebook.com/yourpage' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'tiktok.com/@yourname' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'linkedin.com/in/yourname' },
  { key: 'youtube', label: 'YouTube', icon: '📺', placeholder: 'youtube.com/@yourchannel' },
  { key: 'checkatrade', label: 'Checkatrade', icon: '🏷️', placeholder: 'checkatrade.com/your-profile' },
  { key: 'trustpilot', label: 'Trustpilot', icon: '⭐', placeholder: 'trustpilot.com/review/yourbusiness' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddSocialModal({ visible, onClose, onSuccess }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const platform = PLATFORMS.find((p) => p.key === selectedPlatform)!;

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Enter a URL or username');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const field = `${selectedPlatform}Url`;
      const res = await fetchWithAuth(`${API}/api/native/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: url.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setUrl('');
      setSelectedPlatform('instagram');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={submitting}>
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add social link</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Platform</Text>
          <View style={styles.pillWrap}>
            {PLATFORMS.map((p) => {
              const selected = selectedPlatform === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.choicePill,
                    selected && { backgroundColor: THEME, borderColor: THEME },
                  ]}
                  onPress={() => setSelectedPlatform(p.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.choicePillText, selected && { color: '#FFFFFF' }]}>
                    {p.icon} {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder={platform.placeholder}
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerCancel: { color: '#9CA3AF', fontSize: 15, fontWeight: '500', minWidth: 60 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  headerSpacer: { minWidth: 60 },
  body: { padding: 20 },
  fieldGroup: { marginTop: 18 },
  fieldLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choicePill: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choicePillText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 48,
  },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 16, textAlign: 'center' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  submitButton: {
    backgroundColor: THEME,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

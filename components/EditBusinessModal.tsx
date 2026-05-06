import { useEffect, useState } from 'react';
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
import { TRADE_CATEGORIES } from '../lib/trades';

const API = 'https://www.speeditrades.com';
const THEME = '#E64A19';

type ProfileFields = {
  name: string | null;
  phone: string | null;
  bio: string | null;
  trade: string | null;
  trades: string[];
  yearsExperience: number | null;
  businessAddress: string | null;
  website: string | null;
};

type Props = {
  visible: boolean;
  initial: ProfileFields | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditBusinessModal({ visible, initial, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [trades, setTrades] = useState<string[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && initial) {
      setName(initial.name ?? '');
      setPhone(initial.phone ?? '');
      setBio(initial.bio ?? '');
      setYearsExperience(initial.yearsExperience != null ? String(initial.yearsExperience) : '');
      setBusinessAddress(initial.businessAddress ?? '');
      setWebsite(initial.website ?? '');
      setTrades(initial.trades?.length ? initial.trades : initial.trade ? [initial.trade] : []);
      setExpandedCat(null);
      setError('');
    }
  }, [visible, initial]);

  const toggleTrade = (t: string) => {
    setTrades((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const yearsNum = yearsExperience.trim() ? parseInt(yearsExperience, 10) : null;
      const body: Record<string, unknown> = {
        name: name.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        yearsExperience: Number.isFinite(yearsNum) ? yearsNum : null,
        businessAddress: businessAddress.trim() || null,
        website: website.trim() || null,
        trades,
        trade: trades[0] ?? null,
      };
      const res = await fetchWithAuth(`${API}/api/native/profile`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
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
          <Text style={styles.headerTitle}>Edit profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Trading name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Alex Plumbing & Heating"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Services you offer ({trades.length} selected)
            </Text>
            <View style={styles.servicesNote}>
              <Text style={styles.servicesNoteText}>
                You will only get job and quote requests for the services you select here.
              </Text>
            </View>

            {trades.length > 0 && (
              <View style={styles.selectedChipWrap}>
                {trades.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.selectedChip}
                    onPress={() => toggleTrade(t)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.selectedChipText}>{t} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.categoryList}>
              {Object.entries(TRADE_CATEGORIES).map(([cat, options]) => {
                const isOpen = expandedCat === cat;
                return (
                  <View key={cat} style={styles.categoryBlock}>
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => setExpandedCat(isOpen ? null : cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryHeaderText}>{cat}</Text>
                      <Text style={styles.categoryArrow}>{isOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={styles.tradeChipWrap}>
                        {options.map((t) => {
                          const selected = trades.includes(t);
                          return (
                            <TouchableOpacity
                              key={t}
                              style={[
                                styles.tradeChip,
                                selected && { backgroundColor: THEME, borderColor: THEME },
                              ]}
                              onPress={() => toggleTrade(t)}
                              activeOpacity={0.85}
                            >
                              <Text
                                style={[styles.tradeChipText, selected && { color: '#FFFFFF' }]}
                              >
                                {t}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>About</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell customers about your experience..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.fieldLabel}>Years experience</Text>
              <TextInput
                style={styles.input}
                value={yearsExperience}
                onChangeText={setYearsExperience}
                placeholder="e.g. 10"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="07xxx"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Coverage / business address</Text>
            <TextInput
              style={styles.input}
              value={businessAddress}
              onChangeText={setBusinessAddress}
              placeholder="e.g. SE15 — 10 mile radius"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://"
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
              <Text style={styles.submitButtonText}>Save profile</Text>
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
  body: { padding: 20, paddingBottom: 40 },
  fieldGroup: { marginTop: 18 },
  fieldLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  servicesNote: {
    backgroundColor: 'rgba(230,74,25,0.1)',
    borderColor: 'rgba(230,74,25,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  servicesNoteText: { color: THEME, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  selectedChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  selectedChip: {
    backgroundColor: THEME,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  categoryList: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryBlock: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#111111',
  },
  categoryHeaderText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  categoryArrow: { color: '#9CA3AF', fontSize: 11 },
  tradeChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
    backgroundColor: '#0A0A0A',
  },
  tradeChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tradeChipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
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

import DateTimePicker from '@react-native-community/datetimepicker';
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
import type { CertSuggestion } from '../lib/certifications';

const API = 'https://www.speeditrades.com';
const THEME = '#E64A19';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suggestions: CertSuggestion[];
};

export default function AddCredentialModal({
  visible,
  onClose,
  onSuccess,
  suggestions,
}: Props) {
  const initial = suggestions[0] ?? null;
  const [selectedSuggestion, setSelectedSuggestion] = useState<CertSuggestion | null>(initial);
  const [title, setTitle] = useState(initial?.label ?? '');
  const [issuedBy, setIssuedBy] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePickSuggestion = (s: CertSuggestion) => {
    setSelectedSuggestion(s);
    setTitle(s.label);
  };

  const handleSubmit = async () => {
    if (!selectedSuggestion?.enumValue) {
      setError('Pick a credential type');
      return;
    }
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!issuedBy.trim()) {
      setError('Issuer is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API}/api/native/credentials`, {
        method: 'POST',
        body: JSON.stringify({
          type: selectedSuggestion.enumValue,
          title: title.trim(),
          issuedBy: issuedBy.trim(),
          expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add credential');
      }
      setSelectedSuggestion(initial);
      setTitle(initial?.label ?? '');
      setIssuedBy('');
      setExpiryDate(null);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add credential');
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
          <Text style={styles.headerTitle}>Add credential</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Credential type</Text>
          <View style={styles.pillWrap}>
            {suggestions.map((s) => {
              const selected = selectedSuggestion?.label === s.label;
              return (
                <TouchableOpacity
                  key={s.label}
                  style={[
                    styles.choicePill,
                    selected && { backgroundColor: THEME, borderColor: THEME },
                  ]}
                  onPress={() => handlePickSuggestion(s)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.choicePillText, selected && { color: '#FFFFFF' }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedSuggestion?.description ? (
            <Text style={styles.helperText}>{selectedSuggestion.description}</Text>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Gas Safe Register"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Issued by</Text>
            <TextInput
              style={styles.input}
              value={issuedBy}
              onChangeText={setIssuedBy}
              placeholder="e.g. Gas Safe Register Ltd"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Expiry date (optional)</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.dateText, !expiryDate && { color: '#6B7280' }]}>
                {expiryDate
                  ? expiryDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Tap to set'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={expiryDate ?? new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    setExpiryDate(selectedDate);
                  }
                }}
              />
            )}
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
              <Text style={styles.submitButtonText}>Save credential</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerCancel: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
    minWidth: 60,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    minWidth: 60,
  },
  body: {
    padding: 20,
  },
  fieldGroup: {
    marginTop: 18,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choicePillText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

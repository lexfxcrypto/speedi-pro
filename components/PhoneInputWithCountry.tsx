import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Country = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

const COUNTRIES: Country[] = [
  { iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { iso: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪' },
  { iso: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸' },
  { iso: 'PT', name: 'Portugal', dial: '351', flag: '🇵🇹' },
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { iso: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹' },
  { iso: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱' },
  { iso: 'BE', name: 'Belgium', dial: '32', flag: '🇧🇪' },
  { iso: 'CH', name: 'Switzerland', dial: '41', flag: '🇨🇭' },
  { iso: 'AT', name: 'Austria', dial: '43', flag: '🇦🇹' },
  { iso: 'GR', name: 'Greece', dial: '30', flag: '🇬🇷' },
  { iso: 'CY', name: 'Cyprus', dial: '357', flag: '🇨🇾' },
  { iso: 'MT', name: 'Malta', dial: '356', flag: '🇲🇹' },
  { iso: 'SE', name: 'Sweden', dial: '46', flag: '🇸🇪' },
  { iso: 'NO', name: 'Norway', dial: '47', flag: '🇳🇴' },
  { iso: 'DK', name: 'Denmark', dial: '45', flag: '🇩🇰' },
  { iso: 'FI', name: 'Finland', dial: '358', flag: '🇫🇮' },
  { iso: 'PL', name: 'Poland', dial: '48', flag: '🇵🇱' },
  { iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' },
  { iso: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺' },
  { iso: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
  { iso: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦' },
];

function splitE164(value: string, fallbackIso: string): { iso: string; national: string } {
  if (!value || !value.startsWith('+')) {
    return { iso: fallbackIso, national: value.replace(/^\+?/, '') };
  }
  const digits = value.slice(1);
  const sortedByLen = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sortedByLen) {
    if (digits.startsWith(c.dial)) {
      return { iso: c.iso, national: digits.slice(c.dial.length) };
    }
  }
  return { iso: fallbackIso, national: digits };
}

interface Props {
  value: string;
  onChange: (e164: string) => void;
  defaultIso?: string;
  editable?: boolean;
  placeholder?: string;
  placeholderTextColor?: string;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  defaultIso = 'GB',
  editable = true,
  placeholder = 'Phone number',
  placeholderTextColor = '#6B7280',
}: Props) {
  const split = useMemo(() => splitE164(value, defaultIso), [value, defaultIso]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const country = COUNTRIES.find((c) => c.iso === split.iso) ?? COUNTRIES[0];

  function emit(nextIso: string, nextNational: string) {
    const cleaned = nextNational.replace(/[^0-9]/g, '').replace(/^0+/, '');
    const nextDial = COUNTRIES.find((c) => c.iso === nextIso)?.dial ?? '44';
    onChange(cleaned ? `+${nextDial}${cleaned}` : '');
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.codeButton}
        onPress={() => setPickerOpen(true)}
        disabled={!editable}
      >
        <Text style={styles.codeText}>
          {country.flag} +{country.dial}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
      </Pressable>
      <TextInput
        style={styles.input}
        value={split.national}
        onChangeText={(next) => emit(split.iso, next)}
        keyboardType="phone-pad"
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
      />

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Country code</Text>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(c) => c.iso}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  item.iso === split.iso && styles.countryRowActive,
                ]}
                onPress={() => {
                  emit(item.iso, split.national);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.countryLabel}>
                  {item.flag}  {item.name}
                </Text>
                <Text style={styles.countryDial}>+{item.dial}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F23',
  },
  countryRowActive: {
    backgroundColor: '#1A1A1A',
  },
  countryLabel: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  countryDial: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BrandWatermark } from '../components/BrandWatermark';
import { PasswordInput } from '../components/PasswordInput';
import { SignupHero } from '../components/SignupHero';
import { PhoneInputWithCountry } from '../components/PhoneInputWithCountry';
import { register } from '../lib/auth';
import { useT } from '../lib/i18n';

export default function Register() {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    !!name &&
    !!email &&
    !!phoneNumber &&
    !!password &&
    !!confirmPassword &&
    passwordsMatch &&
    !loading;

  const handleCreate = async () => {
    setError('');
    if (!passwordsMatch) {
      setError(t('register.passwordsDontMatch'));
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        name,
        email,
        phoneNumber,
        password,
        role: 'TRADESPERSON',
      });
      if (result.success) {
        router.replace('/onboarding/welcome');
      } else {
        setError(result.error ?? t('register.createFailed'));
      }
    } catch {
      setError(t('register.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/login');
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </TouchableOpacity>
      <BrandWatermark />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Scrolls: the hero made the form taller than an SE with the keyboard up. */}
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <SignupHero />

          <TextInput
            style={styles.input}
            placeholder={t('register.namePlaceholder')}
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={t('register.emailPlaceholder')}
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <PhoneInputWithCountry
            value={phoneNumber}
            onChange={setPhoneNumber}
            editable={!loading}
          />

          <PasswordInput
            placeholder={t('register.passwordPlaceholder')}
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <PasswordInput
            placeholder={t('register.confirmPasswordPlaceholder')}
            placeholderTextColor="#6B7280"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.error}>{t('register.passwordsDontMatch')}</Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('register.createAccount')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('register.haveAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/login')} disabled={loading}>
              <Text style={styles.footerLink}>{t('register.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  flex: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 13,
  },
  footerLink: {
    color: '#E64A19',
    fontSize: 13,
    fontWeight: '600',
  },
});

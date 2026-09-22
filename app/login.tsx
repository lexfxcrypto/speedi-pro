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
import { PasswordInput } from '../components/PasswordInput';
import { SignupHero } from '../components/SignupHero';
import { login } from '../lib/auth';
import { useT } from '../lib/i18n';

export default function Login() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || t('login.invalidCredentials'));
      }
    } catch {
      setError(t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/*
          The first screen a business sees, so it carries the pitch as well
          as the form. Scrolls: the hero makes it taller than an SE with
          the keyboard up.
        */}
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <SignupHero />

          <Text style={styles.title}>{t('login.title')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('login.emailPlaceholder')}
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <PasswordInput
            placeholder={t('login.passwordPlaceholder')}
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.forgotLinkWrap}
            onPress={() => router.push('/forgot-password')}
            disabled={loading}
          >
            <Text style={styles.forgotLink}>{t('login.forgotPassword')}</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('login.signIn')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
              <Text style={styles.footerLink}>{t('login.createOne')}</Text>
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
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  // Second to the hero now, so a label rather than a headline.
  title: {
    color: '#A3A3A3',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
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
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotLink: {
    color: '#E64A19',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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

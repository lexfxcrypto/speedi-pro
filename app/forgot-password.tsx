import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE = 'https://www.speeditrades.com';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.success) {
        setSubmitted(true);
      } else {
        setError('Could not send reset link. Please try again.');
      }
    } catch {
      setError('Could not send reset link. Please try again.');
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
        <View style={styles.container}>
          <Image
            source={require('../assets/images/speedi-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {submitted ? (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.body}>
                If that email matches an account, we&apos;ve sent a link to reset
                your password. The link is valid for 1 hour.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/login')}
                style={styles.backLinkWrap}
              >
                <Text style={styles.link}>← Back to sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter your email and we&apos;ll send you a reset link.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || !email) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading || !email}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Send reset link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/login')}
                disabled={loading}
                style={styles.backLinkWrap}
              >
                <Text style={styles.link}>← Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    alignSelf: 'center',
    height: 240,
    width: 300,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  body: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
    lineHeight: 20,
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
  backLinkWrap: {
    alignSelf: 'center',
    marginTop: 20,
  },
  link: {
    color: '#E64A19',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

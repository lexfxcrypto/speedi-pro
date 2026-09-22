import { useRouter } from 'expo-router';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useT } from '../../lib/i18n';

export default function OnboardingWelcome() {
  const router = useRouter();
  const { t } = useT();

  const handleStart = () => {
    router.replace('/onboarding/wizard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/speedi-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{t('onboarding.welcomeTitle')}</Text>
        <Text style={styles.subtext}>{t('onboarding.welcomeSubtext')}</Text>

        <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{t('onboarding.welcomeStart')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 240,
    width: 300,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

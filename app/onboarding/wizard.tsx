import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SignupIntent = 'sole_trader' | 'company_owner';
type ProviderType = 'trade' | 'service' | 'sports';
type PremisesMode = 'fixed' | 'mobile' | 'both';

const TOTAL_STEPS = 7;

const THEME_TRADE = '#E64A19';
const THEME_SERVICE = '#7C3AED';
const THEME_SPORTS = '#2D5016';
const THEME_DEFAULT = '#E64A19';

function getTheme(pt: ProviderType | null): string {
  if (pt === 'service') return THEME_SERVICE;
  if (pt === 'sports') return THEME_SPORTS;
  if (pt === 'trade') return THEME_TRADE;
  return THEME_DEFAULT;
}

function nextStep(from: number, pt: ProviderType | null): number {
  if (from === 2 && pt === 'sports') return 4;
  return from + 1;
}

function previousStep(from: number, pt: ProviderType | null): number {
  if (from === 4 && pt === 'sports') return 2;
  return from - 1;
}

const PROVIDER_OPTIONS: Array<{
  key: ProviderType;
  title: string;
  subtext: string;
  color: string;
}> = [
  { key: 'trade', title: 'Trade', subtext: 'Plumber, electrician, builder…', color: THEME_TRADE },
  { key: 'service', title: 'Service', subtext: 'Beauty, fitness, tutoring…', color: THEME_SERVICE },
  { key: 'sports', title: 'Sports', subtext: 'Venues, coaching, bookings…', color: THEME_SPORTS },
];

const PREMISES_OPTIONS: Array<{ key: PremisesMode; title: string; subtext: string }> = [
  { key: 'mobile', title: 'Mobile', subtext: 'I travel to customers' },
  { key: 'fixed', title: 'Fixed', subtext: 'Customers come to me' },
  { key: 'both', title: 'Both', subtext: 'Mix of both' },
];

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [signupIntent, setSignupIntent] = useState<SignupIntent | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [premisesMode, setPremisesMode] = useState<PremisesMode | null>(null);

  // Reserved for Steps 4–7 (Phase 2E-β / γ). Declared here so the final wizard
  // has its full state shape in one place; setters are currently only invoked
  // by handleStartOver().
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [otherSuggestions, setOtherSuggestions] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [otherJobDescription, setOtherJobDescription] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [postcode, setPostcode] = useState('');
  const [radius, setRadius] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [goLive, setGoLive] = useState(false);

  const theme = getTheme(providerType);

  // TODO Phase 2E-β/γ: haptic feedback on tile taps (expo-haptics is already a dep).
  const handleSignupIntent = (intent: SignupIntent) => {
    setSignupIntent(intent);
    setStep(nextStep(1, providerType));
  };

  const handleProviderType = (pt: ProviderType) => {
    setProviderType(pt);
    setStep(nextStep(2, pt));
  };

  const handlePremisesMode = (pm: PremisesMode) => {
    setPremisesMode(pm);
    setStep(nextStep(3, providerType));
  };

  const handleBack = () => {
    setStep(previousStep(step, providerType));
  };

  const handleStartOver = () => {
    setStep(1);
    setSignupIntent(null);
    setProviderType(null);
    setPremisesMode(null);
    setSelectedCategory(null);
    setShowOtherInput(false);
    setOtherText('');
    setOtherSuggestions([]);
    setSelectedJobs([]);
    setOtherJobDescription('');
    setName('');
    setBusinessName('');
    setYearsExp('');
    setPostcode('');
    setRadius('');
    setPhotoUrl(null);
    setPhotoUploading(false);
    setGoLive(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { backgroundColor: step >= i + 1 ? theme : '#333333' },
              ]}
            />
          ))}
        </View>

        {step >= 2 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <View>
              <Text style={styles.heading}>I&apos;m joining as…</Text>

              <TouchableOpacity
                style={[
                  styles.tallTile,
                  signupIntent === 'sole_trader' && { borderColor: theme },
                ]}
                onPress={() => handleSignupIntent('sole_trader')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tileTitle,
                    signupIntent === 'sole_trader' && { color: theme },
                  ]}
                >
                  Sole trader
                </Text>
                <Text style={styles.tileSubtext}>Self-employed, just me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tallTile,
                  signupIntent === 'company_owner' && { borderColor: theme },
                ]}
                onPress={() => handleSignupIntent('company_owner')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tileTitle,
                    signupIntent === 'company_owner' && { color: theme },
                  ]}
                >
                  Company owner
                </Text>
                <Text style={styles.tileSubtext}>I employ workers</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.heading}>What are you?</Text>
              {PROVIDER_OPTIONS.map((opt) => {
                const selected = providerType === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.tallTile,
                      selected && { borderColor: opt.color },
                    ]}
                    onPress={() => handleProviderType(opt.key)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.tileTitle, selected && { color: opt.color }]}
                    >
                      {opt.title}
                    </Text>
                    <Text style={styles.tileSubtext}>{opt.subtext}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.heading}>How do you work?</Text>
              {PREMISES_OPTIONS.map((opt) => {
                const selected = premisesMode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.mediumTile,
                      selected && { borderColor: theme },
                    ]}
                    onPress={() => handlePremisesMode(opt.key)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.tileTitle, selected && { color: theme }]}
                    >
                      {opt.title}
                    </Text>
                    <Text style={styles.tileSubtext}>{opt.subtext}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step >= 4 && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.heading}>Phase 2E-α complete</Text>
              <Text style={styles.placeholderSubtext}>
                Steps 4–7 coming in 2E-β/γ.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme }]}
                onPress={handleStartOver}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Start over</Text>
              </TouchableOpacity>
            </View>
          )}
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
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,
  },
  backPlaceholder: {
    height: 44,
    marginTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 8,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  tallTile: {
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 20,
    marginBottom: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  mediumTile: {
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 18,
    marginBottom: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tileSubtext: {
    color: '#6B7280',
    fontSize: 14,
  },
  placeholderContainer: {
    alignItems: 'stretch',
  },
  placeholderSubtext: {
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 32,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { getToken } from '../../lib/auth';
import { SERVICE_CATEGORIES, SERVICE_CATEGORIES_LIST } from '../../lib/services';
import { SPORTS_CATEGORIES } from '../../lib/sports';
import { TRADE_CATEGORIES } from '../../lib/trades';

const API_BASE = 'https://www.speeditrades.com';

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

const YEARS_OPTIONS = ['Under 1 year', '1-3 years', '3-10 years', '10+ years'];

const RADIUS_OPTIONS: Array<{ display: string; value: string }> = [
  { display: '1mi', value: '1' },
  { display: '3mi', value: '3' },
  { display: '5mi', value: '5' },
  { display: '10mi', value: '10' },
  { display: '20mi', value: '20' },
];

type CategoryOption = { name: string; emoji?: string };

function getCategoryOptions(pt: ProviderType | null): CategoryOption[] {
  if (pt === 'trade') {
    return Object.keys(TRADE_CATEGORIES).map((name) => ({ name }));
  }
  if (pt === 'service') {
    return SERVICE_CATEGORIES_LIST.map((c) => ({ name: c.name, emoji: c.emoji }));
  }
  if (pt === 'sports') {
    return [
      ...Object.keys(SPORTS_CATEGORIES).map((name) => ({ name })),
      { name: 'Other' },
    ];
  }
  return [];
}

function getJobsForCategory(pt: ProviderType | null, cat: string | null): string[] {
  if (!cat) return [];
  if (pt === 'trade') return TRADE_CATEGORIES[cat] ?? [];
  if (pt === 'service') return SERVICE_CATEGORIES[cat] ?? [];
  if (pt === 'sports') return SPORTS_CATEGORIES[cat] ?? [];
  return [];
}

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [signupIntent, setSignupIntent] = useState<SignupIntent | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [premisesMode, setPremisesMode] = useState<PremisesMode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [otherJobDescription, setOtherJobDescription] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [postcode, setPostcode] = useState('');
  const [radius, setRadius] = useState('10');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Reserved for Step 7 (Phase 2E-γ). Setters currently only invoked by
  // handleStartOver().
  const [otherSuggestions, setOtherSuggestions] = useState<string[]>([]);
  const [goLive, setGoLive] = useState(false);

  const theme = getTheme(providerType);
  const categoryOptions = getCategoryOptions(providerType);
  const isOtherCategoryPath = showOtherInput || !selectedCategory;
  const jobsForCategory = getJobsForCategory(providerType, selectedCategory);

  const canContinue = (() => {
    if (step === 4) return !!selectedCategory || !!otherText.trim();
    if (step === 5) return true;
    if (step === 6) return !!name.trim() && !!postcode.trim();
    return true;
  })();

  // TODO Phase 2E-γ: haptic feedback on tile taps (expo-haptics is already a dep).
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

  const handleCategoryTap = (catName: string) => {
    if (catName === 'Other') {
      setSelectedCategory(null);
      setShowOtherInput(true);
      return;
    }
    setSelectedCategory(catName);
    setShowOtherInput(false);
    setOtherText('');
  };

  const toggleJob = (job: string) => {
    setSelectedJobs((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    );
  };

  const handleContinue = () => {
    setStep(nextStep(step, providerType));
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
    setSelectedJobs([]);
    setOtherJobDescription('');
    setName('');
    setBusinessName('');
    setYearsExp('');
    setPostcode('');
    setRadius('10');
    setPhotoUrl(null);
    setPhotoUploading(false);
    setOtherSuggestions([]);
    setGoLive(false);
  };

  const handlePhotoPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo access to upload a profile photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setPhotoUploading(true);

    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const { url } = await response.json();
      setPhotoUrl(url);
    } catch (err) {
      console.error('[photo upload]', err);
      Alert.alert(
        'Upload failed',
        err instanceof Error ? err.message : 'Please try again'
      );
    } finally {
      setPhotoUploading(false);
    }
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

          {step === 4 && (
            <View>
              <Text style={styles.heading}>What&apos;s your category?</Text>
              <View style={styles.pillWrap}>
                {categoryOptions.map((opt) => {
                  const isOther = opt.name === 'Other';
                  const selected = isOther ? showOtherInput : selectedCategory === opt.name;
                  return (
                    <TouchableOpacity
                      key={opt.name}
                      style={[
                        styles.pill,
                        selected && { borderColor: theme },
                      ]}
                      onPress={() => handleCategoryTap(opt.name)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[styles.pillText, selected && { color: theme }]}
                      >
                        {opt.emoji ? `${opt.emoji} ${opt.name}` : opt.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showOtherInput && (
                <TextInput
                  style={styles.otherInput}
                  placeholder="Describe your category"
                  placeholderTextColor="#6B7280"
                  value={otherText}
                  onChangeText={setOtherText}
                  autoCapitalize="words"
                />
              )}
              {/* TODO Phase 2 polish: add /api/custom-categories autocomplete suggestions, matches web pattern */}
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.heading}>What specifically do you offer?</Text>
              {isOtherCategoryPath ? (
                <TextInput
                  style={styles.multilineInput}
                  placeholder="Describe what you offer in a sentence or two"
                  placeholderTextColor="#6B7280"
                  value={otherJobDescription}
                  onChangeText={setOtherJobDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              ) : (
                <>
                  <Text style={styles.step5Subtext}>Select all that apply</Text>
                  <View style={styles.pillWrap}>
                    {jobsForCategory.map((job) => {
                      const selected = selectedJobs.includes(job);
                      return (
                        <TouchableOpacity
                          key={job}
                          style={[
                            styles.choicePill,
                            selected && { backgroundColor: theme, borderColor: theme },
                          ]}
                          onPress={() => toggleJob(job)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.choicePillText,
                              selected && { color: '#FFFFFF' },
                            ]}
                          >
                            {job}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={styles.heading}>Your profile</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Your name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Smith"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Business or trading name (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Smith Plumbing Ltd"
                  placeholderTextColor="#6B7280"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Years in business</Text>
                <View style={styles.pillWrap}>
                  {YEARS_OPTIONS.map((opt) => {
                    const selected = yearsExp === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.choicePill,
                          selected && { backgroundColor: theme, borderColor: theme },
                        ]}
                        onPress={() => setYearsExp(selected ? '' : opt)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            selected && { color: '#FFFFFF' },
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Coverage postcode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. PR1"
                  placeholderTextColor="#6B7280"
                  value={postcode}
                  onChangeText={setPostcode}
                  onBlur={() => setPostcode((p) => p.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Service radius: {radius} miles</Text>
                <View style={styles.pillWrap}>
                  {RADIUS_OPTIONS.map((opt) => {
                    const selected = radius === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.choicePill,
                          selected && { backgroundColor: theme, borderColor: theme },
                        ]}
                        onPress={() => setRadius(opt.value)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            selected && { color: '#FFFFFF' },
                          ]}
                        >
                          {opt.display}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Profile photo (optional)</Text>
                <View style={styles.photoContainer}>
                  <TouchableOpacity
                    style={[
                      styles.photoPicker,
                      photoUrl
                        ? { borderStyle: 'solid', borderColor: theme }
                        : { borderStyle: 'dashed', borderColor: '#6B7280' },
                    ]}
                    onPress={handlePhotoPick}
                    disabled={photoUploading}
                    activeOpacity={0.85}
                  >
                    {photoUploading ? (
                      <ActivityIndicator color={theme} />
                    ) : photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.photoImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.photoEmoji}>📷</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {step >= 7 && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.heading}>Phase 2E-β-2 complete</Text>
              <Text style={styles.placeholderSubtext}>
                Step 7 (final submit) coming in 2E-γ.
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

        {(step === 4 || step === 5 || step === 6) && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: theme },
                !canContinue && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!canContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
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
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  otherInput: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginTop: 16,
  },
  multilineInput: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  step5Subtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
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
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  photoPicker: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoEmoji: {
    fontSize: 28,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth, getToken } from '../../lib/auth';
import { SHOW_COMPANIES } from '../../lib/featureFlags';
import { useT, type TKey, categoryLabel } from '../../lib/i18n';
import { SERVICE_CATEGORIES, SERVICE_CATEGORIES_LIST } from '../../lib/services';
import { matchesServiceQuery } from '../../lib/serviceAliases';
import { SPORTS_CATEGORIES } from '../../lib/sports';
import { TRADE_CATEGORIES } from '../../lib/trades';

const API_BASE = 'https://www.speeditrades.com';

type SignupIntent = 'sole_trader' | 'company_owner';
type ProviderType = 'trade' | 'service' | 'sports' | 'merchant';
type PremisesMode = 'fixed' | 'mobile' | 'both';
type LocationPermissionStatus = 'unasked' | 'granted' | 'denied';

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

function nextStep(
  from: number,
  pt: ProviderType | null,
  isConcierge = false,
): number {
  if (from === 2 && pt === 'sports') return 4;
  // Merchant path: skip premises (always fixed) + category picker
  // (they pick multiple trades stocked on step 5 instead). 2 → 5.
  if (from === 2 && pt === 'merchant') return 5;
  // Trade concierge skips the single-category picker (step 4) entirely —
  // they pick everything they cover on a flat multi-category list at
  // step 5 instead.
  if (from === 3 && pt === 'trade' && isConcierge) return 5;
  return from + 1;
}

function previousStep(
  from: number,
  pt: ProviderType | null,
  isConcierge = false,
): number {
  if (from === 4 && pt === 'sports') return 2;
  // Mirror nextStep's skip — back from step 5 lands on step 3 when
  // we're on the concierge path.
  if (from === 5 && pt === 'trade' && isConcierge) return 3;
  // Merchant: mirror the forward skip. Back from step 5 → step 2.
  if (from === 5 && pt === 'merchant') return 2;
  return from - 1;
}

// Wizard-side tile identifier. 'trade_concierge' is a special tile that
// sets providerType='trade' + isTradeConcierge=true under the hood — it's
// not a real ProviderType value on the User row.
type ProviderTile = ProviderType | 'trade_concierge';

const PROVIDER_OPTIONS: Array<{
  key: ProviderTile;
  title: TKey;
  subtext: TKey;
  color: string;
}> = [
  { key: 'trade', title: 'onboarding.providerTrade', subtext: 'onboarding.providerTradeSubtext', color: THEME_TRADE },
  {
    key: 'trade_concierge',
    title: 'onboarding.providerConcierge',
    subtext: 'onboarding.providerConciergeSubtext',
    color: THEME_TRADE,
  },
  { key: 'service', title: 'onboarding.providerService', subtext: 'onboarding.providerServiceSubtext', color: THEME_SERVICE },
  { key: 'sports', title: 'onboarding.providerSports', subtext: 'onboarding.providerSportsSubtext', color: THEME_SPORTS },
  {
    key: 'merchant',
    title: 'onboarding.providerMerchant',
    subtext: 'onboarding.providerMerchantSubtext',
    color: THEME_TRADE,
  },
];

const PREMISES_OPTIONS: Array<{ key: PremisesMode; title: TKey; subtext: TKey }> = [
  { key: 'mobile', title: 'onboarding.premisesMobile', subtext: 'onboarding.premisesMobileSubtext' },
  { key: 'fixed', title: 'onboarding.premisesFixed', subtext: 'onboarding.premisesFixedSubtext' },
  { key: 'both', title: 'onboarding.premisesBoth', subtext: 'onboarding.premisesBothSubtext' },
];

// The value is what the server stores; only the label is translated.
const YEARS_OPTIONS: Array<{ value: string; label: TKey }> = [
  { value: 'Under 1 year', label: 'onboarding.yearsUnder1' },
  { value: '1-3 years', label: 'onboarding.years1to3' },
  { value: '3-10 years', label: 'onboarding.years3to10' },
  { value: '10+ years', label: 'onboarding.years10plus' },
];

/**
 * How far they will travel.
 *
 * This is not cosmetic — coverageRadius decides which waitlist jobs a
 * provider is notified about (see notifyProvidersOfWaitingRequest), so
 * capping it at 20 quietly capped how much work they could be offered.
 *
 * 30 and 40 added 2026-09-04 after a loft-conversion firm asked for 40:
 * a specialist travels further than a plumber, because there are fewer
 * of them and the jobs are bigger. The old ceiling was set for
 * call-out trades and applied to everyone.
 */
const RADIUS_OPTIONS: Array<{ value: string }> = [
  { value: '1' },
  { value: '3' },
  { value: '5' },
  { value: '10' },
  { value: '20' },
  { value: '30' },
  { value: '40' },
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
  const router = useRouter();
  const { t } = useT();
  const [step, setStep] = useState(SHOW_COMPANIES ? 1 : 2);
  const [signupIntent, setSignupIntent] = useState<SignupIntent | null>(
    SHOW_COMPANIES ? null : 'sole_trader',
  );
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [isTradeConcierge, setIsTradeConcierge] = useState(false);
  const [premisesMode, setPremisesMode] = useState<PremisesMode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [otherJobDescription, setOtherJobDescription] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  // Merchant-only fields. Only populated + submitted when the Merchant
  // tile was picked on step 2 — otherwise they stay empty and the
  // backend ignores them. Repurpose the existing selectedJobs state
  // for merchant's trades-stocked multi-select so we don't parallel-
  // duplicate state.
  //
  // Address is captured as structured components — number, street,
  // town, county — instead of a single line, so the customer sheet
  // can render a proper multi-line address block. Postcode still
  // comes through the standard step-6 `postcode` field (which also
  // drives lat/lng geocoding + delivery radius).
  const [merchantBuilding, setMerchantBuilding] = useState('');
  const [merchantStreet, setMerchantStreet] = useState('');
  const [merchantTown, setMerchantTown] = useState('');
  const [merchantCounty, setMerchantCounty] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantWebsite, setMerchantWebsite] = useState('');
  const [merchantHours, setMerchantHours] = useState('');
  const [merchantDescription, setMerchantDescription] = useState('');
  const [postcode, setPostcode] = useState('');
  const [radius, setRadius] = useState('10');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [goLive, setGoLive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<LocationPermissionStatus>('unasked');

  const theme = getTheme(providerType);
  const categoryOptions = getCategoryOptions(providerType);
  const isOtherCategoryPath = showOtherInput || !selectedCategory;
  const jobsForCategory = getJobsForCategory(providerType, selectedCategory);
  /**
   * Free-text filter over the category's jobs.
   *
   * Aesthetics alone runs to 27 services, and they're listed in clinical
   * terms — a clinic looking for what they'd call botox has to know it's
   * filed under "Anti-Wrinkle Injections" and scroll to find it. The
   * alias table maps the spoken word to the lawful one, so typing it
   * works without the brand ever being displayed.
   */
  const [jobQuery, setJobQuery] = useState('');
  const visibleJobs = jobQuery.trim()
    ? jobsForCategory.filter((j) => matchesServiceQuery(j, jobQuery))
    : jobsForCategory;

  const canContinue = (() => {
    if (step === 4) return !!selectedCategory || !!otherText.trim();
    if (step === 5) {
      // Merchant path: require the essential public-facing fields
      // (address + phone) + at least one trade stocked. Description
      // and email are optional at signup; they can fill them later.
      if (providerType === 'merchant') {
        return (
          !!merchantStreet.trim() &&
          !!merchantTown.trim() &&
          !!merchantPhone.trim() &&
          selectedJobs.length > 0
        );
      }
      // Concierge path skipped step 4 — require at least one trade
      // ticked across the multi-category list before letting them
      // advance. Without this, a concierge could land on the profile
      // step with empty trades[] and no waitlist matching.
      if (isTradeConcierge) return selectedJobs.length > 0;
      return true;
    }
    if (step === 6) return !!name.trim() && !!postcode.trim();
    return true;
  })();

  // TODO Phase 2 polish: haptic feedback on tile taps (expo-haptics is already a dep).
  const handleSignupIntent = (intent: SignupIntent) => {
    setSignupIntent(intent);
    setStep(nextStep(1, providerType));
  };

  const handleProviderType = (tile: ProviderTile) => {
    if (tile === 'trade_concierge') {
      // Concierge runs through the standard 'trade' flow; the boolean
      // flag drives map styling + customer-facing labelling later.
      setProviderType('trade');
      setIsTradeConcierge(true);
      setStep(nextStep(2, 'trade'));
      return;
    }
    if (tile === 'merchant') {
      // Merchants always have fixed premises — auto-set so the
      // backend + skipped step 3 stay consistent.
      setProviderType('merchant');
      setPremisesMode('fixed');
      setIsTradeConcierge(false);
      setStep(nextStep(2, 'merchant'));
      return;
    }
    setProviderType(tile);
    setIsTradeConcierge(false);
    setStep(nextStep(2, tile));
  };

  const handlePremisesMode = (pm: PremisesMode) => {
    setPremisesMode(pm);
    setStep(nextStep(3, providerType, isTradeConcierge));
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
    // Drop the previous category's filter, or its leftover text makes
    // the new category look empty.
    setJobQuery('');
  };

  const toggleJob = (job: string) => {
    setSelectedJobs((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    );
  };

  const handleContinue = () => {
    setStep(nextStep(step, providerType, isTradeConcierge));
  };

  const handleBack = () => {
    setStep(previousStep(step, providerType, isTradeConcierge));
  };

  const handleAskLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status === 'granted' ? 'granted' : 'denied');
  };

  const handlePhotoPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('onboarding.photoPermissionTitle'),
        t('onboarding.photoPermissionBody')
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

      if (!response.ok) throw new Error(t('onboarding.uploadFailedStatus', { status: response.status }));

      const { url } = await response.json();
      setPhotoUrl(url);
    } catch (err) {
      console.error('[photo upload]', err);
      Alert.alert(
        t('onboarding.uploadFailedTitle'),
        err instanceof Error ? err.message : t('onboarding.pleaseTryAgain')
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);

    try {
      const isOther = showOtherInput;
      const isMerchant = providerType === 'merchant';
      const payload = {
        signupIntent,
        providerType,
        isTradeConcierge: providerType === 'trade' ? isTradeConcierge : false,
        isMerchant,
        // Merchants are always fixed premises. Sports pre-fixed for
        // legacy reasons. Everything else uses whatever the user picked.
        premisesMode:
          isMerchant || providerType === 'sports' ? 'fixed' : premisesMode,
        // Concierge users skipped the single-category picker — set a
        // sentinel "Trade Concierge" as their primary category so the
        // map pin has a sensible label, but their actual coverage lives
        // in `trades[]` which is derived from selectedJobs.
        // Merchants: sentinel "Merchant" for the same reason.
        categoryMain: isMerchant
          ? 'Merchant'
          : isTradeConcierge
            ? 'Trade Concierge'
            : isOther
              ? otherText.trim()
              : selectedCategory,
        isCustomCategory: isOther && !isMerchant,
        // Merchant's selectedJobs = trades they stock. Cross-write to
        // trades[]/trade so filter matching works (same pattern as
        // Trade Concierge). service/sports don't set jobTypes.
        jobTypes:
          providerType === 'service'
            ? []
            : selectedJobs,
        servicesOffered:
          providerType === 'service' || providerType === 'sports'
            ? selectedJobs
            : undefined,
        otherJobDescription: isOther ? otherJobDescription.trim() : undefined,
        // Merchant-specific fields — backend ignores them for non-merchant
        // providerTypes, safe to always send.
        merchantBuilding: isMerchant ? merchantBuilding.trim() : undefined,
        merchantStreet: isMerchant ? merchantStreet.trim() : undefined,
        merchantTown: isMerchant ? merchantTown.trim() : undefined,
        merchantCounty: isMerchant ? merchantCounty.trim() : undefined,
        merchantPhone: isMerchant ? merchantPhone.trim() : undefined,
        merchantEmail: isMerchant
          ? merchantEmail.trim() || undefined
          : undefined,
        merchantWebsite: isMerchant
          ? merchantWebsite.trim() || undefined
          : undefined,
        merchantHours: isMerchant ? merchantHours.trim() : undefined,
        merchantDescription: isMerchant
          ? merchantDescription.trim()
          : undefined,
        name: name.trim(),
        businessName: businessName.trim() || undefined,
        yearsExp,
        // Sent as typed. Uppercasing was for UK postcodes and mangles a place name.
        postcode: postcode.trim(),
        radius,
        goLive,
        photoUrl: photoUrl ?? undefined,
      };

      const response = await fetchWithAuth(`${API_BASE}/api/native/onboarding`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        let errMsg = t('onboarding.setupFailed');
        try {
          const parsed = JSON.parse(body);
          errMsg = parsed.error || parsed.message || errMsg;
        } catch {
          if (body) errMsg = body;
        }
        throw new Error(errMsg);
      }

      router.replace('/onboarding/notifications');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('onboarding.setupFailed')
      );
      setSubmitting(false);
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

        {step >= (SHOW_COMPANIES ? 2 : 3) ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            disabled={submitting}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            <Text style={styles.backText}>{t('common.back')}</Text>
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
              <Text style={styles.heading}>{t('onboarding.joiningAs')}</Text>

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
                  {t('onboarding.soleTrader')}
                </Text>
                <Text style={styles.tileSubtext}>{t('onboarding.soleTraderSubtext')}</Text>
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
                  {t('onboarding.companyOwner')}
                </Text>
                <Text style={styles.tileSubtext}>{t('onboarding.companyOwnerSubtext')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.heading}>{t('onboarding.whatAreYou')}</Text>
              {PROVIDER_OPTIONS.map((opt) => {
                // The two trade tiles share providerType='trade'; use the
                // concierge flag to disambiguate which tile is selected.
                const selected =
                  opt.key === 'trade_concierge'
                    ? providerType === 'trade' && isTradeConcierge
                    : providerType === opt.key && !(opt.key === 'trade' && isTradeConcierge);
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
                      {t(opt.title)}
                    </Text>
                    <Text style={styles.tileSubtext}>{t(opt.subtext)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.heading}>{t('onboarding.howDoYouWork')}</Text>
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
                      {t(opt.title)}
                    </Text>
                    <Text style={styles.tileSubtext}>{t(opt.subtext)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.heading}>{t('onboarding.whatsYourCategory')}</Text>
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
                        {isOther
                          ? t('onboarding.otherCategory')
                          : opt.emoji
                            ? `${opt.emoji} ${categoryLabel(opt.name)}`
                            : categoryLabel(opt.name)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showOtherInput && (
                <TextInput
                  style={styles.otherInput}
                  placeholder={t('onboarding.describeCategory')}
                  placeholderTextColor="#6B7280"
                  value={otherText}
                  onChangeText={setOtherText}
                  autoCapitalize="words"
                />
              )}
              {/* TODO Phase 2 polish: add /api/custom-categories autocomplete suggestions, matches web pattern */}
            </View>
          )}

          {step === 5 && providerType === 'merchant' && (
            <View>
              <Text style={styles.heading}>{t('onboarding.merchantHeading')}</Text>
              <Text style={styles.step5Subtext}>{t('onboarding.merchantIntro')}</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('onboarding.merchantBuildingLabel')}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantBuildingPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantBuilding}
                  onChangeText={setMerchantBuilding}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantStreetLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantStreetPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantStreet}
                  onChangeText={setMerchantStreet}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantTownLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantTownPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantTown}
                  onChangeText={setMerchantTown}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantCountyLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantCountyPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantCounty}
                  onChangeText={setMerchantCounty}
                  autoCapitalize="words"
                />
              </View>

              <Text style={[styles.step5Subtext, { marginTop: 4 }]}>
                {t('onboarding.merchantPostcodeNote')}
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantPhoneLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantPhonePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantPhone}
                  onChangeText={setMerchantPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantEmailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantEmailPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantEmail}
                  onChangeText={setMerchantEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantWebsiteLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantWebsitePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantWebsite}
                  onChangeText={setMerchantWebsite}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantHoursLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.merchantHoursPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantHours}
                  onChangeText={setMerchantHours}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.merchantDescriptionLabel')}</Text>
                <TextInput
                  style={styles.multilineInput}
                  placeholder={t('onboarding.merchantDescriptionPlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={merchantDescription}
                  onChangeText={setMerchantDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Text style={[styles.step5Subtext, { marginTop: 24 }]}>
                {t('onboarding.merchantStockIntro')}
              </Text>
              {Object.entries(TRADE_CATEGORIES).map(([catName, jobs]) => (
                <View key={catName} style={styles.conciergeCatBlock}>
                  <Text style={styles.conciergeCatHeader}>{catName}</Text>
                  <View style={styles.pillWrap}>
                    {(jobs as string[]).map((job) => {
                      const selected = selectedJobs.includes(job);
                      return (
                        <TouchableOpacity
                          key={job}
                          style={[
                            styles.choicePill,
                            selected && {
                              backgroundColor: theme,
                              borderColor: theme,
                            },
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
                            {categoryLabel(job)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              <Text style={styles.conciergeCount}>
                {t(
                  selectedJobs.length === 1
                    ? 'onboarding.categoriesStockedOne'
                    : 'onboarding.categoriesStockedOther',
                  { count: selectedJobs.length },
                )}
              </Text>
            </View>
          )}

          {step === 5 && providerType !== 'merchant' && (
            <View>
              <Text style={styles.heading}>
                {isTradeConcierge
                  ? t('onboarding.whichTrades')
                  : t('onboarding.whatDoYouOffer')}
              </Text>
              {isOtherCategoryPath && !isTradeConcierge ? (
                <TextInput
                  style={styles.multilineInput}
                  placeholder={t('onboarding.describeOffer')}
                  placeholderTextColor="#6B7280"
                  value={otherJobDescription}
                  onChangeText={setOtherJobDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              ) : (
                <>
                  <Text style={styles.step5Subtext}>
                    {isTradeConcierge
                      ? t('onboarding.conciergeIntro')
                      : t('onboarding.selectAll')}
                  </Text>
                  {isTradeConcierge ? (
                    // Concierge: flat list across EVERY trade category,
                    // grouped under category headers. Customer sees the pin
                    // under any matching filter and waitlist notifications
                    // fan out across the whole `trades[]` array on the User
                    // row (see ~/Code/speedi/src/lib/tradeMatchesRequest.ts).
                    <View>
                      {Object.entries(TRADE_CATEGORIES).map(
                        ([catName, jobs]) => (
                          <View key={catName} style={styles.conciergeCatBlock}>
                            <Text style={styles.conciergeCatHeader}>
                              {catName}
                            </Text>
                            <View style={styles.pillWrap}>
                              {(jobs as string[]).map((job) => {
                                const selected = selectedJobs.includes(job);
                                return (
                                  <TouchableOpacity
                                    key={job}
                                    style={[
                                      styles.choicePill,
                                      selected && {
                                        backgroundColor: theme,
                                        borderColor: theme,
                                      },
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
                                      {categoryLabel(job)}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        ),
                      )}
                      <Text style={styles.conciergeCount}>
                        {t(
                          selectedJobs.length === 1
                            ? 'onboarding.tradesSelectedOne'
                            : 'onboarding.tradesSelectedOther',
                          { count: selectedJobs.length },
                        )}
                      </Text>
                    </View>
                  ) : (
                    <View>
                      {jobsForCategory.length > 12 && (
                        <TextInput
                          style={styles.jobSearch}
                          placeholder={t('onboarding.searchServices')}
                          placeholderTextColor="#6B7280"
                          value={jobQuery}
                          onChangeText={setJobQuery}
                          autoCapitalize="none"
                          autoCorrect={false}
                          clearButtonMode="while-editing"
                        />
                      )}
                      {visibleJobs.length === 0 && (
                        <Text style={styles.jobSearchEmpty}>
                          {t('onboarding.nothingMatches', { query: jobQuery.trim() })}
                        </Text>
                      )}
                    <View style={styles.pillWrap}>
                      {visibleJobs.map((job) => {
                        const selected = selectedJobs.includes(job);
                        const label =
                          premisesMode === 'mobile' &&
                          job.startsWith('Mobile ')
                            ? job.slice(7)
                            : job;
                        return (
                          <TouchableOpacity
                            key={job}
                            style={[
                              styles.choicePill,
                              selected && {
                                backgroundColor: theme,
                                borderColor: theme,
                              },
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
                              {categoryLabel(label)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={styles.heading}>{t('onboarding.yourProfile')}</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.yourName')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.yourNamePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.businessNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.businessNamePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.yearsInBusiness')}</Text>
                <View style={styles.pillWrap}>
                  {YEARS_OPTIONS.map((opt) => {
                    const selected = yearsExp === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.choicePill,
                          selected && { backgroundColor: theme, borderColor: theme },
                        ]}
                        onPress={() => setYearsExp(selected ? '' : opt.value)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            selected && { color: '#FFFFFF' },
                          ]}
                        >
                          {t(opt.label)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.primerCard}>
                <Text style={styles.primerTitle}>{t('onboarding.locationWhyTitle')}</Text>
                <Text style={styles.primerBody}>{t('onboarding.locationWhyBody')}</Text>
                {locationPermissionStatus === 'granted' ? (
                  <View style={[styles.primerButton, styles.primerButtonGranted]}>
                    <Text style={[styles.primerButtonText, { color: '#10B981' }]}>
                      {t('onboarding.locationAllowed')}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.primerButton, { backgroundColor: theme }]}
                    onPress={handleAskLocation}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primerButtonText}>{t('onboarding.allowLocation')}</Text>
                  </TouchableOpacity>
                )}
                {locationPermissionStatus === 'denied' && (
                  <Text style={styles.primerDenialNote}>
                    {t('onboarding.locationDeniedNote')}
                  </Text>
                )}
              </View>

              {/*
                Postcode OR area.
                
                This asked for a "Coverage postcode", uppercased whatever
                was typed, and would not let anybody past step six
                without it. The UAE does not use postcodes, so both Dubai
                clinics on the platform did the only thing available and
                pasted a street address into a field shaped for "PR1" —
                which then failed to geocode, so they signed up and were
                invisible.

                The backend already handles both: geocodeUKPostcode tries
                postcodes.io first and falls through to a worldwide
                lookup for anything that is not postcode-shaped. Only the
                question was wrong.

                autoCapitalize is now 'words' rather than 'characters',
                and the blur-uppercase is gone — "DUBAI MARINA" is not
                how anybody writes a place, and shouting it at the
                geocoder helps nothing.
              */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.postcodeLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('onboarding.postcodePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={postcode}
                  onChangeText={setPostcode}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Text style={styles.fieldHint}>
                  {t('onboarding.postcodeHint')}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.serviceRadius', { radius })}</Text>
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
                          {t('onboarding.radiusOption', { radius: opt.value })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('onboarding.profilePhotoLabel')}</Text>
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

          {step === 7 && (
            <View>
              <Text style={styles.heading}>{t('onboarding.youreReady')}</Text>
              <Text style={styles.step7Body}>{t('onboarding.readyBody')}</Text>

              <View style={styles.goLiveCard}>
                <TouchableOpacity
                  style={styles.goLiveRow}
                  onPress={() => setGoLive(!goLive)}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  <Text style={styles.goLiveLabel}>{t('onboarding.goLiveNow')}</Text>
                  <Switch
                    value={goLive}
                    onValueChange={setGoLive}
                    trackColor={{ true: theme, false: '#2a2a2a' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#2a2a2a"
                    disabled={submitting}
                  />
                </TouchableOpacity>
                <Text style={styles.goLiveSubtext}>
                  {goLive
                    ? t('onboarding.goLiveOnNote')
                    : t('onboarding.goLiveOffNote')}
                </Text>
              </View>
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
              <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 7 && (
          <View style={styles.footer}>
            {submitError ? (
              <Text style={styles.submitError}>{submitError}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: theme },
                submitting && styles.continueButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>{t('onboarding.completeSetup')}</Text>
              )}
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
  conciergeCatBlock: { marginBottom: 18 },
  conciergeCatHeader: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  conciergeCount: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  jobSearch: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 12,
  },
  jobSearchEmpty: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
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
  /** Sub-label under an input — used by the postcode-or-area hint. */
  fieldHint: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
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
  step7Body: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  goLiveCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  goLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goLiveLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goLiveSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
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
  submitError: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  primerCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  primerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  primerBody: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  primerButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primerButtonGranted: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  primerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primerDenialNote: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
});

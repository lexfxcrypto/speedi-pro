import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../../lib/auth';
import { getProviderNoun } from '../../lib/copy';
import { SHOW_IAP_CREDITS } from '../../lib/featureFlags';
import { categoryLabel, getLang, t, useT, type TKey } from '../../lib/i18n';
import { normalisePhone, whatsappUrl } from '../../lib/phone';
// Lazy-mount: keep expo-iap's StoreKit observers out of the JS bundle
// until the user actually wants to buy credits. Same Privacy guard
// risk as the rewards tab. See app/(tabs)/rewards.tsx for context.
const CreditsPurchaseSheet = lazy(() => import('../../components/CreditsPurchaseSheet'));

const API = 'https://www.speeditrades.com';

type Request = {
  id: string;
  jobType: string;
  category: string | null;
  description: string | null;
  customerName: string | null;
  distanceMiles: number | null;
  minutesAgo: number;
  minutesLeft: number;
  createdAt: string;
};

type Job = {
  id: string;
  jobType: string;
  description: string | null;
  status: 'accepted' | 'completed';
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  acceptedAt: string | null;
  /** null = no refund filed yet; otherwise PENDING | APPROVED | REJECTED. */
  refundStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

type MyProfile = {
  id: string;
  name: string | null;
  username: string | null;
  trade: string | null;
};

function timeAgo(minutes: number): string {
  if (minutes < 1) return t('waiting.timeJustNow');
  if (minutes < 60) return t('waiting.timeMinutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('waiting.timeHoursAgo', { count: hours });
  return t('waiting.timeDaysAgo', { count: Math.floor(hours / 24) });
}

function heat(minutes: number): 'hot' | 'warm' | 'cold' {
  if (minutes < 2) return 'hot';
  if (minutes < 10) return 'warm';
  return 'cold';
}

/**
 * How long is left, in words. The window is two hours, so this spends
 * most of its life in the "1h 54m" shape and only drops to bare minutes
 * near the end — which is exactly when it should be shouting.
 */
function timeLeft(minutes: number): string {
  if (minutes <= 0) return t('waiting.timeExpired');
  if (minutes < 60) return t('waiting.timeMinutesLeft', { minutes });
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0
    ? t('waiting.timeHoursLeft', { hours })
    : t('waiting.timeHoursMinutesLeft', { hours, minutes: mins });
}

/**
 * The countdown's colour comes from the time REMAINING, not from the
 * card's heat.
 *
 * Heat measures how new a request is — a competition signal, telling you
 * to move before someone else does. The countdown measures how long until
 * it dies. They are not the same thing and they disagree constantly: a
 * request eleven minutes old is "cold" and still has 1h 49m on the clock.
 * Tinting the countdown with heat would paint that red and say "nearly
 * gone" about a job with most of its life ahead, which is the opposite of
 * what a countdown is for.
 *
 * Thresholds are set against the two-hour window: over an hour is calm,
 * the last twenty minutes are urgent, the middle is a nudge.
 */
function urgencyColor(minutesLeft: number): string {
  if (minutesLeft <= 20) return '#EF4444';
  if (minutesLeft <= 60) return '#F59E0B';
  return '#6B7280';
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatCompletedTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(getLang() === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const HEAT_COLOR = {
  hot: '#00C67A',
  warm: '#F59E0B',
  cold: '#EF4444',
};

export default function Waiting() {
  const router = useRouter();
  const { t } = useT();
  const [requests, setRequests] = useState<Request[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [refundingJob, setRefundingJob] = useState<Job | null>(null);

  const loadRequests = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/waiting-requests`);
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch (e) {
      console.log('Failed to load requests:', e);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/my-jobs`);
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (e) {
      console.log('Failed to load jobs:', e);
    }
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/me`);
        const data = await res.json();
        if (data?.id) setMyProfile(data);
      } catch (e) {
        console.log('Failed to load me:', e);
      }
    };

    loadMe();
    loadRequests();
    loadJobs();
    const interval = setInterval(() => {
      loadRequests();
      loadJobs();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (requestId: string) => {
    setAccepting(requestId);
    try {
      const res = await fetchWithAuth(`${API}/api/native/accept-request`, {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        const customerName = data.customerName ?? t('waiting.greetingFallbackName');
        const customerPhone: string | null = data.customerPhone ?? null;
        Alert.alert(
          t('waiting.acceptedTitle'),
          t(
            data.remainingCredits === 1
              ? 'waiting.acceptedBodyOne'
              : 'waiting.acceptedBodyOther',
            {
              name: data.customerName ?? t('waiting.unknownCustomer'),
              phone: customerPhone || t('waiting.notProvided'),
              count: data.remainingCredits,
            },
          ),
          [
            {
              text: '🟢 WhatsApp',
              onPress: () => {
                if (customerPhone) Linking.openURL(whatsappUrl(customerPhone));
              },
            },
            {
              text: `📞 ${t('waiting.call')}`,
              onPress: () => {
                if (customerPhone) Linking.openURL(`tel:${normalisePhone(customerPhone)}`);
              },
            },
            {
              text: `💬 ${t('waiting.sms')}`,
              onPress: () => {
                if (!customerPhone) return;
                // getProviderNoun falls back to the English 'provider';
                // swap that for the translated word, keep trade names as-is.
                const noun = getProviderNoun(myProfile);
                const message = t('waiting.smsAcceptedMessage', {
                  name: customerName,
                  sender:
                    myProfile?.name ||
                    t('waiting.smsYourProvider', {
                      noun: noun === 'provider' ? t('waiting.providerFallback') : noun,
                    }),
                  business: myProfile?.trade || 'Speedi',
                });
                Linking.openURL(
                  `sms:${normalisePhone(customerPhone)}?body=${encodeURIComponent(message)}`,
                );
              },
            },
            { text: t('waiting.later'), style: 'cancel' },
          ],
        );
        loadJobs();
      } else if (data.code === 'NO_CREDITS') {
        if (SHOW_IAP_CREDITS) {
          Alert.alert(
            t('waiting.notEnoughCreditsTitle'),
            t('waiting.notEnoughCreditsBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('waiting.buyCredits'), onPress: () => setShowPurchaseSheet(true) },
            ],
          );
        } else {
          Alert.alert(
            t('waiting.notEnoughCreditsTitle'),
            t('waiting.notEnoughCreditsWebBody'),
            [{ text: t('common.ok') }],
          );
        }
      } else {
        Alert.alert(t('waiting.errorTitle'), t('waiting.acceptFailed'));
      }
    } catch {
      Alert.alert(t('waiting.errorTitle'), t('waiting.connectionFailed'));
    } finally {
      setAccepting(null);
    }
  };

  const handleComplete = async (job: Job) => {
    setCompleting(job.id);
    try {
      const res = await fetchWithAuth(`${API}/api/native/complete-job`, {
        method: 'POST',
        body: JSON.stringify({ requestId: job.id }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadJobs();

        const customerName = job.customerName ?? t('waiting.greetingFallbackName');
        const customerPhone = job.customerPhone;
        const reviewSlug = myProfile?.username || myProfile?.id;

        Alert.alert(
          t('waiting.jobCompleteTitle'),
          t('waiting.askForReview', { name: customerName }),
          [
            {
              text: t('waiting.reviewViaWhatsApp'),
              onPress: () => {
                if (!customerPhone || !reviewSlug) return;
                const reviewUrl = `https://www.speeditrades.com/review/${reviewSlug}`;
                const message = t('waiting.reviewRequestMessage', {
                  name: customerName,
                  url: reviewUrl,
                });
                Linking.openURL(
                  `${whatsappUrl(customerPhone)}?text=${encodeURIComponent(message)}`,
                );
              },
            },
            {
              text: t('waiting.reviewViaSms'),
              onPress: () => {
                if (!customerPhone || !reviewSlug) return;
                const reviewUrl = `https://www.speeditrades.com/review/${reviewSlug}`;
                const message = t('waiting.reviewRequestMessage', {
                  name: customerName,
                  url: reviewUrl,
                });
                Linking.openURL(
                  `sms:${normalisePhone(customerPhone)}?body=${encodeURIComponent(message)}`,
                );
              },
            },
            { text: t('waiting.maybeLater'), style: 'cancel' },
          ],
        );
      }
    } catch (e) {
      console.log('Failed to complete job:', e);
    } finally {
      setCompleting(null);
    }
  };

  const callPhone = (phone: string | null) => {
    if (phone) Linking.openURL(`tel:${normalisePhone(phone)}`);
  };
  const smsPhone = (phone: string | null) => {
    if (phone) Linking.openURL(`sms:${normalisePhone(phone)}`);
  };
  const emailUser = (email: string | null) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const todayStart = startOfToday();
  // 30-day retention so a mis-tap on "Mark Complete" doesn't permanently
  // hide the customer's contact details + original message.
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeJobs = jobs.filter((j) => j.status === 'accepted');
  const completedRecent = jobs.filter(
    (j) =>
      j.status === 'completed' &&
      j.acceptedAt !== null &&
      new Date(j.acceptedAt).getTime() >= thirtyDaysAgo,
  );
  const todayRequests = requests.filter(
    (r) => new Date(r.createdAt).getTime() >= todayStart,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        stickyHeaderIndices={[0, 2]}
      >
        <View style={styles.stickyHeader}>
          <Text style={styles.sectionTitle}>{t('waiting.activeJobs')}</Text>
        </View>

        <View>
          {activeJobs.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>{t('waiting.noActiveJobs')}</Text>
              <Text style={styles.emptySub}>
                {t('waiting.noActiveJobsHint')}
              </Text>
            </View>
          ) : (
            activeJobs.map((job) => {
              const isCompleting = completing === job.id;
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.jobName}>{job.customerName ?? t('waiting.customer')}</Text>
                    <View style={[styles.statusPill, { backgroundColor: '#00C67A22' }]}>
                      <Text style={[styles.statusText, { color: '#00C67A' }]}>
                        {t('waiting.inProgress')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.jobMeta}>{categoryLabel(job.jobType)}</Text>
                  {job.description ? (
                    <Text style={styles.jobMeta}>{job.description}</Text>
                  ) : null}

                  <View style={styles.contactRow}>
                    <TouchableOpacity
                      style={[
                        styles.contactBtn,
                        { backgroundColor: '#1E3A8A33' },
                        !job.customerPhone && styles.disabled,
                      ]}
                      onPress={() => callPhone(job.customerPhone)}
                      disabled={!job.customerPhone}
                    >
                      <Text style={[styles.contactText, { color: '#60A5FA' }]}>📞 {t('waiting.call')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.contactBtn,
                        { backgroundColor: '#00C67A22' },
                        !job.customerPhone && styles.disabled,
                      ]}
                      onPress={() => smsPhone(job.customerPhone)}
                      disabled={!job.customerPhone}
                    >
                      <Text style={[styles.contactText, { color: '#00C67A' }]}>💬 {t('waiting.sms')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.contactBtn,
                        { backgroundColor: '#1C1C1C' },
                        !job.customerEmail && styles.disabled,
                      ]}
                      onPress={() => emailUser(job.customerEmail)}
                      disabled={!job.customerEmail}
                    >
                      <Text style={[styles.contactText, { color: '#9CA3AF' }]}>✉️ {t('waiting.email')}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bottomRow}>
                    <TouchableOpacity
                      style={[styles.completeBtn, isCompleting && styles.disabled]}
                      onPress={() => handleComplete(job)}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.completeText}>{t('waiting.markComplete')}</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Refund "reclaim credit" footer — quiet by design.
                      Only visible when no refund has been filed yet;
                      once filed, replaced with a status pill. */}
                  {job.refundStatus === null ? (
                    <TouchableOpacity
                      style={styles.refundFooter}
                      onPress={() => setRefundingJob(job)}
                    >
                      <Text style={styles.refundFooterText}>
                        {t('waiting.reportConnectionFooter')}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.refundFooter}>
                      <Text
                        style={[
                          styles.refundFooterText,
                          {
                            color:
                              job.refundStatus === 'APPROVED'
                                ? '#22c55e'
                                : job.refundStatus === 'REJECTED'
                                ? '#ef4444'
                                : '#f59e0b',
                          },
                        ]}
                      >
                        {job.refundStatus === 'APPROVED'
                          ? t('waiting.creditRefunded')
                          : job.refundStatus === 'REJECTED'
                          ? t('waiting.refundDeclined')
                          : t('waiting.refundUnderReview')}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.stickyHeader}>
          <Text style={styles.sectionTitle}>{t('waiting.liveRequests')}</Text>
        </View>

        <View>
          {todayRequests.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>{t('waiting.noRequestsToday')}</Text>
              <Text style={styles.emptySub}>
                {t('waiting.noRequestsHint')}
              </Text>
            </View>
          ) : (
            todayRequests.map((req) => {
              const h = heat(req.minutesAgo);
              const isAccepting = accepting === req.id;
              return (
                <View key={req.id} style={styles.requestCard}>
                  <View style={[styles.heatBar, { backgroundColor: HEAT_COLOR[h] }]} />
                  <View style={styles.requestBody}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.requestTrade}>{req.jobType}</Text>
                      {/* The age used to sit here as a bare "6m ago". It now
                          lives in the expiry strip below, labelled and paired
                          with the time remaining, which is the half that
                          actually tells a trade whether to move. Leaving both
                          put the same number on the card twice. */}
                    </View>
                    {req.description ? (
                      <Text style={styles.requestDesc}>{req.description}</Text>
                    ) : null}
                    <Text style={styles.requestMeta}>
                      {req.distanceMiles !== null
                        ? t('waiting.distanceMiles', { miles: req.distanceMiles })
                        : t('waiting.distanceUnknown')}
                      {req.customerName ? ` · ${req.customerName}` : ''}
                    </Text>

                    {/* Added / expires. The whole argument for the waitlist
                        is that these are time-sensitive jobs rather than
                        stagnant leads, and until now the card gave no way
                        to tell — you could see a request was 40 minutes old
                        without knowing whether that left you 20 minutes or
                        two hours. The list is polled every 20 seconds, so
                        minutesLeft is never more than that stale. */}
                    <View style={styles.expiryStrip}>
                      <Text style={styles.expiryAdded}>
                        {t('waiting.addedAgo', { ago: timeAgo(req.minutesAgo) })}
                      </Text>
                      <Text
                        style={[
                          styles.expiryLeft,
                          { color: urgencyColor(req.minutesLeft) },
                        ]}
                      >
                        {timeLeft(req.minutesLeft)}
                      </Text>
                    </View>

                    <View style={styles.bottomRow}>
                      <TouchableOpacity
                        style={[
                          styles.acceptBtn,
                          (isAccepting || accepting !== null) && styles.disabled,
                        ]}
                        onPress={() => handleAccept(req.id)}
                        disabled={accepting !== null}
                      >
                        {isAccepting ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.acceptText}>{t('waiting.acceptButton')}</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.viewBtn}>
                        <Text style={styles.viewText}>{t('waiting.view')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {completedRecent.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.completedToggle}
              onPress={() => setShowCompleted((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.completedToggleText}>
                {t(
                  completedRecent.length === 1
                    ? 'waiting.recentlyCompletedOne'
                    : 'waiting.recentlyCompletedOther',
                  { count: completedRecent.length },
                )}
              </Text>
              <Text style={styles.completedChevron}>{showCompleted ? '˅' : '›'}</Text>
            </TouchableOpacity>

            {showCompleted &&
              completedRecent.map((job) => (
                <View key={job.id} style={styles.completedCard}>
                  <View style={styles.completedBar} />
                  <View style={styles.completedBody}>
                    <Text style={styles.completedName}>
                      {job.customerName ?? t('waiting.customer')}
                    </Text>
                    <Text style={styles.completedMeta}>{categoryLabel(job.jobType)}</Text>
                    {job.description ? (
                      <Text style={styles.completedDescription}>{job.description}</Text>
                    ) : null}
                    {job.acceptedAt ? (
                      <Text style={styles.completedTime}>
                        {t('waiting.completedAt', { time: formatCompletedTime(job.acceptedAt) })}
                      </Text>
                    ) : null}
                    {job.customerPhone || job.customerEmail ? (
                      <View style={styles.completedActions}>
                        {job.customerPhone ? (
                          <>
                            <TouchableOpacity
                              style={styles.completedActionBtn}
                              onPress={() => callPhone(job.customerPhone)}
                            >
                              <Text style={styles.completedActionText}>📞 {t('waiting.call')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.completedActionBtn}
                              onPress={() => smsPhone(job.customerPhone)}
                            >
                              <Text style={styles.completedActionText}>💬 {t('waiting.sms')}</Text>
                            </TouchableOpacity>
                          </>
                        ) : null}
                        {job.customerEmail ? (
                          <TouchableOpacity
                            style={styles.completedActionBtn}
                            onPress={() => emailUser(job.customerEmail)}
                          >
                            <Text style={styles.completedActionText}>✉ {t('waiting.email')}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={styles.completedNoContact}>
                        {t('waiting.noContactDetails')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
          </>
        )}

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/job-history')}
          activeOpacity={0.8}
        >
          <Text style={styles.historyText}>{t('waiting.viewJobHistory')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {showPurchaseSheet && (
        <Suspense fallback={null}>
          <CreditsPurchaseSheet
            visible={showPurchaseSheet}
            onClose={() => setShowPurchaseSheet(false)}
          />
        </Suspense>
      )}

      <RefundConnectionModal
        job={refundingJob}
        onClose={() => setRefundingJob(null)}
        onSubmitted={() => {
          setRefundingJob(null);
          loadJobs();
        }}
      />
    </SafeAreaView>
  );
}

// Labels are keys, looked up at render so a language switch applies.
const REFUND_REASONS: Array<{ value: string; label: TKey }> = [
  { value: 'NEVER_REPLIED', label: 'waiting.refundReasonNeverReplied' },
  { value: 'PRO_ON_PRO', label: 'waiting.refundReasonProOnPro' },
  { value: 'SPAM', label: 'waiting.refundReasonSpam' },
  { value: 'FAKE_JOB', label: 'waiting.refundReasonFakeJob' },
  { value: 'OTHER', label: 'waiting.refundReasonOther' },
];

function RefundConnectionModal({
  job,
  onClose,
  onSubmitted,
}: {
  job: Job | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useT();
  const [reason, setReason] = useState<string>('NEVER_REPLIED');
  const [reasonNote, setReasonNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset when the modal opens for a new job.
  useEffect(() => {
    if (job) {
      setReason('NEVER_REPLIED');
      setReasonNote('');
      setError('');
    }
  }, [job?.id]);

  if (!job) return null;

  const handleSubmit = async () => {
    if (reason === 'OTHER' && !reasonNote.trim()) {
      setError(t('waiting.refundDescribeIssue'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API}/api/credit-refunds`, {
        method: 'POST',
        body: JSON.stringify({
          waitingRequestId: job.id,
          reason,
          reasonNote: reasonNote.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setError(body.error ?? t('waiting.refundFileFailed'));
      } else {
        onSubmitted();
      }
    } catch {
      setError(t('waiting.refundNetworkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.refundBackdrop} onPress={onClose}>
        <Pressable style={styles.refundSheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.refundHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.refundTitle}>{t('waiting.refundTitle')}</Text>
              <Text style={styles.refundSubtitle} numberOfLines={2}>
                {categoryLabel(job.jobType)}
                {job.description ? ` · "${job.description.slice(0, 60)}${job.description.length > 60 ? '…' : ''}"` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.refundClose}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 4 }}>
            {REFUND_REASONS.map((r) => {
              const selected = reason === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.refundReason, selected && styles.refundReasonSelected]}
                  onPress={() => setReason(r.value)}
                >
                  <View
                    style={[
                      styles.refundRadio,
                      selected && styles.refundRadioSelected,
                    ]}
                  >
                    {selected && <View style={styles.refundRadioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.refundReasonText,
                      selected && styles.refundReasonTextSelected,
                    ]}
                  >
                    {t(r.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TextInput
              value={reasonNote}
              onChangeText={setReasonNote}
              placeholder={
                reason === 'OTHER'
                  ? t('waiting.refundNoteRequired')
                  : t('waiting.refundNoteOptional')
              }
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
              maxLength={2000}
              style={styles.refundNote}
            />

            {error ? <Text style={styles.refundError}>{error}</Text> : null}
          </ScrollView>

          <TouchableOpacity
            style={[styles.refundSubmit, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.refundSubmitText}>{t('waiting.refundSubmit')}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.refundFooterCopy}>
            {t('waiting.refundFooterCopy')}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // Transparent: the app's dark background and its watermark live in
    // the tabs layout now, one layer behind every screen.
    backgroundColor: 'transparent',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  stickyHeader: {
    backgroundColor: '#0A0A0A',
    paddingVertical: 6,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  emptySub: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  jobCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobMeta: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  contactBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: '#E64A19',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#1C1C1C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heatBar: {
    height: 3,
    width: '100%',
  },
  requestBody: {
    padding: 16,
  },
  requestTrade: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  requestDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 6,
  },
  requestMeta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 6,
  },
  expiryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    // Sits on the #111 card without becoming another button — the strip
    // is information, and the accept button below it is the only thing
    // on the card that should read as tappable.
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  expiryAdded: {
    color: '#6B7280',
    fontSize: 12,
  },
  expiryLeft: {
    fontSize: 12,
    fontWeight: 'bold',
    // Colour is set per-row from urgencyColor.
    fontVariant: ['tabular-nums'],
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#E64A19',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewBtn: {
    backgroundColor: '#1C1C1C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#00C67A',
  },
  completedToggleText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedChevron: {
    color: '#6B7280',
    fontSize: 20,
    fontWeight: '300',
  },
  completedCard: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 14,
    marginTop: 10,
    overflow: 'hidden',
    opacity: 0.85,
  },
  completedBar: {
    width: 3,
    backgroundColor: '#00C67A',
  },
  completedBody: {
    flex: 1,
    padding: 12,
  },
  completedName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completedMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  completedDescription: {
    color: '#D4D4D8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  completedTime: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  completedActionBtn: {
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completedActionText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  completedNoContact: {
    color: '#71717A',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
  },
  historyBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  historyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  refundFooter: {
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  refundFooterText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  refundBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  refundSheet: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
    alignSelf: 'center',
    marginBottom: 12,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  refundTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  refundSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  refundClose: {
    color: '#6B7280',
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  refundReason: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
    gap: 10,
  },
  refundReasonSelected: {
    borderColor: 'rgba(230,74,25,0.5)',
    backgroundColor: 'rgba(230,74,25,0.1)',
  },
  refundRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundRadioSelected: {
    borderColor: '#E64A19',
  },
  refundRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E64A19',
  },
  refundReasonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  refundReasonTextSelected: {
    color: '#FFCBB8',
    fontWeight: '700',
  },
  refundNote: {
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  refundError: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  refundSubmit: {
    backgroundColor: '#E64A19',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  refundSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  refundFooterCopy: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
});

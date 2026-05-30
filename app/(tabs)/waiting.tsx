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
import { normalisePhone } from '../../lib/phone';
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
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function heat(minutes: number): 'hot' | 'warm' | 'cold' {
  if (minutes < 2) return 'hot';
  if (minutes < 10) return 'warm';
  return 'cold';
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatCompletedTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', {
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
        const customerName = data.customerName ?? 'there';
        const customerPhone: string | null = data.customerPhone ?? null;
        Alert.alert(
          '✅ Job Accepted — 1 credit spent',
          `Customer: ${data.customerName ?? 'Unknown'}\nPhone: ${
            customerPhone || 'Not provided'
          }\n\nYou have ${data.remainingCredits} credits remaining.`,
          [
            {
              text: '📞 Call',
              onPress: () => {
                if (customerPhone) Linking.openURL(`tel:${normalisePhone(customerPhone)}`);
              },
            },
            {
              text: '💬 SMS',
              onPress: () => {
                if (!customerPhone) return;
                const message =
                  `Hi ${customerName}, it's ${myProfile?.name || `your ${getProviderNoun(myProfile)}`} ` +
                  `from ${myProfile?.trade || 'Speedi'}. ` +
                  `I've seen your Speedi request and I'm able to help. ` +
                  `I'm free now and ready to come to you. ` +
                  `What's the best time?`;
                Linking.openURL(
                  `sms:${normalisePhone(customerPhone)}?body=${encodeURIComponent(message)}`,
                );
              },
            },
            { text: 'Later', style: 'cancel' },
          ],
        );
        loadJobs();
      } else if (data.code === 'NO_CREDITS') {
        if (SHOW_IAP_CREDITS) {
          Alert.alert(
            'Not enough credits',
            'You need at least 1 credit to accept a job.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Buy credits', onPress: () => setShowPurchaseSheet(true) },
            ],
          );
        } else {
          Alert.alert(
            'Not enough credits',
            'You need at least 1 credit to accept a job. Credit balances are managed on speedi.co.uk — sign in from any web browser to top up.',
            [{ text: 'OK' }],
          );
        }
      } else {
        Alert.alert('Error', 'Could not accept job. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed. Try again.');
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

        const customerName = job.customerName ?? 'there';
        const customerPhone = job.customerPhone;
        const reviewSlug = myProfile?.username || myProfile?.id;

        Alert.alert(
          '✅ Job Complete!',
          `Want to ask ${customerName} for a review?`,
          [
            {
              text: '⭐ Send review request',
              onPress: () => {
                if (!customerPhone || !reviewSlug) return;
                const reviewUrl = `https://www.speeditrades.com/review/${reviewSlug}`;
                const message =
                  `Hi ${customerName}, thanks for using Speedi! ` +
                  `I hope you were happy with the work. ` +
                  `If you have a moment I'd really appreciate ` +
                  `a quick review — it only takes 30 seconds: ` +
                  `${reviewUrl}`;
                Linking.openURL(
                  `sms:${normalisePhone(customerPhone)}?body=${encodeURIComponent(message)}`,
                );
              },
            },
            { text: 'Maybe later', style: 'cancel' },
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
          <Text style={styles.sectionTitle}>Active Jobs</Text>
        </View>

        <View>
          {activeJobs.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>No active jobs right now</Text>
              <Text style={styles.emptySub}>
                Accept a request below to get started
              </Text>
            </View>
          ) : (
            activeJobs.map((job) => {
              const isCompleting = completing === job.id;
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.jobName}>{job.customerName ?? 'Customer'}</Text>
                    <View style={[styles.statusPill, { backgroundColor: '#00C67A22' }]}>
                      <Text style={[styles.statusText, { color: '#00C67A' }]}>
                        ● In Progress
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.jobMeta}>{job.jobType}</Text>
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
                      <Text style={[styles.contactText, { color: '#60A5FA' }]}>📞 Call</Text>
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
                      <Text style={[styles.contactText, { color: '#00C67A' }]}>💬 SMS</Text>
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
                      <Text style={[styles.contactText, { color: '#9CA3AF' }]}>✉️ Email</Text>
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
                        <Text style={styles.completeText}>✓ Mark Complete</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>Delete</Text>
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
                        Report this connection · reclaim credit
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
                          ? 'Credit refunded ✓'
                          : job.refundStatus === 'REJECTED'
                          ? 'Refund declined'
                          : 'Refund request under review'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.stickyHeader}>
          <Text style={styles.sectionTitle}>Live Requests Near You</Text>
        </View>

        <View>
          {todayRequests.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>No new requests today</Text>
              <Text style={styles.emptySub}>
                You'll be notified when jobs come in
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
                      <Text style={styles.requestTime}>{timeAgo(req.minutesAgo)}</Text>
                    </View>
                    {req.description ? (
                      <Text style={styles.requestDesc}>{req.description}</Text>
                    ) : null}
                    <Text style={styles.requestMeta}>
                      {req.distanceMiles !== null
                        ? `${req.distanceMiles}mi`
                        : 'Distance unknown'}
                      {req.customerName ? ` · ${req.customerName}` : ''}
                    </Text>
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
                          <Text style={styles.acceptText}>Accept · 1 credit</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.viewBtn}>
                        <Text style={styles.viewText}>👁 View</Text>
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
                ✓ Recently completed ({completedRecent.length}{' '}
                {completedRecent.length === 1 ? 'job' : 'jobs'})
              </Text>
              <Text style={styles.completedChevron}>{showCompleted ? '˅' : '›'}</Text>
            </TouchableOpacity>

            {showCompleted &&
              completedRecent.map((job) => (
                <View key={job.id} style={styles.completedCard}>
                  <View style={styles.completedBar} />
                  <View style={styles.completedBody}>
                    <Text style={styles.completedName}>
                      {job.customerName ?? 'Customer'}
                    </Text>
                    <Text style={styles.completedMeta}>{job.jobType}</Text>
                    {job.description ? (
                      <Text style={styles.completedDescription}>{job.description}</Text>
                    ) : null}
                    {job.acceptedAt ? (
                      <Text style={styles.completedTime}>
                        Completed · {formatCompletedTime(job.acceptedAt)}
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
                              <Text style={styles.completedActionText}>📞 Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.completedActionBtn}
                              onPress={() => smsPhone(job.customerPhone)}
                            >
                              <Text style={styles.completedActionText}>💬 SMS</Text>
                            </TouchableOpacity>
                          </>
                        ) : null}
                        {job.customerEmail ? (
                          <TouchableOpacity
                            style={styles.completedActionBtn}
                            onPress={() => emailUser(job.customerEmail)}
                          >
                            <Text style={styles.completedActionText}>✉ Email</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={styles.completedNoContact}>
                        No contact details captured for this customer
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
          <Text style={styles.historyText}>View job history</Text>
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

const REFUND_REASONS: Array<{ value: string; label: string }> = [
  { value: 'NEVER_REPLIED', label: 'Customer never replied' },
  { value: 'PRO_ON_PRO', label: 'Another tradesperson — not a real customer' },
  { value: 'SPAM', label: 'Spam or harassment' },
  { value: 'FAKE_JOB', label: 'Made-up job' },
  { value: 'OTHER', label: 'Other (describe below)' },
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
      setError('Please describe the issue.');
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
        setError(body.error ?? "Couldn't file the refund");
      } else {
        onSubmitted();
      }
    } catch {
      setError('Network error');
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
              <Text style={styles.refundTitle}>Report this connection</Text>
              <Text style={styles.refundSubtitle} numberOfLines={2}>
                {job.jobType}
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
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TextInput
              value={reasonNote}
              onChangeText={setReasonNote}
              placeholder={
                reason === 'OTHER'
                  ? 'Describe what happened (required)'
                  : 'Anything we should know (optional)'
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
              <Text style={styles.refundSubmitText}>Send refund request</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.refundFooterCopy}>
            Speedi reviews every refund. Approved cases get the credit back within a day.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
  requestTime: {
    color: '#9CA3AF',
    fontSize: 12,
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

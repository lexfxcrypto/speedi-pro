import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../../lib/auth';
import { getProviderNoun } from '../../lib/copy';

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
  const [completing, setCompleting] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

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
                if (customerPhone) Linking.openURL(`tel:${customerPhone}`);
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
                  `sms:${customerPhone}?body=${encodeURIComponent(message)}`,
                );
              },
            },
            { text: 'Later', style: 'cancel' },
          ],
        );
        loadJobs();
      } else if (data.code === 'NO_CREDITS') {
        Alert.alert(
          'Not enough credits',
          'You need at least 1 credit to accept a job. Top up in the Rewards tab.',
          [{ text: 'OK' }],
        );
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
                  `sms:${customerPhone}?body=${encodeURIComponent(message)}`,
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
    if (phone) Linking.openURL(`tel:${phone}`);
  };
  const smsPhone = (phone: string | null) => {
    if (phone) Linking.openURL(`sms:${phone}`);
  };
  const emailUser = (email: string | null) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const todayStart = startOfToday();
  const activeJobs = jobs.filter((j) => j.status === 'accepted');
  const completedToday = jobs.filter(
    (j) =>
      j.status === 'completed' &&
      j.acceptedAt !== null &&
      new Date(j.acceptedAt).getTime() >= todayStart,
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

        {completedToday.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.completedToggle}
              onPress={() => setShowCompleted((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.completedToggleText}>
                ✓ Completed today ({completedToday.length}{' '}
                {completedToday.length === 1 ? 'job' : 'jobs'})
              </Text>
              <Text style={styles.completedChevron}>{showCompleted ? '˅' : '›'}</Text>
            </TouchableOpacity>

            {showCompleted &&
              completedToday.map((job) => (
                <View key={job.id} style={styles.completedCard}>
                  <View style={styles.completedBar} />
                  <View style={styles.completedBody}>
                    <Text style={styles.completedName}>
                      {job.customerName ?? 'Customer'}
                    </Text>
                    <Text style={styles.completedMeta}>{job.jobType}</Text>
                    {job.acceptedAt ? (
                      <Text style={styles.completedTime}>
                        Completed · {formatCompletedTime(job.acceptedAt)}
                      </Text>
                    ) : null}
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
    </SafeAreaView>
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
    opacity: 0.6,
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
  completedTime: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
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
});

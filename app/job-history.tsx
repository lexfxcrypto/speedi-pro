import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchWithAuth } from '../lib/auth';

const API = 'https://www.speeditrades.com';

type Job = {
  id: string;
  jobType: string;
  description: string | null;
  status: 'accepted' | 'completed';
  customerName: string | null;
  acceptedAt: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function JobHistory() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/my-jobs`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const filtered = data.filter(
            (j: Job) =>
              j.status === 'completed' &&
              j.acceptedAt !== null &&
              new Date(j.acceptedAt).getTime() >= thirtyDaysAgo,
          );
          setJobs(filtered);
        }
      } catch (e) {
        console.log('Failed to load history:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Job History</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#00C67A" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.subtitle}>Last 30 days</Text>
          {jobs.length === 0 ? (
            <Text style={styles.emptyText}>No completed jobs in the last 30 days</Text>
          ) : (
            jobs.map((job) => (
              <View key={job.id} style={styles.card}>
                <View style={styles.bar} />
                <View style={styles.body}>
                  <Text style={styles.name}>{job.customerName ?? 'Customer'}</Text>
                  <Text style={styles.meta}>{job.jobType}</Text>
                  <Text style={styles.date}>{formatDate(job.acceptedAt)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
  },
  backBtn: { minWidth: 60 },
  backText: { color: '#E64A19', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 32 },
  subtitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  bar: { width: 3, backgroundColor: '#00C67A' },
  body: { flex: 1, padding: 14 },
  name: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  meta: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  date: { color: '#6B7280', fontSize: 12, marginTop: 4 },
});

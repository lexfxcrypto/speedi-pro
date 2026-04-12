import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type JobStatus = 'in_progress' | 'completed';

type Job = {
  id: string;
  name: string;
  trade: string;
  address: string;
  status: JobStatus;
};

type RequestHeat = 'hot' | 'warm' | 'cold';

type Request = {
  id: string;
  trade: string;
  icon: string;
  timeAgo: string;
  description: string;
  distance: string;
  postcode: string;
  heat: RequestHeat;
};

const JOBS: Job[] = [
  {
    id: 'j1',
    name: 'Sarah K.',
    trade: 'Emergency Plumbing',
    address: 'Victoria Terrace PR1',
    status: 'in_progress',
  },
  {
    id: 'j2',
    name: 'Mike R.',
    trade: 'Bathroom Install',
    address: 'Fishergate PR1',
    status: 'completed',
  },
];

const REQUESTS: Request[] = [
  {
    id: 'r1',
    trade: 'Emergency Plumbing',
    icon: '🚨',
    timeAgo: '12s ago',
    description: 'Burst pipe under kitchen sink',
    distance: '0.8mi',
    postcode: 'PR1 3AH',
    heat: 'hot',
  },
  {
    id: 'r2',
    trade: 'Boiler Fault',
    icon: '🔧',
    timeAgo: '2m ago',
    description: 'No hot water pilot light out',
    distance: '1.4mi',
    postcode: 'PR2 1BX',
    heat: 'warm',
  },
  {
    id: 'r3',
    trade: 'Bathroom Install',
    icon: '🚿',
    timeAgo: '8m ago',
    description: 'Full suite replacement flexible timing',
    distance: '3.1mi',
    postcode: 'PR5 4DX',
    heat: 'cold',
  },
];

const HEAT_COLOR: Record<RequestHeat, string> = {
  hot: '#00C67A',
  warm: '#F59E0B',
  cold: '#EF4444',
};

const STATUS_LABEL: Record<JobStatus, string> = {
  in_progress: '● In Progress',
  completed: '● Completed',
};

const STATUS_COLOR: Record<JobStatus, string> = {
  in_progress: '#00C67A',
  completed: '#F59E0B',
};

export default function Waiting() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Your Jobs</Text>
        {JOBS.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.jobName}>{job.name}</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: STATUS_COLOR[job.status] + '22' },
                ]}
              >
                <Text style={[styles.statusText, { color: STATUS_COLOR[job.status] }]}>
                  {STATUS_LABEL[job.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.jobMeta}>{job.trade}</Text>
            <Text style={styles.jobMeta}>{job.address}</Text>

            <View style={styles.contactRow}>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1E3A8A33' }]}>
                <Text style={[styles.contactText, { color: '#60A5FA' }]}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#00C67A22' }]}>
                <Text style={[styles.contactText, { color: '#00C67A' }]}>💬 SMS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1C1C1C' }]}>
                <Text style={[styles.contactText, { color: '#9CA3AF' }]}>✉️ Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomRow}>
              <TouchableOpacity style={styles.completeBtn}>
                <Text style={styles.completeText}>✓ Mark Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Live Requests Near You</Text>
        {REQUESTS.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={[styles.heatBar, { backgroundColor: HEAT_COLOR[req.heat] }]} />
            <View style={styles.requestBody}>
              <View style={styles.rowBetween}>
                <Text style={styles.requestTrade}>
                  {req.icon} {req.trade}
                </Text>
                <Text style={styles.requestTime}>{req.timeAgo}</Text>
              </View>
              <Text style={styles.requestDesc}>{req.description}</Text>
              <Text style={styles.requestMeta}>
                {req.distance} · {req.postcode}
              </Text>
              <View style={styles.bottomRow}>
                <TouchableOpacity style={styles.acceptBtn}>
                  <Text style={styles.acceptText}>Accept · 1 credit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewBtn}>
                  <Text style={styles.viewText}>👁 View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
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
});

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Cert = {
  id: string;
  icon: string;
  label: string;
  status: 'verified' | 'pending';
};

const CERTS: Cert[] = [
  { id: 'c1', icon: '📄', label: 'Gas Safe Certificate', status: 'verified' },
  { id: 'c2', icon: '🛡️', label: 'Public Liability Insurance', status: 'verified' },
  { id: 'c3', icon: '📋', label: 'OFTEC Registration', status: 'pending' },
];

export default function Profile() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>🔧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>Alex Hacking</Text>
              <Text style={styles.heroTrade}>Plumber · Heating Engineer</Text>
            </View>
          </View>
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: '#00C67A33' }]}>
              <Text style={[styles.pillText, { color: '#00C67A' }]}>✅ Approved</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: '#00000033' }]}>
              <Text style={[styles.pillText, { color: '#FFFFFF' }]}>10+ yrs</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: '#1E3A8A66' }]}>
              <Text style={[styles.pillText, { color: '#93C5FD' }]}>PR1 · 10mi</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Business Details</Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <DetailRow icon="🏢" label="Trading Name" value="LEX Plumbing and Heating" />
          <DetailRow icon="📍" label="Coverage" value="PR6 8BZ · 10 mile radius" />
          <DetailRow icon="📅" label="Experience" value="10+ years" />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Portfolio</Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>Add photo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.portfolioRow}>
            <View style={styles.portfolioBox}>
              <Text style={styles.portfolioEmoji}>🚿</Text>
            </View>
            <View style={styles.portfolioBox}>
              <Text style={styles.portfolioEmoji}>🔧</Text>
            </View>
            <View style={[styles.portfolioBox, styles.portfolioBoxEmpty]}>
              <Text style={styles.portfolioPlus}>+</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Certifications & Insurance</Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>Upload</Text>
            </TouchableOpacity>
          </View>
          {CERTS.map((cert) => (
            <View key={cert.id} style={styles.certRow}>
              <Text style={styles.certIcon}>{cert.icon}</Text>
              <Text style={styles.certLabel}>{cert.label}</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      cert.status === 'verified' ? '#00C67A22' : '#F59E0B22',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: cert.status === 'verified' ? '#00C67A' : '#F59E0B',
                    },
                  ]}
                >
                  {cert.status === 'verified' ? '✓ Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Social Links</Text>
            <TouchableOpacity>
              <Text style={styles.actionText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.socialRow}>
            <Text style={styles.socialIcon}>📘</Text>
            <Text style={styles.socialText}>facebook.com/lexplumbing</Text>
          </View>
          <View style={styles.socialRow}>
            <Text style={styles.socialIcon}>📸</Text>
            <Text style={[styles.socialText, { color: '#6B7280' }]}>Add Instagram</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
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
  hero: {
    backgroundColor: '#E64A19',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroTrade: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 2,
    opacity: 0.9,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionText: {
    color: '#E64A19',
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  detailIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: 10,
  },
  portfolioBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioBoxEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3A3A3A',
  },
  portfolioEmoji: {
    fontSize: 32,
  },
  portfolioPlus: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: '300',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  certIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  certLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
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
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  socialIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  socialText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E64A1922',
  },
  addBtnText: {
    color: '#E64A19',
    fontSize: 12,
    fontWeight: '700',
  },
});

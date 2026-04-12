import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type HistoryItem = {
  id: string;
  icon: string;
  description: string;
  date: string;
  amount: string;
  positive: boolean;
};

const HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    icon: '⚡',
    description: 'Job accepted — Sarah K.',
    date: 'Today 2:14pm',
    amount: '-1',
    positive: false,
  },
  {
    id: 'h2',
    icon: '🎁',
    description: 'Referral bonus — Mike T. joined',
    date: 'Yesterday',
    amount: '+5',
    positive: true,
  },
  {
    id: 'h3',
    icon: '💳',
    description: 'Credit pack — 25 credits',
    date: '3 days ago',
    amount: '+25',
    positive: true,
  },
  {
    id: 'h4',
    icon: '⚡',
    description: 'Job accepted — Tom B.',
    date: '4 days ago',
    amount: '-1',
    positive: false,
  },
  {
    id: 'h5',
    icon: '⚡',
    description: 'Job accepted — Emma T.',
    date: '1 week ago',
    amount: '-1',
    positive: false,
  },
];

export default function Rewards() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Refer a tradesperson</Text>
          <Text style={styles.heroSubtitle}>
            Share your code. When they sign up you both earn — you get 10% of every credit pack
            they buy for 6 months.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>ALEX-PR1</Text>
            <TouchableOpacity>
              <Text style={styles.copyText}>📋 Copy</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.linkText}>🔗 speedi.co.uk/join?ref=ALEX-PR1</Text>

          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareText}>📤 Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>47</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Credit History</Text>
          {HISTORY.map((item, i) => (
            <View
              key={item.id}
              style={[styles.historyRow, i < HISTORY.length - 1 && styles.historyDivider]}
            >
              <Text style={styles.historyIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDesc}>{item.description}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <Text
                style={[
                  styles.historyAmount,
                  { color: item.positive ? '#00C67A' : '#EF4444' },
                ]}
              >
                {item.amount}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buyText}>💳 Buy More Credits</Text>
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
  hero: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  codeText: {
    color: '#E64A19',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    color: '#60A5FA',
    fontSize: 12,
    marginTop: 10,
  },
  shareBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statValue: {
    color: '#E64A19',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  historyDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  historyIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  historyDesc: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  historyDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

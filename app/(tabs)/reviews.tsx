import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Review = {
  id: string;
  name: string;
  stars: string;
  date: string;
  text: string;
  tag: string;
};

const REVIEWS: Review[] = [
  {
    id: 'r1',
    name: 'Sarah K.',
    stars: '★★★★★',
    date: '2 days ago',
    text: 'Absolutely brilliant — arrived within 20 minutes and sorted the burst pipe in no time.',
    tag: 'Emergency Plumbing',
  },
  {
    id: 'r2',
    name: 'Mike R.',
    stars: '★★★★★',
    date: '1 week ago',
    text: 'Fantastic job on the bathroom installation. Really tidy work, on time and great value.',
    tag: 'Bathroom Install',
  },
  {
    id: 'r3',
    name: 'Emma T.',
    stars: '★★★★☆',
    date: '2 weeks ago',
    text: 'Great service, very professional. Slight delay but kept me informed throughout.',
    tag: 'Boiler Service',
  },
];

export default function Reviews() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroNumber}>4.9</Text>
          <Text style={styles.heroStars}>★★★★★</Text>
          <Text style={styles.heroSubtitle}>Based on 24 reviews</Text>
        </View>

        {REVIEWS.map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewName}>{rev.name}</Text>
              <Text style={styles.reviewStars}>{rev.stars}</Text>
            </View>
            <Text style={styles.reviewDate}>{rev.date}</Text>
            <Text style={styles.reviewText}>{rev.text}</Text>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{rev.tag}</Text>
            </View>
          </View>
        ))}

        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            <Text style={styles.qrEmoji}>⬛</Text>
          </View>
          <View style={styles.qrBody}>
            <Text style={styles.qrTitle}>Get more reviews</Text>
            <Text style={styles.qrSubtitle}>Share your QR code with customers</Text>
            <View style={styles.qrButtons}>
              <TouchableOpacity style={styles.qrPrimary}>
                <Text style={styles.qrPrimaryText}>Download QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrSecondary}>
                <Text style={styles.qrSecondaryText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareText}>Share Profile Link</Text>
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
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroNumber: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 64,
  },
  heroStars: {
    color: '#F59E0B',
    fontSize: 24,
    marginTop: 4,
    letterSpacing: 2,
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 14,
    letterSpacing: 1,
  },
  reviewDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  reviewText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E64A1922',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
  },
  tagText: {
    color: '#E64A19',
    fontSize: 11,
    fontWeight: '600',
  },
  qrCard: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    gap: 14,
    alignItems: 'center',
  },
  qrBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEmoji: {
    fontSize: 56,
  },
  qrBody: {
    flex: 1,
  },
  qrTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  qrSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  qrButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  qrPrimary: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qrSecondary: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrSecondaryText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  shareBtn: {
    backgroundColor: '#1C1C1C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

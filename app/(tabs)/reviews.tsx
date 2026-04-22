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
import { fetchWithAuth } from '../../lib/auth';

const API = 'https://www.speeditrades.com';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string | null;
  jobType: string | null;
};

type ReviewData = {
  averageRating: number;
  totalCount: number;
  reviews: Review[];
};

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '★' : '') + '☆'.repeat(Math.max(0, empty));
}

function daysAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) {
    const hours = Math.floor(diffMs / 3600000);
    if (hours < 1) return 'just now';
    return `${hours} hr ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export default function Reviews() {
  const [reviewData, setReviewData] = useState<ReviewData>({
    averageRating: 0,
    totalCount: 0,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API}/api/native/reviews`);
        const data = await res.json();
        setReviewData(data);
      } catch (e) {
        console.log('Failed to load reviews:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color="#00C67A" size="large" />
      </SafeAreaView>
    );
  }

  const hasReviews = reviewData.totalCount > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroNumber}>{reviewData.averageRating.toFixed(1)}</Text>
          <Text style={styles.heroStars}>{renderStars(reviewData.averageRating)}</Text>
          <Text style={styles.heroSubtitle}>
            Based on {reviewData.totalCount}{' '}
            {reviewData.totalCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        {!hasReviews ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySub}>Complete jobs to start receiving reviews</Text>
          </View>
        ) : (
          reviewData.reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewName}>{rev.reviewerName || 'Anonymous'}</Text>
                <Text style={styles.reviewStars}>{renderStars(rev.rating)}</Text>
              </View>
              <Text style={styles.reviewDate}>{daysAgo(rev.createdAt)}</Text>
              {rev.comment ? <Text style={styles.reviewText}>{rev.comment}</Text> : null}
              {rev.jobType ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{rev.jobType}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}

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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
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

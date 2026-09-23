import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import QRCode from 'react-native-qrcode-svg';
import { fetchWithAuth } from '../../lib/auth';
import { t, useT } from '../../lib/i18n';

const API = 'https://www.speeditrades.com';

/**
 * Where a customer leaves the review.
 *
 * `/review/<providerId>` is the open form — it needs no token, which is
 * what makes it shareable at all. The token variant
 * (`/review/<id>/<token>`) exists too but is tied to one specific
 * message, so it can only ever be sent to one customer who has already
 * been through a job. A pro handing out a QR at the end of a haircut has
 * no message to hang a token off, so the open form is the right one.
 *
 * The page itself renders their name and trade, so the link is already
 * "specific to that trade" without us encoding anything extra into it.
 */
function reviewUrl(providerId: string) {
  return `https://www.speedi.co.uk/review/${providerId}`;
}

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
    if (hours < 1) return t('reviews.justNow');
    return t('reviews.hoursAgo', { count: hours });
  }
  if (days === 1) return t('reviews.yesterday');
  if (days < 7) return t('reviews.daysAgo', { count: days });
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return weeks === 1
      ? t('reviews.weeksAgoOne')
      : t('reviews.weeksAgoOther', { count: weeks });
  }
  const months = Math.floor(days / 30);
  return months === 1
    ? t('reviews.monthsAgoOne')
    : t('reviews.monthsAgoOther', { count: months });
}

export default function Reviews() {
  const { t } = useT();
  const [reviewData, setReviewData] = useState<ReviewData>({
    averageRating: 0,
    totalCount: 0,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  /**
   * The provider's own id, read from the stored session rather than
   * fetched. It is the one field on the user that can never change, so
   * a cached copy cannot go stale — and the QR has to render without
   * waiting on a round trip, otherwise the card flashes empty every
   * time the tab is opened.
   */
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('user_data')
      .then((raw) => {
        if (!raw) return;
        const id = JSON.parse(raw)?.id;
        if (typeof id === 'string' && id) setProviderId(id);
      })
      .catch((e) => console.log('Could not read session for review link:', e));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // `?userId=me` → the authenticated user's own reviews. Server
        // accepts either a real id or "me". Previously omitting the
        // param 400'd, the client parsed the error body into state,
        // then crashed on render. Fixed both ends; this is the
        // belt-and-braces version.
        const res = await fetchWithAuth(`${API}/api/native/reviews?userId=me`);
        if (!res.ok) {
          console.log('Reviews fetch returned', res.status);
          return; // Keep the safe default state.
        }
        const data = await res.json();
        // Defensive parse: only update state if the response actually
        // has the expected shape. Guards against future API drift
        // putting `undefined` into reviewData.averageRating which
        // would crash the .toFixed() render.
        if (
          data &&
          typeof data.averageRating === 'number' &&
          typeof data.totalCount === 'number' &&
          Array.isArray(data.reviews)
        ) {
          setReviewData(data);
        } else {
          console.log('Reviews response has unexpected shape:', data);
        }
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
            {reviewData.totalCount === 1
              ? t('reviews.basedOnOne', { count: reviewData.totalCount })
              : t('reviews.basedOnOther', { count: reviewData.totalCount })}
          </Text>
        </View>

        {!hasReviews ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>{t('reviews.noReviews')}</Text>
            <Text style={styles.emptySub}>{t('reviews.noReviewsSub')}</Text>
          </View>
        ) : (
          reviewData.reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewName}>{rev.reviewerName || t('reviews.anonymous')}</Text>
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

        {/*
          The card only renders once we know who we are. Showing the
          frame with an empty square and buttons that cannot work is
          worse than showing nothing — it was exactly what this screen
          did before, and it read as broken rather than as loading.
        */}
        {providerId && (
          <View style={styles.qrCard}>
            <View style={styles.qrBox}>
              <QRCode
                value={reviewUrl(providerId)}
                size={96}
                color="#1F2937"
                backgroundColor="#FFFFFF"
              />
            </View>
            <View style={styles.qrBody}>
              <Text style={styles.qrTitle}>{t('reviews.getMoreTitle')}</Text>
              <Text style={styles.qrSubtitle}>{t('reviews.getMoreSubtitle')}</Text>
              <View style={styles.qrButtons}>
                <TouchableOpacity
                  style={styles.qrPrimary}
                  onPress={async () => {
                    /*
                     * Sends the link with a line already written. A pro
                     * texting "leave me a review" mid-shift will not
                     * compose a message; giving them one is the
                     * difference between the button being used and not.
                     */
                    try {
                      await Share.share({
                        message: t('reviews.shareMessage', { url: reviewUrl(providerId) }),
                      });
                    } catch (e) {
                      console.log('Share failed:', e);
                    }
                  }}
                >
                  <Text style={styles.qrPrimaryText}>{t('reviews.sendToCustomer')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.qrSecondary}
                  onPress={async () => {
                    await Clipboard.setStringAsync(reviewUrl(providerId));
                    Alert.alert(t('reviews.copiedTitle'), t('reviews.copiedBody'));
                  }}
                >
                  <Text style={styles.qrSecondaryText}>{t('reviews.copyLink')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // Transparent: the app's dark background and its watermark live in
    // the tabs layout now, one layer behind every screen.
    backgroundColor: 'transparent',
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
    // Sized to the code plus a quiet zone. QR scanners need the white
    // margin around the pattern — a code bled to the edge of its
    // container is measurably harder to read across a counter.
    width: 112,
    height: 112,
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

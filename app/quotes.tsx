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
import { fetchWithAuth } from '../lib/auth';

const API = 'https://www.speeditrades.com';

type Quote = {
  id: string;
  jobType: string;
  description: string;
  customerName: string | null;
  createdAt: string;
  urgency: string | null;
  budget: string | null;
  responded: boolean;
  status: 'open' | 'closed';
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function Quotes() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/quotes`);
      const data = await res.json();
      if (Array.isArray(data?.quotes)) setQuotes(data.quotes);
    } catch (e) {
      console.log('Failed to load quotes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetchWithAuth(`${API}/api/native/quotes`, { method: 'PATCH' }).catch(() => {});
  }, []);

  const respondToQuote = async (quote: Quote) => {
    setResponding(quote.id);
    try {
      const res = await fetchWithAuth(`${API}/api/native/respond-quote`, {
        method: 'POST',
        body: JSON.stringify({ quoteId: quote.id }),
      });
      const data = await res.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await load();

        const customerName = data.customer?.name ?? 'Customer';
        const phone: string | null = data.customer?.phone ?? null;
        const email: string | null = data.customer?.email ?? null;

        const actions: Array<{
          text: string;
          onPress?: () => void;
          style?: 'cancel';
        }> = [];
        if (phone) {
          actions.push({
            text: '📞 Call',
            onPress: () => Linking.openURL(`tel:${phone}`),
          });
          actions.push({
            text: '💬 SMS',
            onPress: () => Linking.openURL(`sms:${phone}`),
          });
        }
        if (email) {
          actions.push({
            text: '✉️ Email',
            onPress: () => Linking.openURL(`mailto:${email}`),
          });
        }
        actions.push({ text: 'OK', style: 'cancel' });

        Alert.alert(
          '✅ Quote sent — 1 credit spent',
          `Your message is now in ${customerName}'s inbox and will show in your Messages tab.\n\n` +
            `Phone: ${phone || 'Not provided'}\n` +
            `Email: ${email || 'Not provided'}\n\n` +
            `${data.remainingCredits} credits remaining.`,
          actions,
        );
      } else if (data.code === 'NO_CREDITS') {
        Alert.alert(
          'Not enough credits',
          'You need at least 1 credit to respond to a quote. Top up in the Rewards tab.',
          [{ text: 'OK' }],
        );
      } else if (data.code === 'CLOSED') {
        Alert.alert('Quote closed', 'This quote is no longer accepting responses.', [
          { text: 'OK' },
        ]);
        load();
      } else if (data.code === 'ALREADY_RESPONDED') {
        Alert.alert('Already responded', 'You have already sent a quote for this request.', [
          { text: 'OK' },
        ]);
        load();
      } else {
        Alert.alert('Error', data.error || 'Could not respond. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed. Try again.');
    } finally {
      setResponding(null);
    }
  };

  const confirmRespond = (quote: Quote) => {
    Alert.alert(
      `Respond to ${quote.jobType}?`,
      `1 credit will be spent. You'll unlock ${quote.customerName ?? 'the customer'}'s contact details and start a message thread.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Respond · 1 credit',
          onPress: () => respondToQuote(quote),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quote Requests</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#00C67A" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {quotes.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>No new quote requests</Text>
              <Text style={styles.emptySub}>
                New quotes will appear here when customers request one in your area
              </Text>
            </View>
          ) : (
            quotes.map((q) => {
              const isResponding = responding === q.id;
              return (
                <View key={q.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{q.jobType || 'Quote request'}</Text>
                    <Text style={styles.cardTime}>{timeAgo(q.createdAt)}</Text>
                  </View>
                  {q.customerName ? (
                    <Text style={styles.cardCustomer}>{q.customerName}</Text>
                  ) : null}
                  {q.description ? (
                    <Text style={styles.cardDesc}>{q.description}</Text>
                  ) : null}
                  <View style={styles.pillRow}>
                    {q.urgency ? (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>⏱ {q.urgency}</Text>
                      </View>
                    ) : null}
                    {q.budget ? (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>£ {q.budget}</Text>
                      </View>
                    ) : null}
                    {q.responded ? (
                      <View style={[styles.pill, { backgroundColor: '#00C67A22' }]}>
                        <Text style={[styles.pillText, { color: '#00C67A' }]}>
                          ✓ Responded
                        </Text>
                      </View>
                    ) : null}
                    {q.status === 'closed' && !q.responded ? (
                      <View style={[styles.pill, { backgroundColor: '#1C1C1C' }]}>
                        <Text style={[styles.pillText, { color: '#9CA3AF' }]}>Closed</Text>
                      </View>
                    ) : null}
                  </View>

                  {!q.responded && q.status === 'open' ? (
                    <TouchableOpacity
                      style={[styles.respondBtn, isResponding && styles.respondBtnDisabled]}
                      onPress={() => confirmRespond(q)}
                      disabled={isResponding || responding !== null}
                    >
                      {isResponding ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.respondText}>Respond · 1 credit</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
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
  backBtn: {
    minWidth: 60,
  },
  backText: {
    color: '#E64A19',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  cardCustomer: {
    color: '#E64A19',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  cardDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  respondBtn: {
    backgroundColor: '#E64A19',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  respondBtnDisabled: {
    opacity: 0.6,
  },
  respondText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

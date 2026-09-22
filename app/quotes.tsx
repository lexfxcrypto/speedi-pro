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
import { SHOW_IAP_CREDITS } from '../lib/featureFlags';
import { t, useT } from '../lib/i18n';
import { normalisePhone, whatsappUrl } from '../lib/phone';
import CreditsPurchaseSheet from '../components/CreditsPurchaseSheet';

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
  if (mins < 1) return t('quotes.timeJustNow');
  if (mins < 60) return t('quotes.timeMinutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('quotes.timeHoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return days === 1 ? t('quotes.timeYesterday') : t('quotes.timeDaysAgo', { count: days });
}

export default function Quotes() {
  const router = useRouter();
  const { t } = useT();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

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

        const customerName = data.customer?.name ?? t('quotes.customerFallback');
        const phone: string | null = data.customer?.phone ?? null;
        const email: string | null = data.customer?.email ?? null;

        const actions: Array<{
          text: string;
          onPress?: () => void;
          style?: 'cancel';
        }> = [];
        if (phone) {
          actions.push({
            text: '🟢 WhatsApp',
            onPress: () => Linking.openURL(whatsappUrl(phone)),
          });
          actions.push({
            text: t('quotes.call'),
            onPress: () => Linking.openURL(`tel:${normalisePhone(phone)}`),
          });
          actions.push({
            text: t('quotes.sms'),
            onPress: () => Linking.openURL(`sms:${normalisePhone(phone)}`),
          });
        }
        if (email) {
          actions.push({
            text: t('quotes.email'),
            onPress: () => Linking.openURL(`mailto:${email}`),
          });
        }
        actions.push({ text: t('common.ok'), style: 'cancel' });

        Alert.alert(
          t('quotes.sentTitle'),
          `${t('quotes.sentBody', { name: customerName })}\n\n` +
            `${t('quotes.contactPhone', { phone: phone || t('quotes.notProvided') })}\n` +
            `${t('quotes.contactEmail', { email: email || t('quotes.notProvided') })}\n\n` +
            t(
              data.remainingCredits === 1
                ? 'quotes.creditsRemainingOne'
                : 'quotes.creditsRemainingOther',
              { count: data.remainingCredits },
            ),
          actions,
        );
      } else if (data.code === 'NO_CREDITS') {
        if (SHOW_IAP_CREDITS) {
          Alert.alert(
            t('quotes.notEnoughCreditsTitle'),
            t('quotes.notEnoughCreditsBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('quotes.buyCredits'), onPress: () => setShowPurchaseSheet(true) },
            ],
          );
        } else {
          Alert.alert(
            t('quotes.notEnoughCreditsTitle'),
            t('quotes.notEnoughCreditsWebBody'),
            [{ text: t('common.ok') }],
          );
        }
      } else if (data.code === 'CLOSED') {
        Alert.alert(t('quotes.closedTitle'), t('quotes.closedBody'), [
          { text: t('common.ok') },
        ]);
        load();
      } else if (data.code === 'ALREADY_RESPONDED') {
        Alert.alert(t('quotes.alreadyRespondedTitle'), t('quotes.alreadyRespondedBody'), [
          { text: t('common.ok') },
        ]);
        load();
      } else {
        Alert.alert(t('quotes.errorTitle'), data.error || t('quotes.respondFailed'));
      }
    } catch {
      Alert.alert(t('quotes.errorTitle'), t('quotes.connectionFailed'));
    } finally {
      setResponding(null);
    }
  };

  const confirmRespond = (quote: Quote) => {
    Alert.alert(
      t('quotes.confirmTitle', { jobType: quote.jobType }),
      t('quotes.confirmBody', { name: quote.customerName ?? t('quotes.theCustomer') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('quotes.respondButton'),
          onPress: () => respondToQuote(quote),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('quotes.title')}</Text>
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
              <Text style={styles.emptyText}>{t('quotes.empty')}</Text>
              <Text style={styles.emptySub}>
                {t('quotes.emptyHint')}
              </Text>
            </View>
          ) : (
            quotes.map((q) => {
              const isResponding = responding === q.id;
              return (
                <View key={q.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{q.jobType || t('quotes.quoteRequestFallback')}</Text>
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
                          {t('quotes.responded')}
                        </Text>
                      </View>
                    ) : null}
                    {q.status === 'closed' && !q.responded ? (
                      <View style={[styles.pill, { backgroundColor: '#1C1C1C' }]}>
                        <Text style={[styles.pillText, { color: '#9CA3AF' }]}>{t('quotes.closed')}</Text>
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
                        <Text style={styles.respondText}>{t('quotes.respondButton')}</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <CreditsPurchaseSheet
        visible={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
      />
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

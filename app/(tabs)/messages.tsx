import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
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
import { SHOW_IAP_CREDITS } from '../../lib/featureFlags';
import { getLang, t, useT } from '../../lib/i18n';
import { normalisePhone, whatsappUrl } from '../../lib/phone';
import CreditsPurchaseSheet from '../../components/CreditsPurchaseSheet';

const API = 'https://www.speeditrades.com';

type Message = {
  id: string;
  otherUserName: string;
  otherUserPhone: string | null;
  otherUserEmail: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  accepted: boolean;
  pendingMessageId: string | null;
};

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('messages.timeJustNow');
  if (mins < 60) return t('messages.timeMinutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('messages.timeHoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? t('messages.timeYesterday') : t('messages.timeDaysAgo', { count: days });
  }
  return new Date(iso).toLocaleDateString(getLang() === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function initialOf(name: string): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

export default function Messages() {
  const router = useRouter();
  const { t } = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [quoteCount, setQuoteCount] = useState(0);
  const [showOlder, setShowOlder] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  const load = async () => {
    try {
      const [msgRes, quoteRes] = await Promise.all([
        fetchWithAuth(`${API}/api/native/messages`),
        fetchWithAuth(`${API}/api/native/quotes`),
      ]);
      console.log('Messages status:', msgRes.status);
      const msgData = await msgRes.json();
      console.log('Messages data:', JSON.stringify(msgData));
      const quoteData = await quoteRes.json();
      if (Array.isArray(msgData)) setMessages(msgData);
      if (quoteData?.unreadCount !== undefined) setQuoteCount(quoteData.unreadCount);
    } catch (e) {
      console.log('Failed to load messages:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
      fetchWithAuth(`${API}/api/native/messages`, { method: 'PATCH' }).catch(() => {});
      const interval = setInterval(load, 15000);
      return () => clearInterval(interval);
    }, []),
  );

  const declineMessage = async (msg: Message, reason: string) => {
    if (!msg.pendingMessageId) return;
    try {
      const res = await fetchWithAuth(`${API}/api/native/decline-message`, {
        method: 'POST',
        body: JSON.stringify({ messageId: msg.pendingMessageId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await load();
        Alert.alert(
          t('messages.declinedTitle'),
          t('messages.declinedBody', { name: msg.otherUserName }),
          [{ text: t('common.ok') }],
        );
      } else {
        Alert.alert(t('messages.errorTitle'), data.error || t('messages.declineFailed'));
      }
    } catch {
      Alert.alert(t('messages.errorTitle'), t('messages.connectionFailed'));
    }
  };

  const promptDeclineReason = (msg: Message) => {
    // getProviderNoun falls back to the English 'provider'; swap that for
    // the translated word, keep trade names as-is.
    const noun = getProviderNoun(null);
    Alert.alert(
      t('messages.declinePromptTitle', { name: msg.otherUserName }),
      t('messages.declinePromptBody', {
        noun: noun === 'provider' ? t('messages.providerFallback') : noun,
      }),
      [
        {
          text: t('messages.declineWrongJobType'),
          onPress: () => declineMessage(msg, 'wrong_job_type'),
        },
        {
          text: t('messages.declineTooFar'),
          onPress: () => declineMessage(msg, 'too_far'),
        },
        {
          text: t('messages.declineNotAvailable'),
          onPress: () => declineMessage(msg, 'not_available'),
        },
        { text: t('common.back'), style: 'cancel' },
      ],
    );
  };

  const acceptMessage = async (msg: Message) => {
    if (!msg.pendingMessageId) return;
    try {
      const res = await fetchWithAuth(`${API}/api/native/accept-message`, {
        method: 'POST',
        body: JSON.stringify({ messageId: msg.pendingMessageId }),
      });
      const data = await res.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await load();
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
            text: t('messages.replyViaSms'),
            onPress: () => Linking.openURL(`sms:${normalisePhone(phone)}`),
          });
          actions.push({
            text: t('messages.call'),
            onPress: () => Linking.openURL(`tel:${normalisePhone(phone)}`),
          });
        }
        if (email) {
          actions.push({
            text: t('messages.email'),
            onPress: () => Linking.openURL(`mailto:${email}`),
          });
        }
        actions.push({ text: t('common.ok'), style: 'cancel' });

        Alert.alert(
          t('messages.unlockedTitle'),
          `${data.customer?.name ?? msg.otherUserName}\n\n` +
            `${t('messages.contactPhone', { phone: phone || t('messages.notProvided') })}\n` +
            `${t('messages.contactEmail', { email: email || t('messages.notProvided') })}\n\n` +
            t(
              data.remainingCredits === 1
                ? 'messages.creditsRemainingOne'
                : 'messages.creditsRemainingOther',
              { count: data.remainingCredits },
            ),
          actions,
        );
      } else if (data.code === 'NO_CREDITS') {
        if (SHOW_IAP_CREDITS) {
          Alert.alert(
            t('messages.notEnoughCreditsTitle'),
            t('messages.notEnoughCreditsBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('messages.buyCredits'), onPress: () => setShowPurchaseSheet(true) },
            ],
          );
        } else {
          Alert.alert(
            t('messages.notEnoughCreditsTitle'),
            t('messages.notEnoughCreditsWebBody'),
            [{ text: t('common.ok') }],
          );
        }
      } else if (data.code === 'ALREADY_ACCEPTED') {
        load();
      } else {
        Alert.alert(t('messages.errorTitle'), data.error || t('messages.unlockFailed'));
      }
    } catch {
      Alert.alert(t('messages.errorTitle'), t('messages.connectionFailed'));
    }
  };

  const openContact = (msg: Message) => {
    if (msg.pendingMessageId) {
      const title = msg.accepted
        ? t('messages.newRequestFrom', { name: msg.otherUserName })
        : t('messages.newMessageFrom', { name: msg.otherUserName });
      const body = msg.accepted
        ? t('messages.newRequestBody', { message: msg.lastMessage })
        : t('messages.newMessageBody', { message: msg.lastMessage });
      Alert.alert(title, body, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('messages.decline'),
          style: 'destructive',
          onPress: () => promptDeclineReason(msg),
        },
        {
          text: t('messages.openOneCredit'),
          onPress: () => acceptMessage(msg),
        },
      ]);
      return;
    }

    const actions: Array<{
      text: string;
      onPress?: () => void;
      style?: 'cancel' | 'default' | 'destructive';
    }> = [];

    if (msg.otherUserPhone) {
      actions.push({
        text: '🟢 WhatsApp',
        onPress: () => Linking.openURL(whatsappUrl(msg.otherUserPhone)),
      });
      actions.push({
        text: t('messages.replyViaSms'),
        onPress: () => Linking.openURL(`sms:${normalisePhone(msg.otherUserPhone)}`),
      });
      actions.push({
        text: t('messages.call'),
        onPress: () => Linking.openURL(`tel:${normalisePhone(msg.otherUserPhone)}`),
      });
    }
    if (msg.otherUserEmail) {
      actions.push({
        text: t('messages.email'),
        onPress: () => Linking.openURL(`mailto:${msg.otherUserEmail}`),
      });
    }
    actions.push({
      text: t('messages.replyOnWeb'),
      onPress: () => Linking.openURL('https://www.speeditrades.com/messages'),
    });
    actions.push({ text: t('common.close'), style: 'cancel' });

    const body =
      `${t('messages.contactPhone', { phone: msg.otherUserPhone || t('messages.notProvided') })}\n` +
      `${t('messages.contactEmail', { email: msg.otherUserEmail || t('messages.notProvided') })}\n\n` +
      t('messages.lastMessage', { message: msg.lastMessage });

    Alert.alert(msg.otherUserName, body, actions);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/quotes')}
          style={[styles.linkCard, { borderLeftColor: '#E64A19' }]}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E64A1922' }]}>
            <Text style={styles.iconEmoji}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t('messages.quoteRequests')}</Text>
            <Text style={styles.linkSubtitle}>
              {quoteCount > 0
                ? t(
                    quoteCount === 1
                      ? 'messages.newQuotesWaitingOne'
                      : 'messages.newQuotesWaitingOther',
                    { count: quoteCount },
                  )
                : t('messages.noNewQuotes')}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowOlder((v) => !v)}
          style={[styles.linkCard, { borderLeftColor: '#60A5FA' }]}
        >
          <View style={[styles.iconBox, { backgroundColor: '#1E3A8A33' }]}>
            <Text style={styles.iconEmoji}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t('messages.allMessages')}</Text>
            <Text style={styles.linkSubtitle}>
              {t('messages.totalCount', { count: messages.length })} ·{' '}
              {showOlder ? t('messages.hideOlder') : t('messages.viewFullHistory')}
            </Text>
          </View>
          <Text style={styles.chevron}>{showOlder ? '˅' : '›'}</Text>
        </TouchableOpacity>

        {(() => {
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recent = messages.filter(
            (m) => new Date(m.lastMessageAt).getTime() > cutoff,
          );
          const older = messages.filter(
            (m) => new Date(m.lastMessageAt).getTime() <= cutoff,
          );

          return (
            <>
              <Text style={styles.recentLabel}>{t('messages.recentLabel')}</Text>

              {recent.length === 0 ? (
                <Text style={styles.emptyText}>{t('messages.noRecentMessages')}</Text>
              ) : (
                recent.map((msg) => (
                  <TouchableOpacity
                    key={msg.id}
                    activeOpacity={0.8}
                    onPress={() => openContact(msg)}
                    style={[
                      styles.messageItem,
                      msg.unread && { borderLeftColor: '#E64A19', borderLeftWidth: 3 },
                    ]}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarInitial}>{initialOf(msg.otherUserName)}</Text>
                    </View>
                    <View style={styles.messageBody}>
                      <View style={styles.nameRow}>
                        <Text style={styles.messageName}>{msg.otherUserName}</Text>
                        {msg.pendingMessageId ? (
                          <View style={styles.lockBadge}>
                            <Text style={styles.lockBadgeText}>{t('messages.lockBadge')}</Text>
                          </View>
                        ) : msg.unread ? (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>{t('messages.newBadge')}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.messagePreview} numberOfLines={1}>
                        {truncate(msg.lastMessage, 40)}
                      </Text>
                    </View>
                    <Text style={styles.messageTime}>{timeAgo(msg.lastMessageAt)}</Text>
                  </TouchableOpacity>
                ))
              )}

              {older.length > 0 && (
                <>
                  {!showOlder ? (
                    <TouchableOpacity
                      style={styles.viewAllBtn}
                      onPress={() => setShowOlder(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllText}>
                        {t('messages.viewAllOlder', { count: older.length })}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <Text style={[styles.recentLabel, { marginTop: 24 }]}>{t('messages.olderLabel')}</Text>
                      {older.map((msg) => (
                        <TouchableOpacity
                          key={msg.id}
                          activeOpacity={0.8}
                          onPress={() => openContact(msg)}
                          style={[styles.messageItem, { opacity: 0.7 }]}
                        >
                          <View style={styles.avatar}>
                            <Text style={styles.avatarInitial}>
                              {initialOf(msg.otherUserName)}
                            </Text>
                          </View>
                          <View style={styles.messageBody}>
                            <Text style={styles.messageName}>{msg.otherUserName}</Text>
                            <Text style={styles.messagePreview} numberOfLines={1}>
                              {truncate(msg.lastMessage, 40)}
                            </Text>
                          </View>
                          <Text style={styles.messageTime}>
                            {timeAgo(msg.lastMessageAt)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.viewAllBtn}
                        onPress={() => setShowOlder(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.viewAllText}>{t('messages.hideOlderMessages')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </>
          );
        })()}
      </ScrollView>

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
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  linkTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: '#6B7280',
    fontSize: 24,
    fontWeight: '300',
  },
  recentLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#E64A19',
    fontSize: 18,
    fontWeight: '700',
  },
  messageBody: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockBadge: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: 'rgba(230,74,25,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  lockBadgeText: {
    color: '#E64A19',
    fontSize: 10,
    fontWeight: '700',
  },
  messagePreview: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  messageTime: {
    color: '#6B7280',
    fontSize: 11,
    marginLeft: 8,
  },
  viewAllBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});

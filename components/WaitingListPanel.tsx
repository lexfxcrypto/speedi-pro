import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../lib/auth';

/**
 * The waiting list: how many are on it, what happened last time, and a
 * way to message them.
 *
 * ── Counts, never names ────────────────────────────────────────────────
 * Alex's standing rule and not negotiable: the admin panel can see who
 * follows whom, the Pro app sees a number. A provider holding a list of
 * customers watching them is a privacy surface nobody asked for, and a
 * count is enough to justify the only useful action, which is going
 * green.
 *
 * ── Conversion is the number that matters ──────────────────────────────
 * "12 people are waiting" is interesting. "Last time, 9 were told and 3
 * messaged you" is a reason to press the button — it turns the follow
 * feature from a claim into evidence, and it is the only figure here a
 * pro could not have guessed.
 *
 * ── Why a message box lives next to it ─────────────────────────────────
 * A cancellation at three on Friday is not something the traffic light
 * can say — green means free NOW, and flipping it to advertise Friday
 * makes the map lie to everyone looking at it today. So the message goes
 * to the list directly and the pin stays honest.
 *
 * Only standing followers receive it, server-side. Somebody who wanted a
 * plumber last Tuesday asked a question and got an answer; next Friday's
 * offer is marketing they never requested.
 */
type Stats = {
  waiting: number;
  standing: number;
  lastNotified: number;
  repliedAfter: number;
  lastSentAt: string | null;
};

export function WaitingListPanel({ accent }: { accent: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/native/follower-stats');
      if (res.ok) setStats(await res.json());
    } catch {
      // Stats are decoration; a failure must not disturb the screen.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetchWithAuth('/api/native/notify-followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const body = await res.json();
      if (!res.ok) {
        /**
         * The rate limit is the expected failure, not an error — a pro
         * who messaged an hour ago has not done anything wrong, so it
         * says when they can send again rather than that something
         * broke.
         */
        Alert.alert(
          res.status === 429 ? 'Not just yet' : 'Could not send',
          body?.message ?? 'Something went wrong. Try again shortly.',
        );
        return;
      }
      setComposing(false);
      setMessage('');
      Alert.alert(
        'Sent',
        body.sent === 0
          ? 'Nobody has asked to be told every time yet, so this went to no one. It sends automatically once people opt in.'
          : `Told ${body.sent} ${body.sent === 1 ? 'person' : 'people'}.`,
      );
      void load();
    } catch {
      Alert.alert('Could not send', 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  // Nothing to say yet, and nothing is more deflating than being told
  // nobody is waiting for you.
  if (!stats || stats.waiting === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={[styles.count, { color: accent }]}>{stats.waiting}</Text>
        <Text style={styles.label}>
          {stats.waiting === 1 ? 'customer wants' : 'customers want'} to know
          when you&apos;re free
        </Text>
      </View>

      {/*
        Only shown once there is something to report. Before the first
        send these read as zeros, which looks like failure rather than
        an absence of history.
      */}
      {/*
        "Last time" rather than "last time you went green" — a broadcast
        counts too, and the line was written before broadcasts existed.
        Zero is worded as "nobody messaged you" rather than "0 messaged
        you", which reads like a broken template rather than a fact.
      */}
      {stats.lastNotified > 0 ? (
        <Text style={styles.result}>
          Last time, {stats.lastNotified}{' '}
          {stats.lastNotified === 1 ? 'person was' : 'people were'} told and{' '}
          <Text style={styles.strong}>
            {stats.repliedAfter === 0
              ? 'nobody messaged you'
              : `${stats.repliedAfter} messaged you`}
          </Text>
          .
        </Text>
      ) : null}

      {stats.standing > 0 ? (
        <Pressable
          onPress={() => setComposing(true)}
          style={[styles.button, { borderColor: accent }]}
        >
          <Ionicons name="megaphone-outline" size={16} color={accent} />
          <Text style={[styles.buttonLabel, { color: accent }]}>
            Message the {stats.standing} following you
          </Text>
        </Pressable>
      ) : null}

      <Modal visible={composing} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Message your list</Text>
            <Text style={styles.sheetHint}>
              Goes to the {stats.standing} who asked to hear from you every
              time. Your pin stays as it is — this does not make you green.
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="3pm Friday just come free — first to message gets it"
              placeholderTextColor="#9a9a9a"
              multiline
              maxLength={120}
              style={styles.input}
            />
            <Text style={styles.counter}>{message.trim().length}/120</Text>

            <View style={styles.sheetButtons}>
              <Pressable
                onPress={() => setComposing(false)}
                style={styles.secondary}
              >
                <Text style={styles.secondaryLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void send()}
                disabled={!message.trim() || sending}
                style={[
                  styles.primary,
                  { backgroundColor: accent },
                  (!message.trim() || sending) && { opacity: 0.5 },
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryLabel}>Send</Text>
                )}
              </Pressable>
            </View>

            {/* One send per twelve hours. Said up front, because finding
                out by being refused is worse. */}
            <Text style={styles.limit}>You can send once every 12 hours.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eceae2',
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontSize: 30, fontWeight: '800' },
  label: { flex: 1, fontSize: 14, color: '#5a5a5a', lineHeight: 19 },
  result: { marginTop: 10, fontSize: 13, color: '#5a5a5a', lineHeight: 18 },
  strong: { fontWeight: '800', color: '#171717' },
  button: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
  },
  buttonLabel: { fontSize: 14, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#171717' },
  sheetHint: { fontSize: 13, color: '#5a5a5a', marginTop: 6, lineHeight: 18 },
  input: {
    marginTop: 14,
    minHeight: 84,
    borderWidth: 1,
    borderColor: '#e2e0d6',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#171717',
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: '#9a9a9a', marginTop: 4 },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: '#f2f1ec' },
  secondaryLabel: { fontSize: 15, fontWeight: '700', color: '#5a5a5a' },
  primary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12 },
  primaryLabel: { fontSize: 15, fontWeight: '800', color: '#fff' },
  limit: { fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 10 },
});

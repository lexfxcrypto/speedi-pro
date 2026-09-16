import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../lib/auth';

/**
 * Absolute, because fetchWithAuth passes the URL straight to fetch with
 * no base — every other call in this app spells the host out. A relative
 * path fails silently in a native runtime, which is exactly what
 * happened: the panel caught the error, rendered nothing, and looked
 * like a provider with no followers.
 */
const API = 'https://www.speeditrades.com';

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
 * ── What is deliberately NOT here ──────────────────────────────────────
 * The share card that builds the list. It sat in this panel and was
 * intrusive — a plumber who will never onboard a client had a QR code in
 * the middle of the screen they open to go green. It now lives at the
 * bottom of the home tab, which is where something optional belongs.
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
  providerId: string;
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
      const res = await fetchWithAuth(`${API}/api/native/follower-stats`);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      /**
       * Logged, not swallowed silently. The first version caught and
       * ignored, so a wrong URL rendered an empty panel that looked
       * exactly like a provider with no followers — a bug indis-
       * tinguishable from a normal state is one nobody reports.
       */
      console.warn('[waiting-list] stats failed', err);
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
      const res = await fetchWithAuth(`${API}/api/native/notify-followers`, {
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
  if (!stats) return null;

  /**
   * At zero the panel stays, but the count goes.
   *
   * The original rule hid it entirely, on the grounds that nothing is
   * more deflating than being told nobody is waiting for you. That
   * holds for the NUMBER and is exactly wrong for the share link: a
   * provider with no list is precisely who needs the means to build
   * one, so hiding it withheld the fix from everyone who had the
   * problem.
   */
  const empty = stats.waiting === 0;

  return (
    <View style={styles.card}>
      {empty ? (
        <Text style={styles.label}>
          When your clients follow you here, they get a notification the
          moment you go green — or when you post a cancellation.
        </Text>
      ) : (
        <View style={styles.headRow}>
          <Text style={[styles.count, { color: accent }]}>{stats.waiting}</Text>
          <Text style={styles.label}>
            {stats.waiting === 1 ? 'customer wants' : 'customers want'} to know
            when you&apos;re free
          </Text>
        </View>
      )}

      {/*
        Only shown once there is something to report. Before the first
        send these read as zeros, which looks like failure rather than
        an absence of history.
      */}
      {/*
        No "2 were told and nobody messaged you".
        
        It was here and it was wrong: a pro who went green and got no
        reply did nothing incorrect, and reporting it back to them reads
        as Speedi grading their performance — or worse, as the platform
        admitting it did not work. Alex's call to scrap it and he is
        right.

        The underlying numbers are still recorded — FollowNotification
        logs every send — so a proper dashboard can show conversion
        where it belongs, on the admin side, where it is a question
        about the platform rather than a judgement on one provider.
      */}

      {stats.standing > 0 ? (
        <>
          {stats.standing < stats.waiting ? (
            <Text style={styles.footnote}>
              All {stats.waiting} get told when you go green.{' '}
              {stats.standing} of them also asked to hear from you directly.
            </Text>
          ) : null}
          <Pressable
            onPress={() => setComposing(true)}
            style={[styles.button, { borderColor: accent }]}
          >
            <Ionicons name="megaphone-outline" size={16} color={accent} />
            <Text style={[styles.buttonLabel, { color: accent }]}>
              Message the {stats.standing} following you
            </Text>
          </Pressable>
        </>
      ) : (
        /**
         * Waiting, but nobody to message. Without this the panel simply
         * has no button and a provider is left wondering where it went.
         */
        stats.waiting > 0 ? (
          <Text style={styles.footnote}>
            They&apos;ll all be told when you go green. Nobody has asked to
            hear from you directly yet — share your link and tell them to
            tick &ldquo;every time&rdquo;.
          </Text>
        ) : null
      )}

      <Modal visible={composing} animationType="slide" transparent>
        {/*
          The sheet is bottom-anchored, so the keyboard opens straight
          over the input and the box being typed into is the one thing
          hidden. Lifting the whole sheet is the fix — padding on iOS,
          height on Android, which is the pairing that actually works
          rather than the one that looks symmetrical.
        */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.backdrop}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Message your list</Text>
            <Text style={styles.sheetHint}>
              Goes to the {stats.standing} who asked to hear from you every
              time. Your pin stays as it is — this does not make you green.
              Good for a slot opening up, and for saying when it has gone.
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="3pm Friday just come free — first to message gets it"
              placeholderTextColor="rgba(255,255,255,0.35)"
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

            {/* Said up front, because finding out by being refused is
                worse. Four, because one cancellation is several
                messages — free, then taken. */}
            <Text style={styles.limit}>You can send up to 4 messages a day.</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/**
 * Dark, because the app is.
 *
 * The first version used white cards and a white sheet, which is the
 * default any component gets when it is written without looking at the
 * screen it lands on — and it sat on a near-black home tab like a
 * pasted-in dialog. Surfaces here are a lift off the background rather
 * than a different colour: rgba white at low alpha, so one set of
 * values works whatever sits behind it.
 */
const SURFACE = 'rgba(255,255,255,0.06)';
const SURFACE_HI = '#1C1C1E';
const BORDER = 'rgba(255,255,255,0.12)';
const TEXT = '#F5F5F5';
const TEXT_DIM = 'rgba(255,255,255,0.55)';

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontSize: 30, fontWeight: '800' },
  label: { flex: 1, fontSize: 14, color: TEXT_DIM, lineHeight: 19 },
  result: { marginTop: 10, fontSize: 13, color: TEXT_DIM, lineHeight: 18 },
  strong: { fontWeight: '800', color: TEXT },
  // No divider when the share card is the first thing in the panel.
  shareRowFirst: { borderTopWidth: 0, paddingTop: 4 },
  shareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  shareLinkText: { fontSize: 12, fontWeight: '700', color: TEXT_DIM },
  footnote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_DIM,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  qrBox: { backgroundColor: '#fff', padding: 6, borderRadius: 8 },
  shareBody: { flex: 1 },
  shareTitle: { fontSize: 14, fontWeight: '800', color: TEXT },
  shareHint: { fontSize: 12, color: TEXT_DIM, marginTop: 2, lineHeight: 16 },
  shareButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  shareBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  shareBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  shareBtnAlt: {
    flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  shareBtnAltText: { fontSize: 13, fontWeight: '800' },
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
  sheet: { backgroundColor: SURFACE_HI, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: TEXT },
  sheetHint: { fontSize: 13, color: TEXT_DIM, marginTop: 6, lineHeight: 18 },
  input: {
    marginTop: 14,
    minHeight: 84,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: TEXT,
    backgroundColor: 'rgba(255,255,255,0.05)',
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: TEXT_DIM, marginTop: 4 },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  secondaryLabel: { fontSize: 15, fontWeight: '700', color: TEXT_DIM },
  primary: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12 },
  primaryLabel: { fontSize: 15, fontWeight: '800', color: '#fff' },
  limit: { fontSize: 11, color: TEXT_DIM, textAlign: 'center', marginTop: 10 },
});

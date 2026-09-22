import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { fetchWithAuth } from '../lib/auth';
import { useT } from '../lib/i18n';

const API = 'https://www.speeditrades.com';

/**
 * "Get your clients on your list" — at the bottom of the home tab.
 *
 * ── Why it is down here and not in the availability panel ──────────────
 * It started up there, next to the traffic light, and was intrusive: a
 * plumber who will never onboard a client had a QR code in the middle of
 * the screen they open to go green. Collapsing it behind a link helped
 * and did not fix it — the line was still there, still asking.
 *
 * Growth mechanics are optional to the person using the app. A salon
 * that wants a waiting list will go looking for this; a trade that does
 * not should be able to use Speedi for months without meeting it. The
 * bottom of the screen is where something optional lives.
 *
 * ── Two forms, two moments ─────────────────────────────────────────────
 * A QR for the counter, a mirror, the back of a card — somebody
 * physically present. A link for Instagram and WhatsApp, where a QR is
 * useless because the customer is already holding the phone they would
 * have to scan it with.
 */
export function BuildYourList({ accent }: { accent: string }) {
  const { t } = useT();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/native/follower-stats`);
      if (res.ok) setProviderId((await res.json()).providerId ?? null);
    } catch (err) {
      console.warn('[build-list] stats failed', err);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!providerId) return null;

  const link = `https://www.speedi.co.uk/notify/${providerId}`;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.header}>
        <Ionicons
          name="person-add-outline"
          size={15}
          color="rgba(255,255,255,0.5)"
        />
        <Text style={styles.headerText}>{t('modals.buildListHeader')}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={15}
          color="rgba(255,255,255,0.4)"
        />
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <Text style={styles.hint}>{t('modals.buildListHint')}</Text>

          <View style={styles.row}>
            <View style={styles.qrBox}>
              <QRCode value={link} size={76} color="#111" backgroundColor="#fff" />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Pressable
                onPress={() =>
                  void Share.share({
                    /**
                     * Written for them. A provider between clients will
                     * not compose this, and it names the every-time
                     * option because the toggle defaults to once — a
                     * regular who leaves it is told a single time and
                     * never again.
                     */
                    message: t('modals.buildListShareMessage', { link }),
                  })
                }
                style={[styles.btn, { backgroundColor: accent }]}
              >
                <Text style={styles.btnText}>{t('modals.buildListSend')}</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(link);
                  Alert.alert(t('modals.buildListCopiedTitle'), t('modals.buildListCopiedMessage'));
                }}
                style={styles.btnAlt}
              >
                <Text style={[styles.btnAltText, { color: accent }]}>
                  {t('modals.buildListCopy')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 28, marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
  },
  headerText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  body: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
  },
  hint: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.55)' },
  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  qrBox: { backgroundColor: '#fff', padding: 6, borderRadius: 8 },
  btn: { alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  btnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  btnAlt: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnAltText: { fontSize: 13, fontWeight: '800' },
});

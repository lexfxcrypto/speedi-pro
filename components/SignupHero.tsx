import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useT } from '../lib/i18n';
import { Logo } from './Logo';

/**
 * The top of the sign-up screen: the animated lockup with "pro", and the
 * pitch — "Offer a trade or service? Show your customers your realtime
 * availability."
 *
 * From Alex's banner (22 Sep 2026), with two changes he asked for: the
 * lockup is the real one, traffic light as the dot of the i, animated as
 * in the customer app; and "realtime" is highlighted green rather than
 * orange. Green is the light a business is signing up to switch on.
 */
const GREEN = '#22A447';

export function SignupHero() {
  const { t } = useT();
  const { width } = useWindowDimensions();
  const logoHeight = Math.min(64, (width * 0.5) / 2.9);

  return (
    <View style={styles.wrap}>
      {/* The banner's soft circles, behind everything and untouchable. */}
      <View pointerEvents="none" style={[styles.circle, { width: width * 0.6, height: width * 0.6, borderRadius: width, top: -width * 0.35, right: -width * 0.35 }]} />
      <View pointerEvents="none" style={[styles.circle, { width: width * 0.5, height: width * 0.5, borderRadius: width, bottom: -width * 0.25, left: -width * 0.4 }]} />

      <View style={styles.lockup}>
        <Logo variant="white" height={logoHeight} />
        <Text style={[styles.pro, { fontSize: logoHeight * 0.36 }]}>pro</Text>
      </View>

      <Text style={styles.question}>{t('register.heroQuestion')}</Text>

      <View style={styles.pitch}>
        {t('register.heroLead') ? <Text style={styles.pitchText}>{t('register.heroLead')} </Text> : null}
        <View>
          <View style={styles.highlight}>
            <Text style={[styles.pitchText, styles.highlightText]}>{t('register.heroHighlight')}</Text>
          </View>
          <View style={styles.highlightUnderline} />
        </View>
        {t('register.heroTail') ? <Text style={styles.pitchText}> {t('register.heroTail')}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 28 },
  circle: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.05)' },
  lockup: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  pro: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 6,
    marginTop: -2,
  },
  question: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  pitch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchText: {
    color: '#E5E5E5',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 30,
  },
  highlight: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingHorizontal: 7,
  },
  highlightText: { color: '#FFFFFF', fontWeight: '800' },
  highlightUnderline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: GREEN,
    marginTop: 3,
  },
});

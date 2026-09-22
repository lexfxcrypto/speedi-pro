import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

/**
 * The Speedi lockup — the real artwork, not an approximation.
 *
 * Copied from speedi-consumer/components/Logo.tsx (22 Sep 2026) so the
 * Pro sign-up screen animates the same mark the customer app does. Keep
 * the two in step: the paths are the web's speedi-logo-animated.svg.
 *
 * What was here before drew the mark out of React Native primitives: the
 * word "Speedi" set in Nunito with three dots in a row beside it. It was
 * never the logo. The real mark is a lowercase custom wordmark with the
 * traffic light stacked VERTICALLY as the dot of the i, and Alex spotted
 * it immediately in the app ("it uses an incorrect logo, it should use
 * real logo").
 *
 * The paths below are lifted from speedi-logo-animated.svg in the web
 * repo — the same artwork the site serves, so the two cannot drift by
 * redrawing. viewBox and coordinates are unchanged from that file.
 *
 * ── Why not the PNG ───────────────────────────────────────────────────
 * assets/speedi-logo.png is the WHITE lockup on a transparent 4059x2938
 * canvas: on a light background the word disappears and three small dots
 * float in the middle of a lot of nothing. Vector solves both the
 * variant problem and the "giant mostly-empty canvas" problem, and is
 * what makes the lights animatable.
 *
 * ── The animation ─────────────────────────────────────────────────────
 * Same cycle the site runs, so the brand behaves the same on both. The
 * SVG's own values table has a ~1s window where all three lights sit
 * dim; that reads as a glitch in an app header, so the sequence here is
 * the one the file's comment describes and a traffic light actually
 * performs: red, red+amber, green, amber, red.
 *
 * Reduced motion gets all three lit, which is what the static twin does
 * and for the reason given there: one colour frozen reads as a claim
 * about availability, and the logo has no business making one.
 */

type Props = {
  /** Wordmark height in points. The artwork scales from this. */
  height?: number;
  variant?: 'default' | 'white';
  /** Off for a still mark — lists, share cards, anywhere it repeats. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

const INK = '#231f20';

const LIT = { red: '#e01919', amber: '#ffac1a', green: '#22e217' };
const DIM = { red: '#5a0a0a', amber: '#5a3a00', green: '#0a3a0a' };

/** The artwork's own box, straight from the SVG. */
const VIEW_BOX = '248 264 480 165';
const ASPECT = 480 / 165;

type Phase = { ms: number; red: boolean; amber: boolean; green: boolean };

const CYCLE: Phase[] = [
  { ms: 3000, red: true, amber: false, green: false },
  { ms: 1000, red: true, amber: true, green: false },
  { ms: 3000, red: false, amber: false, green: true },
  { ms: 1000, red: false, amber: true, green: false },
  { ms: 2000, red: true, amber: false, green: false },
];

const ALL_LIT: Phase = { ms: 0, red: true, amber: true, green: true };

export function Logo({
  height = 36,
  variant = 'default',
  animated = true,
  style,
}: Props) {
  const word = variant === 'white' ? '#fff' : INK;
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => live && setReduceMotion(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (on) => live && setReduceMotion(on),
    );
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  const running = animated && !reduceMotion;

  useEffect(() => {
    if (!running) return;
    // One timeout per phase rather than a ticking interval: the lights
    // change five times in ten seconds, so there is nothing to poll for.
    const t = setTimeout(
      () => setStep((s) => (s + 1) % CYCLE.length),
      CYCLE[step].ms,
    );
    return () => clearTimeout(t);
  }, [running, step]);

  const phase = running ? CYCLE[step] : ALL_LIT;

  return (
    <View
      style={style}
      accessibilityLabel="Speedi"
      accessibilityRole="image"
    >
      <Svg width={height * ASPECT} height={height} viewBox={VIEW_BOX}>
        {/* Wordmark — s p e e d */}
        <G fill={word}>
          <Path d="M253.18,380.95h0c2.01-4.32,7.03-6.38,11.47-4.64,6.14,2.41,13.32,3.88,20.02,3.88,10.62,0,14.62-2.81,14.62-7.24,0-12.98-47.93.3-47.93-31.4,0-15.05,13.58-25.66,36.71-25.66,7.16,0,14.83,1.08,21.39,3.08,5.07,1.54,7.54,7.27,5.3,12.07l-.15.32c-1.93,4.13-6.68,6.01-10.98,4.5-5.34-1.87-10.59-2.57-15.55-2.57-10.33,0-14.73,3.25-14.73,7.37,0,13.58,47.9.45,47.9,31.71,0,14.75-13.7,25.22-37.43,25.22-9.08,0-18.21-1.68-25.46-4.28-5.02-1.8-7.41-7.52-5.16-12.36Z" />
          <Path d="M413.83,356.75c0,24.92-17.23,40.84-39.5,40.84-9.9,0-17.98-3.09-23.91-9.58v25.52c0,6.35-5.15,11.49-11.49,11.49h0c-6.35,0-11.49-5.15-11.49-11.49v-89.46c0-3.87,3.13-7,7-7h7.98c3.87,0,7,3.13,7,7v2.15c5.73-6.93,14.3-10.33,24.92-10.33,22.27,0,39.5,15.94,39.5,40.85ZM391.53,356.75c0-13.72-8.69-21.98-20.2-21.98s-20.2,8.26-20.2,21.98,8.72,21.97,20.2,21.97,20.2-8.26,20.2-21.97Z" />
          <Path d="M494.63,363.24h-54.19c2.22,9.88,10.62,15.92,22.7,15.92,5.61,0,10.17-1.12,14.21-3.4,3.73-2.11,8.42-1.32,11.32,1.83h0c4.08,4.42,2.92,11.45-2.31,14.42-6.47,3.68-14.45,5.58-23.83,5.58-27.42,0-45.26-17.25-45.26-40.84s18.13-40.85,42.32-40.85,41.29,15.64,41.29,41.14c0,.02,0,.04,0,.05-.01,3.41-2.85,6.15-6.26,6.15ZM440.13,349.82h39.07c-1.61-10.03-9.12-16.51-19.45-16.51s-17.98,6.34-19.62,16.51Z" />
          <Path d="M582.2,363.24h-54.19c2.22,9.88,10.62,15.92,22.7,15.92,5.61,0,10.17-1.12,14.21-3.4,3.73-2.11,8.42-1.32,11.32,1.83h0c4.08,4.42,2.92,11.45-2.31,14.42-6.47,3.68-14.45,5.58-23.83,5.58-27.42,0-45.26-17.25-45.26-40.84s18.13-40.85,42.32-40.85,41.29,15.64,41.29,41.14c0,.02,0,.04,0,.05-.01,3.41-2.85,6.15-6.26,6.15ZM527.69,349.82h39.07c-1.61-10.03-9.12-16.51-19.45-16.51s-17.98,6.34-19.62,16.51Z" />
          <Path d="M679.12,298.51v88.77c0,5.05-4.09,9.13-9.13,9.13h-3.68c-5.05,0-9.13-4.09-9.13-9.13h0c-5.75,6.92-14.16,10.31-24.77,10.31-22.41,0-39.68-15.92-39.68-40.84s17.26-40.85,39.68-40.85c9.72,0,17.98,3.11,23.74,9.6v-26.99c0-6.35,5.15-11.49,11.49-11.49h0c6.35,0,11.49,5.15,11.49,11.49ZM655.57,356.75c0-13.72-8.83-21.98-20.2-21.98s-20.34,8.26-20.34,21.98,8.83,21.97,20.34,21.97,20.2-8.26,20.2-21.97Z" />
          {/* The i, below its lights */}
          <Path d="M705.88,358.43c-3.11,0-6.02-.77-8.61-2.09-1.33-.68-2.9.29-2.9,1.78v27.85c0,6.23,5.05,11.28,11.28,11.28h0c6.23,0,11.28-5.05,11.28-11.28v-27.59c0-1.49-1.55-2.42-2.9-1.78-2.47,1.17-5.23,1.84-8.15,1.84Z" />
        </G>

        {/*
          The lights, bottom to top: red, amber, green. The rings stay
          ink in both variants — that is how the white lockup is drawn,
          and the note in the brand memory is that the dots never knock
          out.
        */}
        <G>
          <Circle cx="705.88" cy="338.18" r="15.46" fill={phase.red ? LIT.red : DIM.red} />
          <Path fill={INK} d="M705.88,354.95c-9.25,0-16.77-7.52-16.77-16.77s7.52-16.77,16.77-16.77,16.77,7.52,16.77,16.77-7.52,16.77-16.77,16.77ZM705.88,324.04c-7.8,0-14.14,6.35-14.14,14.15s6.34,14.15,14.14,14.15,14.14-6.34,14.14-14.15-6.34-14.15-14.14-14.15Z" />
        </G>
        <G>
          <Circle cx="705.88" cy="317.39" r="15.46" fill={phase.amber ? LIT.amber : DIM.amber} />
          <Path fill={INK} d="M705.88,334.16c-9.25,0-16.77-7.52-16.77-16.77s7.52-16.77,16.77-16.77,16.77,7.52,16.77,16.77-7.52,16.77-16.77,16.77ZM705.88,303.24c-7.8,0-14.14,6.34-14.14,14.15s6.34,14.15,14.14,14.15,14.14-6.35,14.14-14.15-6.34-14.15-14.14-14.15Z" />
        </G>
        <G>
          <Circle cx="705.88" cy="296.74" r="15.46" fill={phase.green ? LIT.green : DIM.green} />
          <Path fill={INK} d="M705.88,313.52c-9.25,0-16.77-7.52-16.77-16.77s7.52-16.77,16.77-16.77,16.77,7.52,16.77,16.77-7.52,16.77-16.77,16.77ZM705.88,282.59c-7.8,0-14.14,6.35-14.14,14.15s6.34,14.15,14.14,14.15,14.14-6.35,14.14-14.15-6.34-14.15-14.14-14.15Z" />
        </G>
      </Svg>
    </View>
  );
}

import { StyleSheet, useWindowDimensions, View } from 'react-native';

/**
 * The traffic light, oversized and half off the left edge.
 *
 * Alex, 22 Sep 2026: "a coloured watermark down the whole left side,
 * kind of split down the middle". Three lights stacked and overlapping
 * as they do in the app icon, each cut in half by the screen edge, dim
 * enough to sit under the form rather than compete with it.
 *
 * The opacity is on the GROUP, not each light: per-light it doubled up
 * where they overlap and drew three seams the mark does not have.
 *
 * Behind everything and untouchable: it is a background, and it must
 * never swallow a tap meant for the email field.
 */
// Red at the top, green at the bottom — a traffic light, not a list.
const LIGHTS = ['#D65046', '#EDA23F', '#62CF4F'] as const;

export function BrandWatermark() {
  const { width } = useWindowDimensions();
  const size = width * 0.62;

  return (
    <View pointerEvents="none" style={[styles.wrap, { left: -size / 2 }]}>
      {LIGHTS.map((c, i) => (
        <View
          key={c}
          style={[
            styles.light,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: c,
              borderWidth: size * 0.035,
              // Overlap, as the icon's lights do — barely touching.
              marginTop: i ? -size * 0.14 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    // 0.09 disappeared on a phone screen; 0.16 was right.
    opacity: 0.16,
  },
  // The icon's dark ring, which is what separates the lights where they
  // meet. Screen-coloured so it reads as a gap rather than a stroke.
  light: { borderColor: '#0A0A0A' },
});

import { StyleSheet, useWindowDimensions, View } from 'react-native';

/**
 * The traffic light, oversized and half off the left edge.
 *
 * Alex, 22 Sep 2026: "a coloured watermark down the whole left side,
 * kind of split down the middle". Three lights stacked down the full
 * height, each cut in half by the screen edge, dim enough to sit under
 * the form rather than compete with it.
 *
 * Behind everything and untouchable: it is a background, and it must
 * never swallow a tap meant for the email field.
 */
const LIGHTS = ['#62CF4F', '#EDA23F', '#D65046'] as const;

export function BrandWatermark() {
  const { width } = useWindowDimensions();
  const size = width * 0.62;

  return (
    <View pointerEvents="none" style={[styles.wrap, { left: -size / 2 }]}>
      {LIGHTS.map((c) => (
        <View
          key={c}
          style={[
            styles.light,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: c },
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
    justifyContent: 'space-evenly',
  },
  // Dim: a watermark on black at full strength reads as three balloons.
  // 0.16 was still louder than the form; 0.09 reads as a tint.
  light: { opacity: 0.09 },
});

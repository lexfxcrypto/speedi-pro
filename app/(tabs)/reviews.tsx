/**
 * TEMPORARY DIAGNOSTIC SKELETON (2026-05-31)
 *
 * The full reviews tab crashes on iOS 1.0.3 build 24 with EXC_GUARD /
 * bug_type 308. Console live-streaming captured zero speedipro lines
 * before death — meaning the JS bridge isn't even reaching first log.
 *
 * To narrow whether the bug is reviews-specific or tab-navigation /
 * background-work coincidence, we ship this skeleton: pure rendering,
 * zero useEffect, zero network, zero imports beyond React + react-native
 * primitives.
 *
 *   • Skeleton still crashes → bug isn't reviews.tsx logic; it's something
 *     in the tab-change path or background work coinciding with the tap.
 *   • Skeleton works → bug IS in reviews.tsx logic (fetch / state / render
 *     loop). Restore from git and bisect back in piece by piece.
 *
 * Once we know which: restore via `git show <previous-commit>:app/(tabs)/reviews.tsx > app/(tabs)/reviews.tsx`
 * — the full implementation is on the prior commit.
 */

import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Reviews() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>Reviews</Text>
        <Text style={styles.subtitle}>Diagnostic skeleton — if you see this, the tab itself is fine.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

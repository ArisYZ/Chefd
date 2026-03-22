import React from 'react';
import { StyleSheet, View } from 'react-native';
import ColorBends from '@/components/web/ColorBends';

/**
 * Full-viewport ColorBends (React Bits) behind the app on web.
 * @see https://reactbits.dev/backgrounds/color-bends
 */
export function AppBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.layer]}>
      <ColorBends
        rotation={0}
        speed={0.05}
        colors={['#c2a824', '#1a2e56', '#0d293b']}
        transparent
        autoRotate={0}
        scale={1.6}
        frequency={1}
        warpStrength={1}
        mouseInfluence={0.4}
        parallax={0.1}
        noise={0.05}
        style={styles.canvas}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 0,
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
});

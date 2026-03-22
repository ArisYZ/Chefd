import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Fonts, BorderRadius } from '@/constants/Colors';

interface RatingBadgeProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  /** When set (e.g. "/ 5.0"), shown under the score for a consistent out-of scale. */
  scale?: string;
}

/** Darker fills/borders for the encore bar (tier tints). */
function getRatingBarColors(rating: number): { fill: string; border: string } {
  if (rating >= 4.0) {
    return { fill: Colors.primaryDark, border: Colors.primaryDark };
  }
  if (rating >= 2.5) {
    return { fill: '#8A6A0E', border: '#6B5210' };
  }
  return { fill: '#7A2E24', border: '#5C231A' };
}

/** Typography: bold scores use brand dark blue, not pure black. */
const scoreColor = Colors.primary;

const SIZE = {
  sm: { trackH: 7, trackW: 52, gap: 8, font: FontSize.sm, labelFs: 8, unratedW: 78, unratedH: 32, unratedFs: 8 },
  md: { trackH: 8, trackW: 60, gap: 10, font: FontSize.md, labelFs: 8, unratedW: 88, unratedH: 36, unratedFs: 9 },
  lg: { trackH: 9, trackW: 80, gap: 12, font: FontSize.lg, labelFs: 9, unratedW: 100, unratedH: 42, unratedFs: 10 },
  /** Recipe detail header — hero Encore score + bar */
  xl: { trackH: 12, trackW: 112, gap: 16, font: FontSize.xxxl, labelFs: 12, unratedW: 120, unratedH: 52, unratedFs: 12 },
} as const;

function Track({
  bar,
  fillPct,
  trackW,
  trackH,
}: {
  bar: { fill: string; border: string };
  fillPct: number;
  trackW: number;
  trackH: number;
}) {
  return (
    <View style={styles.trackShadow}>
      <View style={[styles.track, { borderColor: bar.border, width: trackW, height: trackH }]}>
        <View style={styles.trackInner} />
        <View style={[styles.fill, { width: `${fillPct}%`, backgroundColor: bar.fill }]} />
      </View>
    </View>
  );
}

export function RatingBadge({ rating, size = 'md', label, scale }: RatingBadgeProps) {
  const s = SIZE[size];
  const fontSize = s.font;
  /** Recipe-style header: number centered over bar, bar, label centered under bar. */
  const stacked = Boolean(label && size !== 'sm');

  if (rating === null || rating === 0) {
    return (
      <View
        style={[
          styles.unratedOuter,
          stacked && styles.unratedStacked,
          {
            width: s.unratedW,
            minHeight: s.unratedH,
            paddingVertical: size === 'sm' ? 5 : 7,
            paddingHorizontal: stacked ? 6 : 8,
          },
        ]}
      >
        <Text style={[styles.unratedText, { fontSize: s.unratedFs }]}>NOT YET{'\n'}RATED</Text>
      </View>
    );
  }

  const bar = getRatingBarColors(rating);
  const fillPct = Math.min(100, Math.max(0, (rating / 5) * 100));

  if (stacked) {
    return (
      <View style={[styles.columnStacked, { width: s.trackW }]}>
        <View style={styles.scoreRowTop}>
          <Text style={[styles.scoreText, styles.scoreTextStacked, { fontSize }]}>
            {rating.toFixed(1)}
            {scale ? (
              <Text style={[styles.scale, { color: Colors.primaryDark }]}> {scale}</Text>
            ) : null}
          </Text>
        </View>
        <View style={styles.trackRowStacked}>
          <Track bar={bar} fillPct={fillPct} trackW={s.trackW} trackH={s.trackH} />
        </View>
        <Text
          style={[
            styles.sublabelStacked,
            { fontSize: s.labelFs, width: s.trackW },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.columnInline}>
      <View style={styles.row}>
        <Track bar={bar} fillPct={fillPct} trackW={s.trackW} trackH={s.trackH} />
        <View style={[styles.scoreBlock, { marginLeft: s.gap }]}>
          <Text style={[styles.scoreText, { fontSize }]}>
            {rating.toFixed(1)}
            {scale ? (
              <Text style={[styles.scale, { color: Colors.primaryDark }]}> {scale}</Text>
            ) : null}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columnInline: {
    alignItems: 'flex-end',
  },
  /** Same width as bar so score / label / bar share one center axis. */
  columnStacked: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  scoreRowTop: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreTextStacked: {
    textAlign: 'center',
    width: '100%',
  },
  trackRowStacked: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackShadow: {
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  track: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  trackInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.borderLight + '80',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.95,
    borderTopRightRadius: BorderRadius.full,
    borderBottomRightRadius: BorderRadius.full,
  },
  scoreBlock: {
    flexShrink: 0,
  },
  scoreText: {
    fontFamily: Fonts.bodyExtraBold,
    fontWeight: '800',
    color: scoreColor,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  scale: {
    fontSize: 10,
    fontFamily: Fonts.bodySemiBold,
    fontWeight: '600',
    opacity: 0.92,
  },
  /** Centered under bar, same width as bar */
  sublabelStacked: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    opacity: 0.92,
  },
  unratedOuter: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unratedStacked: {
    alignSelf: 'flex-end',
  },
  unratedText: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    color: Colors.primary,
    opacity: 0.45,
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.4,
  },
});

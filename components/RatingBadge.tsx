import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/Colors';

interface RatingBadgeProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
}

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return Colors.ratingGreen;
  if (rating >= 5.0) return Colors.ratingYellow;
  return Colors.ratingRed;
}

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const dimensions = size === 'sm' ? 36 : size === 'md' ? 44 : 52;
  const fontSize = size === 'sm' ? FontSize.sm : size === 'md' ? FontSize.md : FontSize.lg;

  if (rating === null || rating === 0) {
    return (
      <View style={[styles.badge, styles.unrated, { width: dimensions, height: dimensions }]}>
        <Text style={[styles.unratedText, { fontSize: size === 'sm' ? 8 : size === 'md' ? 9 : 10 }]}>
          NOT YET{'\n'}RATED
        </Text>
      </View>
    );
  }

  const color = getRatingColor(rating);

  return (
    <View style={[styles.badge, { width: dimensions, height: dimensions, borderColor: color }]}>
      <Text style={[styles.text, { fontSize, color }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  text: {
    fontWeight: '700',
  },
  unrated: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  unratedText: {
    fontWeight: '600',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 11,
  },
});

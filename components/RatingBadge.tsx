import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/Colors';

interface RatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return Colors.ratingGreen;
  if (rating >= 6.0) return Colors.ratingYellow;
  return Colors.ratingRed;
}

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const dimensions = size === 'sm' ? 36 : size === 'md' ? 44 : 52;
  const fontSize = size === 'sm' ? FontSize.sm : size === 'md' ? FontSize.md : FontSize.lg;
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
});

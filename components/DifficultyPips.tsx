import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '@/constants/Colors';

interface DifficultyPipsProps {
  value: 1 | 2 | 3 | 4 | 5;
  showLabel?: boolean;
}

export function DifficultyPips({ value, showLabel = true }: DifficultyPipsProps) {
  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>Difficulty</Text>}
      <View style={styles.pips}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View
            key={n}
            style={[styles.pip, n <= value ? styles.filled : styles.empty]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  pips: {
    flexDirection: 'row',
    gap: 4,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filled: {
    backgroundColor: Colors.accent,
  },
  empty: {
    backgroundColor: Colors.border,
  },
});

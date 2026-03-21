import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';

interface RecipeTagChipsProps {
  tags: string[];
  size?: 'sm' | 'md';
}

export function RecipeTagChips({ tags, size = 'md' }: RecipeTagChipsProps) {
  if (!tags.length) return null;

  const isSm = size === 'sm';

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <View key={tag} style={[styles.chip, isSm && styles.chipSm]}>
          <Text style={[styles.label, isSm && styles.labelSm]}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
  },
  chipSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
});

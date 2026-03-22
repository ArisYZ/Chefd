import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { getTagConfig } from '@/constants/recipeTags';
import { getFlavorConfig } from '@/constants/flavorTags';

interface RecipeTagChipsProps {
  tags: string[];
  size?: 'sm' | 'md';
  maxVisible?: number;
}

export function RecipeTagChips({ tags, size = 'md', maxVisible }: RecipeTagChipsProps) {
  if (!tags.length) return null;

  const isSm = size === 'sm';
  const visible = maxVisible ? tags.slice(0, maxVisible) : tags;
  const overflow = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;

  return (
    <View style={styles.wrap}>
      {visible.map((tag) => {
        const cfg = getTagConfig(tag) ?? getFlavorConfig(tag);
        const color = cfg?.color ?? Colors.primaryDark;
        const icon = (cfg && 'icon' in cfg) ? (cfg as any).icon : undefined;

        return (
          <View
            key={tag}
            style={[
              styles.chip,
              isSm && styles.chipSm,
              { backgroundColor: color + '18', borderColor: color + '35' },
            ]}
          >
            {icon && !isSm && (
              <Ionicons name={icon} size={12} color={color} style={styles.icon} />
            )}
            <Text style={[styles.label, isSm && styles.labelSm, { color }]}>{tag}</Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <View style={[styles.chip, isSm && styles.chipSm, styles.overflowChip]}>
          <Text style={[styles.label, isSm && styles.labelSm, styles.overflowLabel]}>
            +{overflow} more
          </Text>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
  overflowChip: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  overflowLabel: {
    color: Colors.textSecondary,
  },
});

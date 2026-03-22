import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Fonts } from '@/constants/Colors';
import { getTagConfig } from '@/constants/recipeTags';
import { getFlavorConfig } from '@/constants/flavorTags';

interface RecipeTagChipsProps {
  tags: string[];
  size?: 'sm' | 'md';
  maxVisible?: number;
  /** Single scrollable row (e.g. recipe detail) so chips stay side-by-side instead of wrapping. */
  horizontalScroll?: boolean;
}

export function RecipeTagChips({ tags, size = 'md', maxVisible, horizontalScroll }: RecipeTagChipsProps) {
  if (!tags.length) return null;

  const isSm = size === 'sm';
  const limit = horizontalScroll ? undefined : maxVisible;
  const visible = limit ? tags.slice(0, limit) : tags;
  const overflow = limit && tags.length > limit ? tags.length - limit : 0;

  const chips = visible.map((tag) => {
    const cfg = getTagConfig(tag) ?? getFlavorConfig(tag);
    const color = cfg?.color ?? Colors.primaryDark;
    const icon = cfg && 'icon' in cfg ? (cfg as { icon?: string }).icon : undefined;

    return (
      <View
        key={tag}
        style={[
          styles.chip,
          isSm && styles.chipSm,
          horizontalScroll && styles.chipNoShrink,
          { backgroundColor: color + '18', borderColor: color + '35' },
        ]}
      >
        {icon && !isSm && (
          <Ionicons name={icon as any} size={12} color={color} style={styles.icon} />
        )}
        <Text style={[styles.label, isSm && styles.labelSm, { color }]}>{tag}</Text>
      </View>
    );
  });

  const overflowChip =
    overflow > 0 ? (
      <View style={[styles.chip, isSm && styles.chipSm, styles.overflowChip, horizontalScroll && styles.chipNoShrink]}>
        <Text style={[styles.label, isSm && styles.labelSm, styles.overflowLabel]}>+{overflow} more</Text>
      </View>
    ) : null;

  if (horizontalScroll) {
    return (
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: Colors.appCanvas }]}
      >
        {chips}
        {overflowChip}
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      {chips}
      {overflowChip}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scroll: {
    flexGrow: 0,
    alignSelf: 'stretch',
    /** Match page background — default ScrollView is white, so short rows show a white band on the right. */
    backgroundColor: Colors.appCanvas,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 2,
    paddingRight: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipNoShrink: {
    flexShrink: 0,
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
    fontFamily: Fonts.bodySemiBold,
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

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize, Fonts } from '@/constants/Colors';
import { RatingBadge } from './RatingBadge';
import { RecipeTagChips } from './RecipeTagChips';
import { RemoteImage } from './RemoteImage';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  showRating?: boolean;
  rank?: number;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  /** You reviewed or created this recipe (signed-in account). */
  isDone?: boolean;
}

export function RecipeCard({
  recipe,
  onPress,
  showRating = true,
  rank,
  onBookmarkPress,
  isBookmarked,
  isDone,
}: RecipeCardProps) {
  const creatorLabel =
    recipe.createdByName ??
    (recipe.createdByUserId ? `@${recipe.createdByUserId}` : 'Unknown cook');

  const cuisine = recipe.cuisine?.trim() ?? '';
  const category = recipe.category?.trim() ?? '';
  const metaParts = [cuisine, category, recipe.difficulty, `${recipe.prepTime + recipe.cookTime} min`].filter(
    (p) => p.length > 0,
  );
  const metaLine = metaParts.join(' · ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageWrap}>
        <RemoteImage uri={recipe.image} style={styles.image} />
        {isDone && (
          <View style={styles.doneBadge} accessibilityLabel="Done for you">
            <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          {rank !== undefined && <Text style={styles.rank}>#{rank}</Text>}
          <View style={styles.textContent}>
            <Text style={styles.name} numberOfLines={1}>
              {recipe.name}
            </Text>
            <Text style={styles.meta} numberOfLines={2} ellipsizeMode="tail">
              {metaLine}
            </Text>
            <Text style={styles.creator} numberOfLines={1}>
              By {creatorLabel}
            </Text>
          </View>
          {showRating && (
            <RatingBadge
              rating={recipe.totalRatings === 0 ? null : recipe.averageRating}
              size="sm"
            />
          )}
        </View>
        {recipe.tags.length > 0 && (
          <View style={styles.tagsRow}>
            <RecipeTagChips tags={recipe.tags} size="sm" maxVisible={3} />
          </View>
        )}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.statText}>{recipe.prepTime + recipe.cookTime}m</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.statText}>{recipe.servings} servings</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="star-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.statText}>{recipe.totalRatings} ratings</Text>
          </View>
          {onBookmarkPress && (
            <TouchableOpacity onPress={onBookmarkPress} hitSlop={8} style={styles.bookmarkBtn}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={isBookmarked ? Colors.primary : Colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imageWrap: {
    position: 'relative',
    width: 90,
    height: 90,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: '#f2f2f2',
  },
  doneBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  rank: {
    fontSize: FontSize.lg,
    fontFamily: Fonts.bodyExtraBold,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: Spacing.sm,
    minWidth: 28,
  },
  textContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bodySemiBold,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: FontSize.xs,
    lineHeight: Math.round(FontSize.xs * 1.35),
    color: Colors.textTertiary,
    marginTop: 2,
  },
  creator: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
  },
  tagsRow: {
    marginBottom: Spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    padding: 2,
  },
});

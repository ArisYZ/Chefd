import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { RatingBadge } from './RatingBadge';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  showRating?: boolean;
  rank?: number;
}

export function RecipeCard({ recipe, onPress, showRating = true, rank }: RecipeCardProps) {
  const creatorLabel = recipe.createdByName ?? (recipe.createdByUserId ? `@${recipe.createdByUserId}` : 'Unknown cook');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: recipe.image }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          {rank !== undefined && (
            <Text style={styles.rank}>#{rank}</Text>
          )}
          <View style={styles.textContent}>
            <Text style={styles.name} numberOfLines={1}>{recipe.name}</Text>
            <Text style={styles.meta}>
              {recipe.cuisine} · {recipe.difficulty} · {recipe.prepTime + recipe.cookTime} min
            </Text>
            <Text style={styles.creator} numberOfLines={1}>By {creatorLabel}</Text>
          </View>
          {showRating && <RatingBadge rating={recipe.totalRatings === 0 ? null : recipe.averageRating} size="sm" />}
        </View>
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
  image: {
    width: 90,
    height: 90,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rank: {
    fontSize: FontSize.lg,
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
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  creator: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
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
});

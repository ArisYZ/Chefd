import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import type { Recipe, User } from '@/types';
import { Colors, Spacing, FontSize, Fonts, BorderRadius } from '@/constants/Colors';
import { Avatar } from './Avatar';
import { RemoteImage } from './RemoteImage';
import { RatingBadge } from './RatingBadge';
import { SocialActions } from './SocialActions';

function recipeTeaserText(recipe: Recipe): string | null {
  const d = recipe.description?.trim();
  if (d) return d;
  const first = recipe.instructions?.find((s) => s?.trim());
  return first?.trim() ?? null;
}

interface RecipePostCardProps {
  recipe: Recipe;
  user: User;
  timestampLabel: string;
  onPress?: () => void;
  onUserPress?: () => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
}

export function RecipePostCard({
  recipe,
  user,
  timestampLabel,
  onPress,
  onUserPress,
  onBookmarkPress,
  isBookmarked,
}: RecipePostCardProps) {
  const teaser = recipeTeaserText(recipe);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onPress} activeOpacity={0.8}>
        <TouchableOpacity onPress={onUserPress} activeOpacity={0.7}>
          <Avatar uri={user.avatar} size={44} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerLine}>
            <Text style={styles.userName}>{user.name.split(' ')[0]}</Text>
            <Text style={styles.action}> posted </Text>
            <Text style={styles.recipeName}>{recipe.name}</Text>
          </Text>
          <Text style={styles.cuisine}>
            {recipe.cuisine} · {recipe.category}
          </Text>
        </View>
        {recipe.totalRatings > 0 && recipe.averageRating > 0 ? (
          <RatingBadge rating={recipe.averageRating} size="sm" />
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mediaWrap}
        onPress={onPress}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={`Open ${recipe.name}`}
      >
        <RemoteImage uri={recipe.image} style={styles.heroImage} contentFit="cover" />
        {teaser ? (
          <Text style={styles.teaser} numberOfLines={3} ellipsizeMode="tail">
            {teaser}
          </Text>
        ) : null}
      </TouchableOpacity>

      {!(recipe.totalRatings > 0 && recipe.averageRating > 0) ? (
        <Text style={styles.newRecipe}>New recipe — be the first to rate it</Text>
      ) : null}

      <SocialActions
        comments={0}
        onShare={() => Share.share({ message: `Check out "${recipe.name}" on Chef'd!` })}
        onBookmark={onBookmarkPress}
        isBookmarked={isBookmarked}
      />

      <Text style={styles.timestamp}>{timestampLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
    minWidth: 0,
  },
  headerLine: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userName: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    color: Colors.text,
  },
  action: {
    color: Colors.textSecondary,
  },
  recipeName: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    color: Colors.text,
  },
  cuisine: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  mediaWrap: {
    marginBottom: Spacing.md,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f2f2f2',
  },
  teaser: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
  },
  newRecipe: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});

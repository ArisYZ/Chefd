import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RecipeRating } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { Avatar } from './Avatar';
import { RatingBadge } from './RatingBadge';
import { SocialActions } from './SocialActions';

interface FeedCardProps {
  rating: RecipeRating;
  onPress?: () => void;
  onUserPress?: () => void;
}

export function FeedCard({ rating, onPress, onUserPress }: FeedCardProps) {
  const withText = rating.withUsers?.length
    ? `with ${rating.withUsers.map((u) => u.name.split(' ')[0]).join(', ')}`
    : '';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onPress} activeOpacity={0.8}>
        <TouchableOpacity onPress={onUserPress} activeOpacity={0.7}>
          <Avatar uri={rating.user.avatar} size={44} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerLine}>
            <Text style={styles.userName}>{rating.user.name.split(' ')[0]}</Text>
            <Text style={styles.action}> rated </Text>
            <Text style={styles.recipeName}>{rating.recipe.name}</Text>
          </Text>
          {withText ? (
            <Text style={styles.withText}>{withText}</Text>
          ) : null}
          <Text style={styles.cuisine}>{rating.recipe.cuisine} · {rating.recipe.category}</Text>
        </View>
        <RatingBadge rating={rating.rating} />
      </TouchableOpacity>

      {rating.favoritePart && (
        <Text style={styles.favoritePart}>
          <Text style={styles.label}>Favorite Part: </Text>
          {rating.favoritePart}
        </Text>
      )}

      {rating.notes ? (
        <Text style={styles.notes}>
          <Text style={styles.label}>Notes: </Text>
          {rating.notes}
        </Text>
      ) : null}

      <Text style={styles.likesCount}>{rating.likes} likes</Text>

      <SocialActions
        likes={rating.likes}
        comments={rating.comments}
        liked={rating.liked}
      />

      <Text style={styles.timestamp}>{rating.timestamp}</Text>
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
    marginRight: Spacing.md,
  },
  headerLine: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userName: {
    fontWeight: '700',
    color: Colors.text,
  },
  action: {
    color: Colors.textSecondary,
  },
  recipeName: {
    fontWeight: '700',
    color: Colors.text,
  },
  withText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cuisine: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  favoritePart: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 21,
  },
  notes: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 21,
  },
  label: {
    fontWeight: '600',
  },
  likesCount: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});

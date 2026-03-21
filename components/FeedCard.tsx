import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RecipeRating } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { Avatar } from './Avatar';
import { MakeAgainBadge } from './MakeAgainBadge';
import { DifficultyPips } from './DifficultyPips';
import { SocialActions } from './SocialActions';

interface FeedCardProps {
  rating: RecipeRating;
  onPress?: () => void;
  onUserPress?: () => void;
}

export function FeedCard({ rating, onPress, onUserPress }: FeedCardProps) {
  const { review } = rating;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onPress} activeOpacity={0.8}>
        <TouchableOpacity onPress={onUserPress} activeOpacity={0.7}>
          <Avatar uri={rating.user.avatar} size={44} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerLine}>
            <Text style={styles.userName}>{rating.user.name.split(' ')[0]}</Text>
            <Text style={styles.action}> reviewed </Text>
            <Text style={styles.recipeName}>{rating.recipe.name}</Text>
          </Text>
          <Text style={styles.cuisine}>{rating.recipe.cuisine} · {rating.recipe.category}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.reviewMeta}>
        <MakeAgainBadge value={review.makeAgain} />
        <DifficultyPips value={review.difficulty} />
      </View>

      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
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
  cuisine: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  comment: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 21,
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

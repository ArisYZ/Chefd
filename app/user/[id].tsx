import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { RecipeCard } from '@/components/RecipeCard';
import { MakeAgainBadge } from '@/components/MakeAgainBadge';
import { DifficultyPips } from '@/components/DifficultyPips';
import { useRecipes } from '@/contexts/RecipeContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { getUserById } from '@/constants/MockData';
import { authorDishEncoreWeighted } from '@/lib/cookStats';
import { formatOutOf5 } from '@/lib/formatScore';
import type { Review } from '@/types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipes, getReviewsForRecipe } = useRecipes();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const user = getUserById(id ?? '');

  const userRecipes = useMemo(
    () => recipes.filter(r => r.createdByUserId === id),
    [recipes, id],
  );

  const userReviews = useMemo(() => {
    const results: { review: Review; recipeName: string; recipeId: string }[] = [];
    for (const recipe of recipes) {
      const reviews = getReviewsForRecipe(recipe.id);
      for (const review of reviews) {
        if (review.user.id === id) {
          results.push({ review, recipeName: recipe.name, recipeId: recipe.id });
        }
      }
    }
    return results;
  }, [recipes, getReviewsForRecipe, id]);

  /** 1–5 encore for reviews they wrote (linked to listed reviews below). */
  const reviewerEncoreAvg = useMemo(() => {
    if (userReviews.length === 0) return null;
    const sum = userReviews.reduce((s, { review }) => {
      if (review.makeAgain === 'yes') return s + 5;
      if (review.makeAgain === 'maybe') return s + 3;
      return s + 1;
    }, 0);
    return parseFloat((sum / userReviews.length).toFixed(1));
  }, [userReviews]);

  /** Weighted 1–5 encore across ratings on recipes they authored (same as recipe cards / leaderboard). */
  const { weighted: dishEncoreAvg, ratingsReceived: dishRatingsReceived } = useMemo(
    () => authorDishEncoreWeighted(userRecipes),
    [userRecipes],
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar uri={user.avatar} size={80} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userRecipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dishRatingsReceived}</Text>
              <Text style={styles.statLabel}>Ratings on dishes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>
                {formatOutOf5(dishEncoreAvg)}
              </Text>
              <Text style={styles.statLabel}>Avg dish score</Text>
            </View>
          </View>

          <View style={[styles.statsRow, { marginTop: Spacing.md }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userReviews.length}</Text>
              <Text style={styles.statLabel}>Reviews written</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber} numberOfLines={1} adjustsFontSizeToFit>
                {formatOutOf5(reviewerEncoreAvg)}
              </Text>
              <Text style={styles.statLabel}>As reviewer</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.followersCount} / {user.followingCount}
              </Text>
              <Text style={styles.statLabel}>Followers / following</Text>
            </View>
          </View>
        </View>

        {userRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recipes ({userRecipes.length})
            </Text>
            {userRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                onBookmarkPress={() => toggleBookmark(recipe.id)}
                isBookmarked={isBookmarked(recipe.id)}
              />
            ))}
          </View>
        )}

        {userReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Reviews ({userReviews.length})
            </Text>
            {userReviews.map(({ review, recipeName, recipeId }) => (
              <TouchableOpacity
                key={review.id}
                style={styles.reviewCard}
                onPress={() => router.push(`/recipe/${recipeId}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.reviewRecipeName}>{recipeName}</Text>
                <View style={styles.reviewMetaRow}>
                  <MakeAgainBadge value={review.makeAgain} />
                  <DifficultyPips value={review.difficulty} />
                </View>
                {review.tasteRating != null && review.tasteRating > 0 && (
                  <View style={styles.tasteRow}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.tasteText}>
                      {review.tasteRating.toFixed(1)}/5 taste
                    </Text>
                  </View>
                )}
                {review.comment && (
                  <Text style={styles.reviewComment} numberOfLines={3}>
                    {review.comment}
                  </Text>
                )}
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewLikes}>
                    {review.likes} {review.likes === 1 ? 'like' : 'likes'}
                  </Text>
                  <Text style={styles.reviewTime}>{review.timestamp}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  name: { fontSize: FontSize.xl, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.text, marginTop: Spacing.md },
  username: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  bio: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignSelf: 'stretch',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FontSize.lg, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  section: { paddingBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewRecipeName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tasteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  tasteText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.ratingYellow },
  reviewComment: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 21,
    marginTop: Spacing.xs,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  reviewLikes: { fontSize: FontSize.xs, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary },
  reviewTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
});

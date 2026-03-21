import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { RatingBadge } from '@/components/RatingBadge';
import { MakeAgainBadge } from '@/components/MakeAgainBadge';
import { DifficultyPips } from '@/components/DifficultyPips';
import { ReviewModal } from '@/components/ReviewModal';
import { RecipeTagChips } from '@/components/RecipeTagChips';
import { Avatar } from '@/components/Avatar';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';
import { computeScore, Review, User } from '@/types';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipeById, getReviewsForRecipe, addReview } = useRecipes();
  const { user, onUserSubmittedReview } = useAuth();
  const recipe = getRecipeById(id ?? '');
  const [activeTab, setActiveTab] = useState<'recipe' | 'reviews'>('recipe');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const localReviews = getReviewsForRecipe(id ?? '');

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  const score = computeScore(localReviews);
  const yesCount = localReviews.filter((r) => r.makeAgain === 'yes').length;
  const yesPercent = localReviews.length > 0 ? Math.round((yesCount / localReviews.length) * 100) : 0;

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: recipe.image }} style={styles.heroImage} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={styles.name}>{recipe.name}</Text>
              <Text style={styles.cuisine}>{recipe.cuisine} · {recipe.category}</Text>
              {recipe.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <RecipeTagChips tags={recipe.tags} />
                </View>
              )}
            </View>
            <RatingBadge rating={score} size="lg" />
          </View>

          {/* Score summary */}
          {localReviews.length > 0 && (
            <View style={styles.scoreSummary}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>{yesPercent}%</Text>
                <Text style={styles.scoreLabel}>would make again</Text>
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>{localReviews.length}</Text>
                <Text style={styles.scoreLabel}>reviews</Text>
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>
                  {(localReviews.reduce((s, r) => s + r.difficulty, 0) / localReviews.length).toFixed(1)}
                </Text>
                <Text style={styles.scoreLabel}>avg difficulty</Text>
              </View>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.metaValue}>{recipe.prepTime + recipe.cookTime}m</Text>
              <Text style={styles.metaLabel}>Total</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={18} color={Colors.primary} />
              <Text style={styles.metaValue}>{recipe.difficulty}</Text>
              <Text style={styles.metaLabel}>Level</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
              <Text style={styles.metaValue}>{recipe.servings}</Text>
              <Text style={styles.metaLabel}>Servings</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rateButton}
              activeOpacity={0.8}
              onPress={() => setShowReviewModal(true)}
            >
              <Ionicons name="create-outline" size={18} color={Colors.white} />
              <Text style={styles.rateButtonText}>Write a Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'recipe' && styles.activeTab]}
              onPress={() => setActiveTab('recipe')}
            >
              <Text style={[styles.tabText, activeTab === 'recipe' && styles.activeTabText]}>Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                Reviews ({localReviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'recipe' ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {recipe.instructions.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.section}>
              {localReviews.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>No reviews yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to review this recipe!</Text>
                </View>
              ) : (
                localReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Avatar uri={review.user.avatar} size={36} />
                      <View style={styles.reviewHeaderText}>
                        <Text style={styles.reviewUser}>{review.user.name}</Text>
                        <Text style={styles.reviewTime}>{review.timestamp}</Text>
                      </View>
                    </View>
                    <View style={styles.reviewMetaRow}>
                      <MakeAgainBadge value={review.makeAgain} />
                      <DifficultyPips value={review.difficulty} />
                    </View>
                    {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ReviewModal
        visible={showReviewModal}
        recipeName={recipe.name}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async (data) => {
          const reviewUser: User = {
            id: user?.id ?? 'local',
            name: user?.displayName ?? 'You',
            username: user?.username ?? 'you',
            avatar: user?.avatarUri ?? '',
            bio: user?.bio ?? '',
            followersCount: user?.followersCount ?? 0,
            followingCount: user?.followingCount ?? 0,
            recipesRated: user?.reviewCount ?? 0,
          };
          const newReview: Review = {
            id: `rev-${Date.now()}`,
            user: reviewUser,
            recipeId: recipe.id,
            makeAgain: data.makeAgain,
            difficulty: data.difficulty as 1 | 2 | 3 | 4 | 5,
            comment: data.comment || undefined,
            likes: 0,
            liked: false,
            timestamp: 'Just now',
          };
          addReview(newReview);
          setShowReviewModal(false);
          setActiveTab('reviews');
          if (user) await onUserSubmittedReview(data.makeAgain);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width,
    height: width * 0.65,
    backgroundColor: '#E0E0E0',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  titleText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  cuisine: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tagsSection: {
    marginTop: Spacing.md,
  },
  scoreSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '0A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    backgroundColor: Colors.primary + '20',
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  metaDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  rateButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  ingredientText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reviewHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  reviewUser: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  reviewComment: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 21,
    marginTop: Spacing.sm,
  },
});

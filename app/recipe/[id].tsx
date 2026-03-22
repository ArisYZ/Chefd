import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { RatingBadge } from '@/components/RatingBadge';
import { MakeAgainBadge } from '@/components/MakeAgainBadge';
import { DifficultyPips } from '@/components/DifficultyPips';
import { ReviewModal } from '@/components/ReviewModal';
import { RecipeTagChips } from '@/components/RecipeTagChips';
import { Avatar } from '@/components/Avatar';
import { RemoteImage } from '@/components/RemoteImage';
import { SocialActions } from '@/components/SocialActions';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useSocial } from '@/contexts/SocialContext';
import { computeScore, computeTasteScore, Review, User } from '@/types';
import { formatIngredientLine } from '@/lib/ingredients';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecipeById, getReviewsForRecipe, addReview, deleteRecipe } = useRecipes();
  const { user, onUserSubmittedReview, removeRecipeFromFavorites } = useAuth();
  const { isBookmarked, toggleBookmark, removeRecipeFromBookmarks } = useBookmarks();
  const { isLiked, getLikeCount, toggleLike } = useSocial();
  const recipe = getRecipeById(id ?? '');
  const [activeTab, setActiveTab] = useState<'recipe' | 'reviews'>('recipe');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const localReviews = getReviewsForRecipe(id ?? '');

  const toggleIngredient = useCallback((index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  const score = computeScore(localReviews);
  const tasteScore = computeTasteScore(localReviews);
  const yesCount = localReviews.filter((r) => r.makeAgain === 'yes').length;
  const yesPercent = localReviews.length > 0 ? Math.round((yesCount / localReviews.length) * 100) : 0;
  const avgDifficulty =
    localReviews.length > 0
      ? (localReviews.reduce((s, r) => s + r.difficulty, 0) / localReviews.length).toFixed(1)
      : null;
  const creatorLabel =
    recipe.createdByName ?? (recipe.createdByUserId ? `@${recipe.createdByUserId}` : 'Unknown cook');
  /** App-created recipes use `ur-` ids; creator may be missing if imported while logged out. */
  const isOwnRecipe = Boolean(
    user?.id &&
      recipe.id.startsWith('ur-') &&
      (recipe.createdByUserId == null || recipe.createdByUserId === user.id),
  );
  const canDeleteRecipe = isOwnRecipe;
  const existingReview = localReviews.find((r) => r.user.id === user?.id);
  const canReview = !isOwnRecipe;
  const bookmarked = isBookmarked(recipe.id);

  const ingredientItems = recipe.ingredientsMeasured && recipe.ingredientsMeasured.length > 0
    ? recipe.ingredientsMeasured.map((item) => formatIngredientLine(item))
    : recipe.ingredients;

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <RemoteImage uri={recipe.image} style={styles.heroImage} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={styles.name}>{recipe.name}</Text>
              <Text style={styles.cuisine}>
                {recipe.cuisine} · {recipe.category}
              </Text>
              <Text style={styles.creator}>By {creatorLabel}</Text>
              {recipe.description ? (
                <Text style={styles.description}>{recipe.description}</Text>
              ) : null}
              {recipe.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <RecipeTagChips tags={recipe.tags} maxVisible={3} />
                </View>
              )}
              {recipe.flavorTags && recipe.flavorTags.length > 0 && (
                <View style={styles.tagsSection}>
                  <RecipeTagChips tags={recipe.flavorTags} size="sm" maxVisible={3} />
                </View>
              )}
            </View>
            <RatingBadge rating={score} size="lg" label="Encore" />
          </View>

          {/* Score summary */}
          {localReviews.length > 0 && (
            <View style={styles.scoreSummary}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>{score?.toFixed(1) ?? '—'}/5</Text>
                <Text style={styles.scoreLabel}>Encore Score</Text>
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>{yesPercent}%</Text>
                <Text style={styles.scoreLabel}>would make again</Text>
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreValue}>{avgDifficulty}/5</Text>
                <Text style={styles.scoreLabel}>
                  avg difficulty{'\n'}({localReviews.length})
                </Text>
              </View>
              {tasteScore !== null && (
                <>
                  <View style={styles.scoreDivider} />
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{tasteScore.toFixed(1)}/5</Text>
                    <Text style={styles.scoreLabel}>taste</Text>
                  </View>
                </>
              )}
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
              style={[styles.rateButton, !canReview && styles.rateButtonDisabled]}
              activeOpacity={0.8}
              onPress={() => {
                if (!canReview) {
                  Alert.alert('Own recipe', 'You cannot review a recipe you created.');
                  return;
                }
                setShowReviewModal(true);
              }}
              disabled={!canReview}
            >
              <Ionicons name="create-outline" size={18} color={Colors.white} />
              <Text style={styles.rateButtonText}>
                {!canReview ? 'Your Recipe' : existingReview ? 'Edit Review' : 'Write a Review'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, bookmarked && styles.actionButtonActive]}
              activeOpacity={0.7}
              onPress={() => toggleBookmark(recipe.id)}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? Colors.white : Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => Share.share({ message: `Check out "${recipe.name}" on Chef'd!` })}
            >
              <Ionicons name="share-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {canDeleteRecipe ? (
            <TouchableOpacity
              style={styles.deleteRecipeBtn}
              activeOpacity={0.75}
              onPress={() => {
                const run = async () => {
                  const ok = await deleteRecipe(recipe.id);
                  if (!ok) {
                    Alert.alert('Cannot delete', 'This recipe could not be removed.');
                    return;
                  }
                  removeRecipeFromBookmarks(recipe.id);
                  await removeRecipeFromFavorites(recipe.id);
                  router.replace('/(tabs)' as any);
                };
                if (Platform.OS === 'web') {
                  if (
                    typeof window !== 'undefined'
                    && window.confirm(
                      'Delete this recipe permanently? This cannot be undone.',
                    )
                  ) {
                    void run();
                  }
                  return;
                }
                Alert.alert(
                  'Delete recipe',
                  'This removes your recipe, its local reviews, and any bookmarks.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => void run() },
                  ],
                );
              }}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.heart} />
              <Text style={styles.deleteRecipeText}>Delete recipe</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'recipe' && styles.activeTab]}
              onPress={() => setActiveTab('recipe')}
            >
              <Text style={[styles.tabText, activeTab === 'recipe' && styles.activeTabText]}>
                Recipe
              </Text>
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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  <Text style={styles.checkHint}>Tap to check off</Text>
                </View>
                {ingredientItems.map((text, index) => {
                  const checked = checkedIngredients.has(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.ingredientRow}
                      onPress={() => toggleIngredient(index)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={checked ? Colors.primary : Colors.textTertiary}
                      />
                      <Text
                        style={[styles.ingredientText, checked && styles.ingredientChecked]}
                      >
                        {text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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

              {recipe.sourceUrl && (
                <TouchableOpacity
                  style={styles.sourceRow}
                  onPress={() => Linking.openURL(recipe.sourceUrl!)}
                >
                  <Ionicons name="link-outline" size={16} color={Colors.primary} />
                  <Text style={styles.sourceText}>
                    Adapted from {recipe.sourceName ?? recipe.sourceUrl}
                  </Text>
                </TouchableOpacity>
              )}
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
                localReviews.map((review) => {
                  const liked = isLiked(review.id, review.liked);
                  const likes = getLikeCount(review.id, review.likes);
                  return (
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
                      {review.tasteRating != null && review.tasteRating > 0 && (
                        <View style={styles.tasteRow}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.tasteText}>{review.tasteRating.toFixed(1)}/5 taste</Text>
                        </View>
                      )}
                      {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                      {review.flavorNotes && (
                        <Text style={styles.flavorNotes}>Flavor notes: {review.flavorNotes}</Text>
                      )}

                      <View style={styles.reviewSocial}>
                        <Text style={styles.reviewLikes}>
                          {likes} {likes === 1 ? 'like' : 'likes'}
                        </Text>
                        <SocialActions
                          likes={likes}
                          liked={liked}
                          comments={0}
                          onLike={() => toggleLike(review.id, review.likes, review.liked)}
                          onShare={() =>
                            Share.share({
                              message: `Check out ${review.user.name}'s review of "${recipe.name}" on Chef'd!`,
                            })
                          }
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ReviewModal
        visible={showReviewModal}
        recipeName={recipe.name}
        existingReview={existingReview}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async (data) => {
          if (isOwnRecipe) {
            Alert.alert('Own recipe', 'You cannot review a recipe you created.');
            return;
          }
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
            id: existingReview?.id ?? `rev-${Date.now()}`,
            user: reviewUser,
            recipeId: recipe.id,
            makeAgain: data.makeAgain,
            difficulty: data.difficulty as 1 | 2 | 3 | 4 | 5,
            tasteRating: data.tasteRating || undefined,
            flavorNotes: data.flavorNotes || undefined,
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
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width, height: width * 0.65, backgroundColor: '#E0E0E0' },
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
  titleText: { flex: 1, marginRight: Spacing.md },
  name: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  cuisine: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  creator: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 6, fontWeight: '600' },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  tagsSection: { marginTop: Spacing.md },
  scoreSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '0A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  scoreLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  scoreDivider: { width: 1, backgroundColor: Colors.primary + '20' },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginTop: 4 },
  metaLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  metaDivider: { width: 1, backgroundColor: Colors.border },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
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
  rateButtonDisabled: { opacity: 0.55 },
  rateButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deleteRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  deleteRecipeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.heart,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, color: Colors.textTertiary, fontWeight: '500' },
  activeTabText: { color: Colors.primary, fontWeight: '600' },
  section: { marginBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  checkHint: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic' },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  ingredientText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22, flex: 1 },
  ingredientChecked: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  stepRow: { flexDirection: 'row', marginBottom: Spacing.lg },
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
  stepNumberText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  stepText: { flex: 1, fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  sourceText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  reviewHeaderText: { flex: 1, marginLeft: Spacing.md },
  reviewUser: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  reviewTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
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
  tasteText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.ratingYellow },
  reviewComment: { fontSize: FontSize.md, color: Colors.text, lineHeight: 21, marginTop: Spacing.sm },
  flavorNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reviewSocial: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  reviewLikes: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { RatingBadge } from '@/components/RatingBadge';
import { recipes, feedRatings } from '@/constants/MockData';
import { Avatar } from '@/components/Avatar';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = recipes.find((r) => r.id === id);
  const relatedRatings = feedRatings.filter((r) => r.recipe.id === id);
  const [activeTab, setActiveTab] = useState<'recipe' | 'ratings'>('recipe');

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: recipe.image }} style={styles.heroImage} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <Text style={styles.name}>{recipe.name}</Text>
            <Text style={styles.cuisine}>{recipe.cuisine} · {recipe.category}</Text>
          </View>
          <RatingBadge rating={recipe.averageRating} size="lg" />
        </View>

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
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={18} color={Colors.primary} />
            <Text style={styles.metaValue}>{recipe.totalRatings}</Text>
            <Text style={styles.metaLabel}>Ratings</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rateButton} activeOpacity={0.8}>
            <Ionicons name="star" size={18} color={Colors.white} />
            <Text style={styles.rateButtonText}>Rate This Recipe</Text>
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
            style={[styles.tab, activeTab === 'ratings' && styles.activeTab]}
            onPress={() => setActiveTab('ratings')}
          >
            <Text style={[styles.tabText, activeTab === 'ratings' && styles.activeTabText]}>
              Ratings ({relatedRatings.length})
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
            {relatedRatings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No ratings yet from your friends</Text>
                <Text style={styles.emptySubtext}>Be the first to rate this recipe!</Text>
              </View>
            ) : (
              relatedRatings.map((rating) => (
                <View key={rating.id} style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <Avatar uri={rating.user.avatar} size={36} />
                    <View style={styles.ratingHeaderText}>
                      <Text style={styles.ratingUser}>{rating.user.name}</Text>
                      <Text style={styles.ratingTime}>{rating.timestamp}</Text>
                    </View>
                    <RatingBadge rating={rating.rating} size="sm" />
                  </View>
                  {rating.notes && <Text style={styles.ratingNotes}>{rating.notes}</Text>}
                  {rating.favoritePart && (
                    <Text style={styles.ratingFavorite}>
                      <Text style={styles.ratingLabel}>Favorite: </Text>
                      {rating.favoritePart}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  ratingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ratingHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  ratingUser: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  ratingNotes: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 21,
    marginTop: Spacing.sm,
  },
  ratingFavorite: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  ratingLabel: {
    fontWeight: '600',
  },
});

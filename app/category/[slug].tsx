import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { RecipeCard } from '@/components/RecipeCard';
import { useRecipes } from '@/contexts/RecipeContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { getTagConfig } from '@/constants/recipeTags';
import { computeScore } from '@/types';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { recipes, getReviewsForRecipe } = useRecipes();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const tag = decodeURIComponent(slug ?? '');
  const cfg = getTagConfig(tag);

  const filtered = useMemo(() => {
    const matching = recipes.filter((r) => r.tags.includes(tag));
    return matching.sort((a, b) => {
      const scoreA = computeScore(getReviewsForRecipe(a.id)) ?? 0;
      const scoreB = computeScore(getReviewsForRecipe(b.id)) ?? 0;
      return scoreB - scoreA;
    });
  }, [recipes, tag, getReviewsForRecipe]);

  return (
    <>
      <Stack.Screen options={{ headerTitle: tag }} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            {cfg && (
              <View style={[styles.iconCircle, { backgroundColor: cfg.color + '20' }]}>
                <Ionicons name={cfg.icon as any} size={28} color={cfg.color} />
              </View>
            )}
            <Text style={styles.title}>{tag}</Text>
            <Text style={styles.count}>{filtered.length} recipes</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <RecipeCard
            recipe={item}
            rank={index + 1}
            onPress={() => router.push(`/recipe/${item.id}`)}
            onBookmarkPress={() => toggleBookmark(item.id)}
            isBookmarked={isBookmarked(item.id)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No recipes in this category yet.</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={{ backgroundColor: Colors.background }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    fontFamily: Fonts.display,
    color: Colors.text,
  },
  count: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  list: { paddingBottom: Spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});

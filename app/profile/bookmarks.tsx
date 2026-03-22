import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Fonts } from '@/constants/Colors';
import { RecipeCard } from '@/components/RecipeCard';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { Recipe } from '@/types';

export default function ProfileBookmarksScreen() {
  const router = useRouter();
  const { bookmarkedIds, isBookmarked, toggleBookmark } = useBookmarks();
  const { getRecipeById } = useRecipes();

  const bookmarkedRecipes = useMemo(() => {
    const list: Recipe[] = [];
    for (const id of bookmarkedIds) {
      const r = getRecipeById(id);
      if (r) list.push(r);
    }
    return list;
  }, [bookmarkedIds, getRecipeById]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={bookmarkedRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            {`Saved from the recipe screen (${bookmarkedRecipes.length})`}
          </Text>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
            onBookmarkPress={() => toggleBookmark(item.id)}
            isBookmarked={isBookmarked(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No bookmarks yet</Text>
            <Text style={styles.emptyHint}>Open a recipe and tap the bookmark to save it here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appCanvas,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    lineHeight: 20,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { RecipeCard } from '@/components/RecipeCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import type { Recipe } from '@/types';

export default function MyPostedRecipesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { recipes } = useRecipes();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const myRecipes = useMemo(
    () =>
      [...recipes].filter((r): r is Recipe => Boolean(user?.id && r.createdByUserId === user.id)),
    [recipes, user?.id],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={myRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            {`Recipes you've posted (${myRecipes.length})`}
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
            <Ionicons name="restaurant-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No recipes yet</Text>
            <Text style={styles.emptyHint}>Use the + tab to create or import a recipe.</Text>
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

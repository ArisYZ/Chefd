import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Fonts } from '@/constants/Colors';
import { RecipeCard } from '@/components/RecipeCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { Recipe } from '@/types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { recipes, getRecipeById } = useRecipes();

  const favoriteRecipes = useMemo(() => {
    const ids = user?.favoriteRecipeIds ?? [];
    const list: Recipe[] = [];
    for (const id of ids) {
      const r = getRecipeById(id);
      if (r) list.push(r);
    }
    return list;
  }, [user?.favoriteRecipeIds, recipes, getRecipeById]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Saved recipes</Text>
      <Text style={styles.subtitle}>
        Favorites are stored on your account and included when you export data/accounts.json.
      </Text>
      {favoriteRecipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved recipes yet.</Text>
          <Text style={styles.emptyHint}>Open a recipe and tap the bookmark to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appCanvas,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    fontFamily: Fonts.display,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    lineHeight: 18,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  empty: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});

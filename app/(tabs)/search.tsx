import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { SearchBar } from '@/components/SearchBar';
import { FilterTabs } from '@/components/FilterTabs';
import { RecipeCard } from '@/components/RecipeCard';
import { cuisineFilters } from '@/constants/MockData';
import { useRecipes } from '@/contexts/RecipeContext';

const QUICK_ACTIONS = [
  { icon: 'flame-outline', label: 'Hot picks', color: Colors.primary },
  { icon: 'camera-outline', label: 'Snap a Dish', color: Colors.accent },
  { icon: 'bookmark-outline', label: 'Save Recipe', color: Colors.primaryLight },
  { icon: 'share-outline', label: 'Share List', color: Colors.ratingYellow },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { recipes } = useRecipes();
  const [searchText, setSearchText] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('All');

  useEffect(() => {
    // Clear search text when navigating away from this tab
    return () => {
      setSearchText('');
      setActiveCuisine('All');
    };
  }, []);

  useEffect(() => {
    const raw = params.q;
    const q = Array.isArray(raw) ? raw[0] : raw;
    if (typeof q === 'string') {
      setSearchText(q);
    }
  }, [params.q]);

  const filteredRecipes = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const name = (recipe.name ?? '').toLowerCase();
      const ing = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
      const matchesSearch =
        q === '' ||
        name.includes(q) ||
        (recipe.cuisine ?? '').toLowerCase().includes(q) ||
        (recipe.category ?? '').toLowerCase().includes(q) ||
        tags.some((t) => t.toLowerCase().includes(q)) ||
        ing.some((i) => i.toLowerCase().includes(q));
      const matchesCuisine = activeCuisine === 'All' || recipe.cuisine === activeCuisine;
      return matchesSearch && matchesCuisine;
    });
  }, [recipes, searchText, activeCuisine]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by recipe name…"
      />

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            activeOpacity={0.7}
            onPress={() => {}}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FilterTabs
        tabs={cuisineFilters.map((c) => ({ label: c }))}
        activeTab={activeCuisine}
        onTabPress={setActiveCuisine}
      />

      <Text style={styles.resultsCount}>{filteredRecipes.length} recipes</Text>

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  resultsCount: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
});

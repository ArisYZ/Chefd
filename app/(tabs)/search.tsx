import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { SearchBar } from '@/components/SearchBar';
import { FilterTabs } from '@/components/FilterTabs';
import { RecipeCard } from '@/components/RecipeCard';
import { recipes, cuisineFilters, categoryFilters } from '@/constants/MockData';

const QUICK_ACTIONS = [
  { icon: 'add-circle-outline', label: 'Rate a Recipe', color: Colors.primary },
  { icon: 'camera-outline', label: 'Snap a Dish', color: Colors.accent },
  { icon: 'bookmark-outline', label: 'Save Recipe', color: Colors.primaryLight },
  { icon: 'share-outline', label: 'Share List', color: Colors.ratingYellow },
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('All');

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = searchText === '' ||
      recipe.name.toLowerCase().includes(searchText.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchText.toLowerCase()) ||
      recipe.ingredients.some(i => i.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCuisine = activeCuisine === 'All' || recipe.cuisine === activeCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search recipes, cuisine, ingredients"
      />

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity key={action.label} style={styles.quickAction} activeOpacity={0.7}>
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

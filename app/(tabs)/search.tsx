import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { SearchBar } from '@/components/SearchBar';
import { FilterTabs } from '@/components/FilterTabs';
import { RecipeCard } from '@/components/RecipeCard';
import { SectionHeader } from '@/components/SectionHeader';
import { FeaturedListCard } from '@/components/FeaturedListCard';
import { cuisineFilters, featuredLists } from '@/constants/MockData';
import { RECIPE_TAG_OPTIONS } from '@/constants/recipeTags';
import { useRecipes } from '@/contexts/RecipeContext';
import { useBookmarks } from '@/contexts/BookmarkContext';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { recipes } = useRecipes();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [searchText, setSearchText] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'taste'>('default');

  useEffect(() => {
    return () => {
      setSearchText('');
      setActiveCuisine('All');
      setActiveCategories([]);
    };
  }, []);

  useEffect(() => {
    const raw = params.q;
    const q = Array.isArray(raw) ? raw[0] : raw;
    if (typeof q === 'string') setSearchText(q);
  }, [params.q]);

  const toggleCategory = (tag: string) => {
    setActiveCategories((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

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
      const matchesCategories =
        activeCategories.length === 0 ||
        activeCategories.every((cat) => tags.includes(cat));
      return matchesSearch && matchesCuisine && matchesCategories;
    });
  }, [recipes, searchText, activeCuisine, activeCategories]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity
          onPress={() => setSortBy((s) => (s === 'default' ? 'taste' : 'default'))}
          style={styles.sortBtn}
        >
          <Ionicons name="funnel-outline" size={18} color={Colors.primary} />
          <Text style={styles.sortText}>{sortBy === 'taste' ? 'By Taste' : 'Default'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersSection}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search by recipe, cuisine, ingredient..."
        />

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRowScroll}
          contentContainerStyle={styles.categoryRow}
        >
          {RECIPE_TAG_OPTIONS.map((tag, index) => {
            const active = activeCategories.includes(tag.label);
            return (
              <TouchableOpacity
                key={tag.label}
                style={[
                  styles.categoryChip,
                  index < RECIPE_TAG_OPTIONS.length - 1 && styles.categoryChipSpacing,
                  active && { backgroundColor: tag.color + '18', borderColor: tag.color },
                ]}
                onPress={() => toggleCategory(tag.label)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tag.icon as any}
                  size={14}
                  color={active ? tag.color : Colors.textTertiary}
                  style={styles.categoryChipIcon}
                />
                <Text
                  style={[styles.categoryChipText, active && { color: tag.color }]}
                  numberOfLines={1}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeCategories.length > 0 && (
          <TouchableOpacity
            style={styles.clearFilters}
            onPress={() => setActiveCategories([])}
          >
            <Ionicons name="close-circle" size={14} color={Colors.primary} />
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}

        <FilterTabs
          tabs={cuisineFilters.map((c) => ({ label: c }))}
          activeTab={activeCuisine}
          onTabPress={setActiveCuisine}
        />
      </View>

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        style={styles.recipeList}
        nestedScrollEnabled
        ListHeaderComponent={
          <View>
            <SectionHeader title="Featured Lists" onAction={() => router.push('/saved')} />

            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.featuredRowScroll}
              contentContainerStyle={styles.featuredContainer}
              keyboardShouldPersistTaps="handled"
            >
              {featuredLists.map((list) => (
                <FeaturedListCard
                  key={list.id}
                  list={list}
                  onPress={() => router.push(`/list/${list.id}`)}
                />
              ))}
            </ScrollView>

            <Text style={styles.resultsCount}>{filteredRecipes.length} recipes</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
            onBookmarkPress={() => toggleBookmark(item.id)}
            isBookmarked={isBookmarked(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  /** Keeps filter rows from growing when the screen reflows (RN Web flex + horizontal ScrollView). */
  filtersSection: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  filterRowScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  featuredRowScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  featuredContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  recipeList: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', fontFamily: Fonts.display, color: Colors.text },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '12',
  },
  sortText: { fontSize: FontSize.xs, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  categoryChipSpacing: {
    marginRight: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipIcon: {
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: FontSize.xs,
    lineHeight: Math.round(FontSize.xs * 1.35),
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textSecondary,
  },
  clearFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  clearFiltersText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
  },
  resultsCount: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  listContent: { paddingBottom: Spacing.xxl },
});

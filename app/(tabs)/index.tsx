import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { SearchBar } from '@/components/SearchBar';
import { FilterTabs } from '@/components/FilterTabs';
import { SectionHeader } from '@/components/SectionHeader';
import { FeaturedListCard } from '@/components/FeaturedListCard';
import { FeedCard } from '@/components/FeedCard';
import { feedRatings, featuredLists } from '@/constants/MockData';
import { RECIPE_TAG_OPTIONS } from '@/constants/recipeTags';
import { useBookmarks } from '@/contexts/BookmarkContext';

const FILTER_TABS = [
  { label: 'Trending', icon: 'trending-up' },
  { label: 'Friend picks', icon: 'people' },
  { label: 'Quick meals', icon: 'flash' },
  { label: 'New', icon: 'sparkles' },
];

export default function FeedScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Trending');
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <Text style={styles.logo}>chef'd</Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => router.push('/saved')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="menu-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        onFocus={() => router.navigate('/search')}
        placeholder="Search recipes, cuisine, ingredients"
      />

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {RECIPE_TAG_OPTIONS.map((tag) => (
          <TouchableOpacity
            key={tag.label}
            style={styles.categoryChip}
            onPress={() => router.push(`/category/${encodeURIComponent(tag.label)}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryIcon, { backgroundColor: tag.color + '18' }]}>
              <Ionicons name={tag.icon as any} size={16} color={tag.color} />
            </View>
            <Text style={styles.categoryLabel}>{tag.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FilterTabs
        tabs={FILTER_TABS}
        activeTab={activeFilter}
        onTabPress={setActiveFilter}
      />

      <SectionHeader title="Featured Lists" onAction={() => router.push('/saved')} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredContainer}
      >
        {featuredLists.map((list) => (
          <FeaturedListCard
            key={list.id}
            list={list}
            onPress={() => router.push(`/list/${list.id}`)}
          />
        ))}
      </ScrollView>

      <SectionHeader title="Your Feed" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={feedRatings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <FeedCard
            rating={item}
            onPress={() => router.push(`/recipe/${item.recipe.id}`)}
            onBookmarkPress={() => toggleBookmark(item.recipe.id)}
            isBookmarked={isBookmarked(item.recipe.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logo: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: { padding: Spacing.xs, position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  categoryRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryChip: {
    alignItems: 'center',
    width: 72,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featuredContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});

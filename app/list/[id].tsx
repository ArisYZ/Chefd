import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { RecipeCard } from '@/components/RecipeCard';
import { Avatar } from '@/components/Avatar';
import { RemoteImage } from '@/components/RemoteImage';
import { featuredLists, userLists } from '@/constants/MockData';
import { useBookmarks } from '@/contexts/BookmarkContext';

const { width } = Dimensions.get('window');
const allLists = [...featuredLists, ...userLists];

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const list = allLists.find((l) => l.id === id);

  if (!list) {
    return (
      <View style={styles.center}>
        <Text>List not found</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <RemoteImage uri={list.image} style={styles.heroImage} />
      <View style={styles.headerContent}>
        <Text style={styles.title}>{list.title}</Text>
        <Text style={styles.description}>{list.description}</Text>

        <View style={styles.authorRow}>
          <Avatar uri={list.createdBy.avatar} size={28} />
          <Text style={styles.authorName}>by {list.createdBy.name}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="restaurant-outline" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{list.recipes.length} recipes</Text>
          </View>
          {list.userProgress && (
            <View style={styles.stat}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.statText}>
                {list.userProgress.tried}/{list.userProgress.total} made
              </Text>
            </View>
          )}
        </View>

        {list.userProgress && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(list.userProgress.tried / list.userProgress.total) * 100}%` },
              ]}
            />
          </View>
        )}

        <Text style={styles.recipesTitle}>Recipes</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={list.recipes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      renderItem={({ item, index }) => (
        <RecipeCard
          recipe={item}
          rank={index + 1}
          onPress={() => router.push(`/recipe/${item.id}`)}
          onBookmarkPress={() => toggleBookmark(item.id)}
          isBookmarked={isBookmarked(item.id)}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appCanvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width,
    height: width * 0.5,
    backgroundColor: '#E0E0E0',
  },
  headerContent: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    fontFamily: Fonts.display,
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  authorName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: Fonts.bodyMedium,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  recipesTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
});

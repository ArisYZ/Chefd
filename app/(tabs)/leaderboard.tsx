import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { FilterTabs } from '@/components/FilterTabs';
import { RatingBadge } from '@/components/RatingBadge';
import { buildLeaderboard, cuisineFilters } from '@/constants/MockData';
import { LeaderboardEntry } from '@/types';
import { useRecipes } from '@/contexts/RecipeContext';

function TopThreeCard({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const heights = [140, 160, 130];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <View style={[styles.podiumItem, { height: heights[position] }]}>
      <Image source={{ uri: entry.recipe.image }} style={styles.podiumImage} />
      <View style={styles.podiumOverlay} />
      <View style={styles.podiumContent}>
        <Text style={styles.podiumMedal}>{medals[position]}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{entry.recipe.name}</Text>
        <Text style={styles.podiumRating}>{entry.averageRating.toFixed(1)}</Text>
      </View>
    </View>
  );
}

function LeaderboardRow({ entry, onPress }: { entry: LeaderboardEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rankText}>{entry.rank}</Text>
      <Image source={{ uri: entry.recipe.image }} style={styles.rowImage} />
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{entry.recipe.name}</Text>
        <Text style={styles.rowMeta}>
          {entry.cuisine} · {entry.totalRatings} ratings
        </Text>
      </View>
      <RatingBadge rating={entry.averageRating} size="sm" />
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { recipes } = useRecipes();
  const [activeCuisine, setActiveCuisine] = useState('All');

  const leaderboardData = useMemo(() => buildLeaderboard(recipes), [recipes]);

  const filtered = activeCuisine === 'All'
    ? leaderboardData
    : leaderboardData.filter((e) => e.cuisine === activeCuisine);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="options-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FilterTabs
        tabs={cuisineFilters.map((c) => ({ label: c }))}
        activeTab={activeCuisine}
        onTabPress={setActiveCuisine}
      />

      <FlatList
        data={rest}
        keyExtractor={(item) => item.recipe.id}
        ListHeaderComponent={() => (
          <View style={styles.podiumRow}>
            {podiumOrder.map((entry, i) => (
              <TopThreeCard key={entry.recipe.id} entry={entry} position={i} />
            ))}
          </View>
        )}
        renderItem={({ item }) => (
          <LeaderboardRow
            entry={item}
            onPress={() => router.push(`/recipe/${item.recipe.id}`)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  podiumItem: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  podiumImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  podiumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  podiumContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  podiumMedal: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  podiumRating: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rankText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textTertiary,
    width: 30,
    textAlign: 'center',
  },
  rowImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    backgroundColor: '#E0E0E0',
  },
  rowContent: {
    flex: 1,
  },
  rowName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  rowMeta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

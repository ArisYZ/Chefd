import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { FilterTabs } from '@/components/FilterTabs';
import { RatingBadge } from '@/components/RatingBadge';
import { Avatar } from '@/components/Avatar';
import { buildLeaderboard, cuisineFilters } from '@/constants/MockData';
import { LeaderboardEntry } from '@/types';
import type { StoredUser } from '@/types/auth';
import { useRecipes } from '@/contexts/RecipeContext';
import { listUsersByRank } from '@/database/db';

type LeaderMode = 'recipes' | 'cooks';

function TopThreeCard({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const heights = [140, 160, 130];
  const medals = ['🥈', '🥇', '🥉'];
  const score = entry.totalRatings === 0 ? null : entry.averageRating;

  return (
    <View style={[styles.podiumItem, { height: heights[position] }]}>
      <Image source={{ uri: entry.recipe.image }} style={styles.podiumImage} />
      <View style={styles.podiumOverlay} />
      <View style={styles.podiumContent}>
        <Text style={styles.podiumMedal}>{medals[position]}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{entry.recipe.name}</Text>
        <Text style={styles.podiumRating}>{score == null ? '—' : score.toFixed(1)}</Text>
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
      <RatingBadge rating={entry.totalRatings === 0 ? null : entry.averageRating} size="sm" />
    </TouchableOpacity>
  );
}

function CookTopCard({ user: u, position }: { user: StoredUser; position: number }) {
  const heights = [130, 150, 120];
  const medals = ['🥈', '🥇', '🥉'];
  const uri = u.avatarUri || 'https://i.pravatar.cc/150?img=3';

  return (
    <View style={[styles.cookPodiumItem, { height: heights[position] }]}>
      <Image source={{ uri }} style={styles.podiumImage} />
      <View style={styles.podiumOverlay} />
      <View style={styles.podiumContent}>
        <Text style={styles.podiumMedal}>{medals[position]}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>@{u.username}</Text>
        <Text style={styles.podiumRating}>{u.rankingScore} pts</Text>
      </View>
    </View>
  );
}

function CookRow({ user: u }: { user: StoredUser }) {
  const uri = u.avatarUri || 'https://i.pravatar.cc/150?img=3';
  return (
    <View style={styles.row}>
      <Text style={styles.rankText}>{u.leaderboardRank}</Text>
      <View style={styles.avatarWrap}>
        <Avatar uri={uri} size={50} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>@{u.username}</Text>
        <Text style={styles.rowMeta}>
          {u.recipeCount} recipes · {u.reviewCount} reviews · avg {u.reviewCount > 0 ? u.averageRating.toFixed(1) : '—'}
        </Text>
      </View>
      <Text style={styles.cookScore}>{u.rankingScore}</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { recipes } = useRecipes();
  const [mode, setMode] = useState<LeaderMode>('recipes');
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [cooks, setCooks] = useState<StoredUser[]>([]);

  const leaderboardData = useMemo(() => buildLeaderboard(recipes), [recipes]);

  const filtered = activeCuisine === 'All'
    ? leaderboardData
    : leaderboardData.filter((e) => e.cuisine === activeCuisine);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  const loadCooks = useCallback(async () => {
    const list = await listUsersByRank(100);
    setCooks(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCooks();
    }, [loadCooks]),
  );

  const cookTopThree = cooks.slice(0, 3);
  const cookPodium =
    cookTopThree.length >= 3
      ? [cookTopThree[1], cookTopThree[0], cookTopThree[2]]
      : cookTopThree;
  const cookRest = cooks.slice(3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="options-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'recipes' && styles.modeBtnActive]}
          onPress={() => setMode('recipes')}
        >
          <Text style={[styles.modeBtnText, mode === 'recipes' && styles.modeBtnTextActive]}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'cooks' && styles.modeBtnActive]}
          onPress={() => setMode('cooks')}
        >
          <Text style={[styles.modeBtnText, mode === 'cooks' && styles.modeBtnTextActive]}>Cooks</Text>
        </TouchableOpacity>
      </View>

      {mode === 'recipes' ? (
        <>
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
        </>
      ) : (
        <FlatList
          data={cookRest}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View style={styles.podiumRow}>
              {cookPodium.map((u, i) => (
                <CookTopCard key={u.id} user={u} position={i} />
              ))}
              {cooks.length === 0 && (
                <Text style={styles.emptyCooks}>No cooks yet — sign up and leave reviews!</Text>
              )}
            </View>
          )}
          renderItem={({ item }) => <CookRow user={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  modeBtnActive: {
    backgroundColor: Colors.white,
  },
  modeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  modeBtnTextActive: {
    color: Colors.primary,
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
  cookPodiumItem: {
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
  avatarWrap: {
    marginHorizontal: Spacing.md,
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
  cookScore: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  emptyCooks: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingVertical: Spacing.xl,
    fontSize: FontSize.sm,
  },
});

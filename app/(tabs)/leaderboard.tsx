import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { FilterTabs } from '@/components/FilterTabs';
import { RatingBadge } from '@/components/RatingBadge';
import { Avatar } from '@/components/Avatar';
import { RemoteImage } from '@/components/RemoteImage';
import { defaultAvatarSource } from '@/constants/avatarAsset';
import { normalizeRemoteImageUri } from '@/lib/imageUri';
import { buildLeaderboard, cuisineFilters } from '@/constants/MockData';
import { LeaderboardEntry } from '@/types';
import type { StoredUser } from '@/types/auth';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';
import { listUsersByRank } from '@/database/db';
import { buildCookLeaderboardRows, type CookLeaderboardRow } from '@/lib/cookStats';
import { formatOutOf5 } from '@/lib/formatScore';

type LeaderMode = 'recipes' | 'cooks';
type TimeRange = 'all-time' | 'weekly';
type SortOption = 'score' | 'most-rated' | 'trending';

const RANK_BADGES = ['', '🥇', '🥈', '🥉'];

function TopThreeCard({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const heights = [140, 160, 130];
  const displayPositions = [2, 1, 3];
  const score = entry.totalRatings === 0 ? null : entry.averageRating;
  const creatorLabel =
    entry.recipe.createdByName ?? (entry.recipe.createdByUserId ? `@${entry.recipe.createdByUserId}` : 'Unknown cook');

  return (
    <View style={[styles.podiumItem, { height: heights[position] }]}>
      <RemoteImage uri={entry.recipe.image} style={styles.podiumImage} />
      <View style={styles.podiumOverlay} />
      <View style={styles.podiumContent}>
        <Text style={styles.podiumMedal}>{RANK_BADGES[displayPositions[position]]}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{entry.recipe.name}</Text>
        <Text style={styles.podiumCreator} numberOfLines={1}>By {creatorLabel}</Text>
        <Text style={styles.podiumRating}>{score == null ? '—' : score.toFixed(1)}</Text>
      </View>
    </View>
  );
}

function LeaderboardRow({ entry, onPress }: { entry: LeaderboardEntry; onPress: () => void }) {
  const creatorLabel =
    entry.recipe.createdByName ?? (entry.recipe.createdByUserId ? `@${entry.recipe.createdByUserId}` : 'Unknown cook');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rankText}>{entry.rank}</Text>
      <RemoteImage uri={entry.recipe.image} style={styles.rowImage} />
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{entry.recipe.name}</Text>
        <Text style={styles.rowMeta}>
          {entry.cuisine} · {entry.totalRatings} ratings · By {creatorLabel}
        </Text>
      </View>
      <RatingBadge rating={entry.totalRatings === 0 ? null : entry.averageRating} size="sm" />
    </TouchableOpacity>
  );
}

function CookTopCard({ row, position, onPress }: { row: CookLeaderboardRow; position: number; onPress: () => void }) {
  const heights = [130, 150, 120];
  const displayPositions = [2, 1, 3];
  const u = row.user;
  const cookAvatarUri = normalizeRemoteImageUri(u.avatarUri);

  return (
    <TouchableOpacity style={[styles.cookPodiumItem, { height: heights[position] }]} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={cookAvatarUri ? { uri: cookAvatarUri } : defaultAvatarSource}
        style={styles.podiumImage}
      />
      <View style={styles.podiumOverlay} />
      <View style={styles.podiumContent}>
        <Text style={styles.podiumMedal}>{RANK_BADGES[displayPositions[position]]}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>@{u.username}</Text>
        <Text style={styles.podiumRating}>{row.cookScore} pts</Text>
      </View>
    </TouchableOpacity>
  );
}

function CookRow({ row, onPress }: { row: CookLeaderboardRow; onPress: () => void }) {
  const u = row.user;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rankText}>{row.rank}</Text>
      <View style={styles.avatarWrap}>
        <Avatar uri={u.avatarUri} size={50} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>@{u.username}</Text>
        <Text style={styles.rowMeta}>
          {row.recipeCount} recipes · {row.dishRatingsReceived} ratings on dishes · {formatOutOf5(row.dishEncoreWeighted)} dish
        </Text>
        <Text style={styles.rowMetaSecondary}>
          {row.reviewsWritten} reviews written · {formatOutOf5(row.reviewerEncoreAvg)} reviewer
        </Text>
      </View>
      <Text style={styles.cookScore}>{row.cookScore}</Text>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { recipes, getReviewsForRecipe } = useRecipes();
  const [mode, setMode] = useState<LeaderMode>('recipes');
  const [timeRange, setTimeRange] = useState<TimeRange>('all-time');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [cooks, setCooks] = useState<StoredUser[]>([]);

  const leaderboardData = useMemo(() => {
    const data = buildLeaderboard(recipes);
    if (sortBy === 'most-rated') {
      return [...data].sort((a, b) => b.totalRatings - a.totalRatings).map((e, i) => ({ ...e, rank: i + 1 }));
    }
    return data;
  }, [recipes, sortBy]);

  const filtered = activeCuisine === 'All'
    ? leaderboardData
    : leaderboardData.filter((e) => e.cuisine === activeCuisine);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;

  const userRank = useMemo(() => {
    if (!user) return null;
    const entry = filtered.find((e) => e.recipe.createdByUserId === user.id);
    return entry ? entry.rank : null;
  }, [filtered, user]);

  const loadCooks = useCallback(async () => {
    const list = await listUsersByRank(200);
    setCooks(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCooks();
    }, [loadCooks]),
  );

  const cookRows = useMemo(
    () => (cooks.length === 0 ? [] : buildCookLeaderboardRows(recipes, getReviewsForRecipe, cooks)),
    [recipes, getReviewsForRecipe, cooks],
  );

  const cookTopThree = cookRows.slice(0, 3);
  const cookPodium =
    cookTopThree.length >= 3
      ? [cookTopThree[1], cookTopThree[0], cookTopThree[2]]
      : cookTopThree;
  const cookRest = cookRows.slice(3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
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

      {mode === 'recipes' && (
        <>
          <View style={styles.filterCard}>
            <View style={styles.filterSegmentsRow}>
              <TouchableOpacity
                style={[styles.filterSegment, timeRange === 'all-time' && styles.filterSegmentActive]}
                onPress={() => setTimeRange('all-time')}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.filterSegmentText, timeRange === 'all-time' && styles.filterSegmentTextActive]}
                  numberOfLines={1}
                >
                  All-Time
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterSegment, timeRange === 'weekly' && styles.filterSegmentActive]}
                onPress={() => setTimeRange('weekly')}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.filterSegmentText, timeRange === 'weekly' && styles.filterSegmentTextActive]}
                  numberOfLines={1}
                >
                  This Week
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterCardDivider} />
            <View style={styles.filterSegmentsRow}>
              {(['score', 'most-rated'] as SortOption[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterSegment, sortBy === opt && styles.filterSegmentActive]}
                  onPress={() => setSortBy(opt)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.filterSegmentText, sortBy === opt && styles.filterSegmentTextActive]}
                    numberOfLines={1}
                  >
                    {opt === 'score' ? 'Encore Score' : 'Most Rated'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {userRank && (
            <View style={styles.personalRank}>
              <Ionicons name="trophy-outline" size={16} color={Colors.primary} />
              <Text style={styles.personalRankText}>Your recipe is ranked #{userRank}</Text>
            </View>
          )}
        </>
      )}

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
                  <TouchableOpacity
                    key={entry.recipe.id}
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/recipe/${entry.recipe.id}`)}
                    activeOpacity={0.8}
                  >
                    <TopThreeCard entry={entry} position={i} />
                  </TouchableOpacity>
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
          keyExtractor={(item) => item.user.id}
          ListHeaderComponent={() => (
            <View style={styles.podiumRow}>
              {cookPodium.map((row, i) => (
                <CookTopCard key={row.user.id} row={row} position={i} onPress={() => router.push(`/user/${row.user.id}`)} />
              ))}
              {cookRows.length === 0 && (
                <Text style={styles.emptyCooks}>No cooks yet — sign up and leave reviews!</Text>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <CookRow row={item} onPress={() => router.push(`/user/${item.user.id}`)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
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
  modeBtnActive: { backgroundColor: Colors.white },
  modeBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textTertiary },
  modeBtnTextActive: { color: Colors.primary },
  /** Full-width rounded card: time range + sort, aligned with mode row. */
  filterCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
  },
  filterSegmentsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  filterCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 4,
    marginHorizontal: 2,
  },
  filterSegment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    minHeight: 40,
  },
  filterSegmentActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  filterSegmentText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  filterSegmentTextActive: {
    color: Colors.primary,
  },
  personalRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '0A',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  personalRankText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  podiumItem: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  cookPodiumItem: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  podiumImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  podiumOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  podiumContent: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: Spacing.sm },
  podiumMedal: { fontSize: 24, marginBottom: 4 },
  podiumName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white, textAlign: 'center' },
  podiumRating: { fontSize: FontSize.md, fontWeight: '800', color: Colors.white, marginTop: 2 },
  podiumCreator: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.white, opacity: 0.95, marginTop: 2 },
  listContent: { paddingBottom: Spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rankText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textTertiary, width: 30, textAlign: 'center' },
  avatarWrap: { marginHorizontal: Spacing.md },
  rowImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    backgroundColor: '#E0E0E0',
  },
  rowContent: { flex: 1 },
  rowName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  rowMeta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  rowMetaSecondary: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 3, opacity: 0.9 },
  cookScore: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary, minWidth: 36, textAlign: 'right' },
  emptyCooks: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingVertical: Spacing.xl,
    fontSize: FontSize.sm,
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { TabScreenHeader } from '@/components/TabScreenHeader';
import { FilterTabs } from '@/components/FilterTabs';
import { RatingBadge } from '@/components/RatingBadge';
import { Avatar } from '@/components/Avatar';
import { RemoteImage } from '@/components/RemoteImage';
import { defaultAvatarSource } from '@/constants/avatarAsset';
import { normalizeRemoteImageUri } from '@/lib/imageUri';
import { cuisineFilters } from '@/constants/MockData';
import { buildRecipeLeaderboardEntries } from '@/lib/leaderboardRecipeData';
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

const RECIPE_PAGE_COUNT = 4;
const SEGMENT_SPRING = { damping: 22, stiffness: 260, mass: 0.85 };

const RANK_BADGES = ['', '🥇', '🥈', '🥉'];

function stateFromRecipePage(i: number): { timeRange: TimeRange; sortBy: Exclude<SortOption, 'trending'> } {
  return {
    timeRange: i >= 2 ? 'weekly' : 'all-time',
    sortBy: i % 2 === 1 ? 'most-rated' : 'score',
  };
}

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

type RecipeRouter = ReturnType<typeof useRouter>;

function RecipesLeaderboardPage({
  entries,
  router,
}: {
  entries: LeaderboardEntry[];
  router: RecipeRouter;
}) {
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder =
    topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

  return (
    <FlatList
      style={styles.recipePageList}
      data={rest}
      keyExtractor={(item) => item.recipe.id}
      nestedScrollEnabled
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
        <LeaderboardRow entry={item} onPress={() => router.push(`/recipe/${item.recipe.id}`)} />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { recipes, getReviewsForRecipe } = useRecipes();
  const [mode, setMode] = useState<LeaderMode>('recipes');
  const [recipePageIdx, setRecipePageIdx] = useState(0);
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [cooks, setCooks] = useState<StoredUser[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const recipePagerRef = useRef<ScrollView>(null);
  const recipePageIdxRef = useRef(recipePageIdx);
  recipePageIdxRef.current = recipePageIdx;

  const segmentRowWidth = useSharedValue(0);
  const timeTab = useSharedValue(0);
  const sortTab = useSharedValue(0);

  useEffect(() => {
    timeTab.value = withSpring(recipePageIdx < 2 ? 0 : 1, SEGMENT_SPRING);
    sortTab.value = withSpring(recipePageIdx % 2, SEGMENT_SPRING);
  }, [recipePageIdx]);

  const timePillStyle = useAnimatedStyle(() => {
    const w = segmentRowWidth.value / 2;
    return {
      width: w,
      transform: [{ translateX: timeTab.value * w }],
    };
  });

  const sortPillStyle = useAnimatedStyle(() => {
    const w = segmentRowWidth.value / 2;
    return {
      width: w,
      transform: [{ translateX: sortTab.value * w }],
    };
  });

  useEffect(() => {
    recipePagerRef.current?.scrollTo({
      x: recipePageIdxRef.current * windowWidth,
      animated: false,
    });
  }, [windowWidth]);

  const baseRecipePages = useMemo(() => {
    return [0, 1, 2, 3].map((i) => {
      const { timeRange: tr, sortBy: sb } = stateFromRecipePage(i);
      return buildRecipeLeaderboardEntries(recipes, getReviewsForRecipe, tr, sb);
    });
  }, [recipes, getReviewsForRecipe]);

  const filteredRecipePages = useMemo(
    () =>
      baseRecipePages.map((data) =>
        activeCuisine === 'All' ? data : data.filter((e) => e.cuisine === activeCuisine),
      ),
    [baseRecipePages, activeCuisine],
  );

  const userRank = useMemo(() => {
    if (!user) return null;
    const filtered = filteredRecipePages[recipePageIdx];
    const entry = filtered.find((e) => e.recipe.createdByUserId === user.id);
    return entry ? entry.rank : null;
  }, [filteredRecipePages, recipePageIdx, user]);

  const goRecipeTime = useCallback(
    (tr: TimeRange) => {
      const sortIdx = recipePageIdx % 2;
      const next = tr === 'all-time' ? sortIdx : 2 + sortIdx;
      if (next === recipePageIdx) return;
      setRecipePageIdx(next);
      recipePagerRef.current?.scrollTo({ x: next * windowWidth, animated: true });
    },
    [recipePageIdx, windowWidth],
  );

  const goRecipeSort = useCallback(
    (sb: Exclude<SortOption, 'trending'>) => {
      const timeOff = recipePageIdx < 2 ? 0 : 2;
      const sortIdx = sb === 'most-rated' ? 1 : 0;
      const next = timeOff + sortIdx;
      if (next === recipePageIdx) return;
      setRecipePageIdx(next);
      recipePagerRef.current?.scrollTo({ x: next * windowWidth, animated: true });
    },
    [recipePageIdx, windowWidth],
  );

  const onRecipePagerMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = Math.max(1, windowWidth);
      const x = e.nativeEvent.contentOffset.x;
      const page = Math.round(x / w);
      const clamped = Math.max(0, Math.min(RECIPE_PAGE_COUNT - 1, page));
      if (clamped === recipePageIdxRef.current) return;
      setRecipePageIdx(clamped);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [windowWidth],
  );

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
    <>
    <SafeAreaView style={styles.container} edges={['top']}>
      <TabScreenHeader
        title="Leaderboard"
        right={
          <TouchableOpacity
            onPress={() => setInfoOpen(true)}
            style={styles.infoBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="How points are calculated"
          >
            <Ionicons name="information-circle-outline" size={26} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
      />

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
        <View style={styles.recipesSection}>
          <View style={styles.filterCard}>
            <View
              style={styles.filterSegmentsRow}
              onLayout={(e) => {
                segmentRowWidth.value = e.nativeEvent.layout.width;
              }}
            >
              <Animated.View style={[styles.filterPill, timePillStyle]} />
              <View style={styles.filterSegmentsOverlay} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.filterSegmentBare}
                  onPress={() => goRecipeTime('all-time')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.filterSegmentText, recipePageIdx < 2 && styles.filterSegmentTextActive]}
                    numberOfLines={1}
                  >
                    All-Time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterSegmentBare}
                  onPress={() => goRecipeTime('weekly')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.filterSegmentText, recipePageIdx >= 2 && styles.filterSegmentTextActive]}
                    numberOfLines={1}
                  >
                    This Week
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.filterCardDivider} />
            <View
              style={styles.filterSegmentsRow}
              onLayout={(e) => {
                segmentRowWidth.value = e.nativeEvent.layout.width;
              }}
            >
              <Animated.View style={[styles.filterPill, sortPillStyle]} />
              <View style={styles.filterSegmentsOverlay} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.filterSegmentBare}
                  onPress={() => goRecipeSort('score')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.filterSegmentText, recipePageIdx % 2 === 0 && styles.filterSegmentTextActive]}
                    numberOfLines={1}
                  >
                    Encore Score
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterSegmentBare}
                  onPress={() => goRecipeSort('most-rated')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.filterSegmentText, recipePageIdx % 2 === 1 && styles.filterSegmentTextActive]}
                    numberOfLines={1}
                  >
                    Most Rated
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {userRank ? (
            <View style={styles.personalRank}>
              <Ionicons name="trophy-outline" size={16} color={Colors.primary} />
              <Text style={styles.personalRankText}>Your recipe is ranked #{userRank}</Text>
            </View>
          ) : null}

          <FilterTabs
            tabs={cuisineFilters.map((c) => ({ label: c }))}
            activeTab={activeCuisine}
            onTabPress={setActiveCuisine}
          />

          <ScrollView
            ref={recipePagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            style={styles.recipePager}
            contentContainerStyle={styles.recipePagerContent}
            onMomentumScrollEnd={onRecipePagerMomentumEnd}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filteredRecipePages.map((pageEntries, idx) => (
              <View key={idx} style={[styles.recipePage, { width: windowWidth }]}>
                <RecipesLeaderboardPage entries={pageEntries} router={router} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <FlatList
          style={styles.cooksList}
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

    <Modal
      visible={infoOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setInfoOpen(false)}
    >
      <Pressable style={styles.infoBackdrop} onPress={() => setInfoOpen(false)}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How points work</Text>
          <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.infoSectionHeading}>Recipes</Text>
            <Text style={styles.infoBody}>
              Dishes are ordered by average Encore score (1–5) from ratings in that view—higher averages rank higher.{' '}
              <Text style={styles.infoEm}>This Week</Text> uses reviews from roughly the last seven days (including relative times like “2d ago”). Use{' '}
              <Text style={styles.infoEm}>Most Rated</Text> to sort by how many ratings each dish has in that window. The cuisine tabs filter the list. Swipe the list sideways or use the segments to move between combinations.
            </Text>
            <Text style={styles.infoSectionHeading}>Cooks</Text>
            <Text style={styles.infoBody}>
              Points combine how many recipes you’ve published, the weighted average Encore (1–5) across ratings on your dishes, and total ratings received. When your dishes have at least one rating, the score is: round(Encore × recipe count × 25 × ln(1 + total ratings on your dishes)). If you have recipes but no ratings yet, a smaller interim score applies until people rate your dishes. Equal scores are ranked by account age (earlier sign-up wins).
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.infoCloseBtn}
            onPress={() => setInfoOpen(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.infoCloseBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appCanvas },
  infoBtn: { padding: Spacing.xs },
  infoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  infoCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  infoTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoScroll: { maxHeight: 320 },
  infoSectionHeading: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoBody: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  infoEm: { fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.text },
  infoCloseBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  infoCloseBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
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
  modeBtnActive: { backgroundColor: Colors.white },
  modeBtnText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.textTertiary },
  modeBtnTextActive: { color: Colors.primary },
  recipesSection: { flex: 1 },
  recipePager: { flex: 1 },
  recipePagerContent: { flexGrow: 1 },
  recipePage: { flex: 1 },
  recipePageList: { flex: 1 },
  cooksList: { flex: 1 },
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 40,
  },
  filterPill: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  filterSegmentsOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  filterSegmentBare: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
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
    fontFamily: Fonts.bodySemiBold,
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
  personalRankText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
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
  podiumName: { fontSize: FontSize.sm, fontWeight: '700', fontFamily: Fonts.bodyBold, color: Colors.white, textAlign: 'center' },
  podiumRating: { fontSize: FontSize.md, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.white, marginTop: 2 },
  podiumCreator: { fontSize: FontSize.xs, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.white, opacity: 0.95, marginTop: 2 },
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
  rankText: { fontSize: FontSize.lg, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.textTertiary, width: 30, textAlign: 'center' },
  avatarWrap: { marginHorizontal: Spacing.md },
  rowImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    backgroundColor: '#E0E0E0',
  },
  rowContent: { flex: 1 },
  rowName: { fontSize: FontSize.md, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.text },
  rowMeta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  rowMetaSecondary: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 3, opacity: 0.9 },
  cookScore: { fontSize: FontSize.md, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.primary, minWidth: 36, textAlign: 'right' },
  emptyCooks: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingVertical: Spacing.xl,
    fontSize: FontSize.sm,
  },
});

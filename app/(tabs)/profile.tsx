import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  DevSettings,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { exportAccountsJsonForRepo } from '@/database/db';
import { getGithubDataSyncConfig, pullDataJsonFilesFromGithub, pushDataJsonFilesToGithub } from '@/lib/githubDataSync';
import { clearChefdAsyncStorage } from '@/lib/clearAppStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { RemoteImage } from '@/components/RemoteImage';
import { RecipeCard } from '@/components/RecipeCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useFollow } from '@/contexts/FollowContext';
import { RecipeList } from '@/types';

function ListCard({ list, onPress }: { list: RecipeList; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.8}>
      <RemoteImage uri={list.image} style={styles.listImage} />
      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{list.title}</Text>
        <Text style={styles.listDescription} numberOfLines={1}>{list.description}</Text>
        <Text style={styles.listCount}>{list.recipes.length} recipes</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser, updateProfile } = useAuth();
  const { recipes, exportMergedRecipesJson, applyPulledDataJson } = useRecipes();
  const { bookmarkedIds, isBookmarked, toggleBookmark } = useBookmarks();
  const { getFollowersCount, getFollowingCount } = useFollow();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [dataSyncBusy, setDataSyncBusy] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'recipes' | 'activity'>('recipes');

  const myRecipes = useMemo(
    () => [...recipes].filter((r) => user?.id && r.createdByUserId === user.id),
    [recipes, user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  const pickProfilePhoto = async () => {
    if (!user || avatarBusy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to set your profile photo.');
      return;
    }
    setAvatarBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled || !result.assets[0]) return;
      const src = result.assets[0].uri;
      const base = documentDirectory;
      let destUri = src;
      if (base) {
        destUri = `${base}avatar-${user.id}-${Date.now()}.jpg`;
        await copyAsync({ from: src, to: destUri });
      }
      const res = await updateProfile({ avatarUri: destUri });
      if (!res.ok) Alert.alert('Profile', res.message);
    } catch (e) {
      Alert.alert('Profile', e instanceof Error ? e.message : 'Could not update photo.');
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            onPress={pickProfilePhoto}
            activeOpacity={0.85}
            disabled={avatarBusy}
          >
            <Avatar uri={user?.avatarUri} size={80} />
            <View style={styles.avatarCameraBadge}>
              {avatarBusy ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="camera" size={18} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap photo to change</Text>
          <Text style={styles.name}>{user?.displayName ?? 'Chef'}</Text>
          <Text style={styles.username}>@{user?.username ?? '—'}</Text>
          {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          <View style={styles.rankPill}>
            <Ionicons name="trophy" size={16} color={Colors.accent} />
            <Text style={styles.rankPillText}>
              Cook rank #{user?.leaderboardRank ?? '—'} · Score {user?.rankingScore ?? 0}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => router.push('/profile/my-recipes')}
            >
              <Text style={styles.statNumber}>{myRecipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.reviewCount ?? 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user && user.reviewCount > 0 ? user.averageRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.statLabel}>Avg score</Text>
            </View>
          </View>

          <View style={[styles.statsRow, styles.statsRowPair, { marginTop: Spacing.md }]}>
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => router.push('/profile/bookmarks')}
            >
              <Text style={styles.statNumber}>{bookmarkedIds.length}</Text>
              <Text style={styles.statLabel}>Bookmarks</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              disabled={!user}
              onPress={() =>
                user &&
                router.push({
                  pathname: '/profile/follow-list',
                  params: { userId: user.id, mode: 'followers' },
                })
              }
            >
              <Text style={styles.statNumber}>{user ? getFollowersCount(user.id) : 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              disabled={!user}
              onPress={() =>
                user &&
                router.push({
                  pathname: '/profile/follow-list',
                  params: { userId: user.id, mode: 'following' },
                })
              }
            >
              <Text style={styles.statNumber}>{user ? getFollowingCount(user.id) : 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.7}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Tabs */}
        <View style={styles.profileTabBar}>
          <TouchableOpacity
            style={[styles.profileTab, activeProfileTab === 'recipes' && styles.profileTabActive]}
            onPress={() => setActiveProfileTab('recipes')}
          >
            <Ionicons name="restaurant-outline" size={18} color={activeProfileTab === 'recipes' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.profileTabText, activeProfileTab === 'recipes' && styles.profileTabTextActive]}>
              My Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.profileTab, activeProfileTab === 'activity' && styles.profileTabActive]}
            onPress={() => setActiveProfileTab('activity')}
          >
            <Ionicons name="pulse-outline" size={18} color={activeProfileTab === 'activity' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.profileTabText, activeProfileTab === 'activity' && styles.profileTabTextActive]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {activeProfileTab === 'recipes' ? (
          <View style={styles.myRecipesSection}>
            <TouchableOpacity
              style={styles.myRecipesHeader}
              activeOpacity={0.7}
              onPress={() => router.push('/profile/my-recipes')}
            >
              <Text style={styles.myRecipesSectionTitle}>Your recipes</Text>
              <View style={styles.myRecipesHeaderRight}>
                <Text style={styles.myRecipesCount}>{myRecipes.length}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
            {myRecipes.length === 0 ? (
              <View style={styles.emptyMyRecipes}>
                <Ionicons name="restaurant-outline" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyMyRecipesText}>
                  You have not published any recipes yet. Tap the + tab to create one.
                </Text>
              </View>
            ) : (
              <View style={styles.myRecipesList}>
                {myRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    onBookmarkPress={() => toggleBookmark(recipe.id)}
                    isBookmarked={isBookmarked(recipe.id)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.activitySection}>
            <View style={styles.emptyMyRecipes}>
              <Ionicons name="pulse-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyMyRecipesText}>
                Your recent ratings, bookmarks, and challenge entries will appear here.
              </Text>
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/saved')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="bookmark-outline" size={22} color={Colors.text} />
              <Text style={styles.menuLabel}>Saved Recipes</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuCount}>{bookmarkedIds.length}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={22} color={Colors.text} />
              <Text style={styles.menuLabel}>Settings</Text>
            </View>
            <View style={styles.menuRight}>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.text} />
              <Text style={styles.menuLabel}>Help & Feedback</Text>
            </View>
            <View style={styles.menuRight}>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={() => signOut()}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {__DEV__ ? (
          <View style={styles.devSyncSection}>
            <Text style={styles.devSyncTitle}>Data — push / pull (JSON)</Text>
            <Text style={styles.devSyncHint}>
              Push commits current SQLite accounts and merged session recipes to GitHub via the Contents API.
            </Text>
            {getGithubDataSyncConfig() ? (
              <Text style={styles.devSyncOk}>GitHub: configured</Text>
            ) : (
              <Text style={styles.devSyncWarn}>GitHub: not configured — use Copy for manual paste</Text>
            )}
            <View style={styles.devSyncRow}>
              <TouchableOpacity
                style={[styles.devSyncButton, dataSyncBusy && styles.devSyncButtonDisabled]}
                activeOpacity={0.7}
                disabled={dataSyncBusy}
                onPress={async () => {
                  if (!getGithubDataSyncConfig()) {
                    Alert.alert('GitHub', 'Add EXPO_PUBLIC_GITHUB_TOKEN and EXPO_PUBLIC_GITHUB_REPO to .env.');
                    return;
                  }
                  setDataSyncBusy(true);
                  try {
                    const accountsJson = await exportAccountsJsonForRepo();
                    const recipesJson = exportMergedRecipesJson();
                    await pushDataJsonFilesToGithub({ accountsJson, recipesJson });
                    Alert.alert('Pushed', 'Data committed on remote.');
                  } catch (e) {
                    Alert.alert('Push failed', e instanceof Error ? e.message : 'Unknown error');
                  } finally {
                    setDataSyncBusy(false);
                  }
                }}
              >
                <View style={styles.devSyncButtonInner}>
                  {dataSyncBusy && <ActivityIndicator color={Colors.white} size="small" />}
                  <Text style={styles.devSyncButtonText}>Push data</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devSyncButtonSecondary, dataSyncBusy && styles.devSyncButtonDisabled]}
                activeOpacity={0.7}
                disabled={dataSyncBusy}
                onPress={async () => {
                  if (!getGithubDataSyncConfig()) {
                    Alert.alert('GitHub', 'Add tokens to .env.');
                    return;
                  }
                  setDataSyncBusy(true);
                  try {
                    const { accountsJson, recipesJson } = await pullDataJsonFilesFromGithub();
                    await applyPulledDataJson(accountsJson, recipesJson);
                    await refreshUser();
                    Alert.alert('Pulled', 'Data updated on this device.');
                  } catch (e) {
                    Alert.alert('Pull failed', e instanceof Error ? e.message : 'Unknown error');
                  } finally {
                    setDataSyncBusy(false);
                  }
                }}
              >
                <Text style={styles.devSyncButtonSecondaryText}>Pull data</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.devSyncButtonOutline}
              activeOpacity={0.7}
              disabled={dataSyncBusy}
              onPress={async () => {
                try {
                  const accountsJson = await exportAccountsJsonForRepo();
                  const recipesJson = exportMergedRecipesJson();
                  const blob = `=== data/accounts.json ===\n${accountsJson}\n\n=== data/recipes.json ===\n${recipesJson}\n`;
                  await Clipboard.setStringAsync(blob);
                  Alert.alert('Copied', 'Paste each block into the matching file in the repo.');
                } catch (e) {
                  Alert.alert('Copy failed', e instanceof Error ? e.message : 'Unknown error');
                }
              }}
            >
              <Text style={styles.devSyncButtonOutlineText}>Copy both JSON (manual git)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devSyncButtonOutline, { marginTop: 12 }]}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Clear local storage',
                  'Removes cached recipe overrides, saved user recipes, reviews, bookmarks, follows, likes, and sign-in session. Use this after editing bundled recipes.json if images look stale.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear & reload',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await clearChefdAsyncStorage();
                          if (Platform.OS === 'web' && typeof window !== 'undefined') {
                            window.location.reload();
                          } else {
                            DevSettings.reload();
                          }
                        } catch (e) {
                          Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={styles.devSyncButtonOutlineText}>Clear AsyncStorage & reload</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appCanvas },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatarTouchable: { position: 'relative' },
  avatarCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  avatarHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent + '22',
    borderRadius: BorderRadius.full,
  },
  rankPillText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.text },
  name: { fontSize: FontSize.xl, fontWeight: '800', fontFamily: Fonts.display, color: Colors.text, marginTop: Spacing.sm },
  username: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  bio: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignSelf: 'stretch',
  },
  statsRowPair: { paddingHorizontal: Spacing.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FontSize.lg, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  editButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editButtonText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  profileTabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  profileTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  profileTabActive: { backgroundColor: Colors.white },
  profileTabText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.textTertiary },
  profileTabTextActive: { color: Colors.primary },
  myRecipesSection: { paddingBottom: Spacing.xl },
  myRecipesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  myRecipesSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myRecipesHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  myRecipesCount: { fontSize: FontSize.sm, fontWeight: '700', fontFamily: Fonts.bodyBold, color: Colors.primary },
  emptyMyRecipes: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyMyRecipesText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  myRecipesList: { paddingBottom: Spacing.sm },
  activitySection: { paddingBottom: Spacing.xl },
  menuSection: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuLabel: { fontSize: FontSize.md, color: Colors.text },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuCount: { fontSize: FontSize.sm, color: Colors.textTertiary },
  logoutButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.heart },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  listImage: { width: 70, height: 70, backgroundColor: '#E0E0E0' },
  listContent: { flex: 1, padding: Spacing.md },
  listTitle: { fontSize: FontSize.md, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.text },
  listDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  listCount: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  devSyncSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  devSyncTitle: { fontSize: FontSize.sm, fontWeight: '700', fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  devSyncHint: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  devSyncOk: { fontSize: FontSize.xs, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary, marginBottom: Spacing.sm },
  devSyncWarn: { fontSize: FontSize.xs, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: '#B45309', marginBottom: Spacing.sm },
  devSyncRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  devSyncButtonInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  devSyncButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  devSyncButtonDisabled: { opacity: 0.55 },
  devSyncButtonText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.white },
  devSyncButtonSecondary: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  devSyncButtonSecondaryText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  devSyncButtonOutline: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devSyncButtonOutlineText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary },
});

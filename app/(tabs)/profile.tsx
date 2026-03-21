import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { exportAccountsJsonForRepo } from '@/database/db';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser, updateProfile } = useAuth();
  const { recipes } = useRecipes();
  const [avatarBusy, setAvatarBusy] = useState(false);

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

  const PROFILE_MENU = [
    { icon: 'bookmark-outline' as const, label: 'Saved Recipes', count: undefined },
    { icon: 'heart-outline' as const, label: 'Liked Ratings', count: undefined },
    {
      icon: 'people-outline' as const,
      label: 'Following',
      count: user?.followingCount,
    },
    { icon: 'settings-outline' as const, label: 'Settings' },
    { icon: 'help-circle-outline' as const, label: 'Help & Feedback' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            onPress={pickProfilePhoto}
            activeOpacity={0.85}
            disabled={avatarBusy}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.recipeCount ?? 0}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </View>
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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topRatedSection}>
          <Text style={styles.sectionTitle}>Trending recipes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topRatedScroll}>
            {recipes.slice(0, 4).map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.topRatedCard}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: recipe.image }} style={styles.topRatedImage} />
                <View style={styles.topRatedOverlay} />
                <View style={styles.topRatedContent}>
                  <Text style={styles.topRatedName} numberOfLines={1}>{recipe.name}</Text>
                  <View style={styles.topRatedRating}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.topRatedScore}>
                      {recipe.totalRatings === 0 ? '—' : recipe.averageRating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuSection}>
          {PROFILE_MENU.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color={Colors.text} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                {item.count !== undefined && (
                  <Text style={styles.menuCount}>{item.count}</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={() => signOut()}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {__DEV__ ? (
          <View style={styles.devSyncSection}>
            <Text style={styles.devSyncTitle}>Git — shared accounts</Text>
            <Text style={styles.devSyncHint}>
              Copy JSON, replace data/accounts.json, commit and push. Pull merges on next launch (restart Metro
              after pulls so the bundle picks up the file).
            </Text>
            <TouchableOpacity
              style={styles.devSyncButton}
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  const json = await exportAccountsJsonForRepo();
                  await Clipboard.setStringAsync(json);
                  Alert.alert('Copied', 'Paste into data/accounts.json in the repo, then commit.');
                } catch (e) {
                  Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
                }
              }}
            >
              <Text style={styles.devSyncButtonText}>Copy accounts JSON</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatarTouchable: {
    position: 'relative',
  },
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
  avatarHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
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
  rankPillText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  username: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 2,
  },
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
  statsRowPair: {
    paddingHorizontal: Spacing.xxl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  editButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  topRatedSection: {
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topRatedScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  topRatedCard: {
    width: 120,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  topRatedImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topRatedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topRatedContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.sm,
  },
  topRatedName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  topRatedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  topRatedScore: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
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
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  logoutButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.heart,
  },
  devSyncSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  devSyncTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  devSyncHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  devSyncButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  devSyncButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
});

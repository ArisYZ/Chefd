import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { RatingBadge } from '@/components/RatingBadge';
import { currentUser, recipes, feedRatings } from '@/constants/MockData';

const recentRatings = feedRatings.filter((r) => r.user.id === currentUser.id).length > 0
  ? feedRatings.slice(0, 3)
  : feedRatings.slice(0, 3);

const PROFILE_MENU = [
  { icon: 'bookmark-outline', label: 'Saved Recipes', count: 24 },
  { icon: 'heart-outline', label: 'Liked Ratings', count: 89 },
  { icon: 'people-outline', label: 'Following', count: currentUser.followingCount },
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'help-circle-outline', label: 'Help & Feedback' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Avatar uri={currentUser.avatar} size={80} />
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
          <Text style={styles.bio}>{currentUser.bio}</Text>

          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{currentUser.recipesRated}</Text>
              <Text style={styles.statLabel}>Rated</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{currentUser.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{currentUser.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topRatedSection}>
          <Text style={styles.sectionTitle}>Your Top Rated</Text>
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
                    <Text style={styles.topRatedScore}>{recipe.averageRating.toFixed(1)}</Text>
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
                <Ionicons name={item.icon as any} size={22} color={Colors.text} />
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

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

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
  name: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.md,
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
    paddingHorizontal: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
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
});

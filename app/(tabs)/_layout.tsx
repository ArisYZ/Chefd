import React, { useCallback, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { TransitionPresets } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, Fonts } from '@/constants/Colors';
import { ChefAiChat } from '@/components/ChefAiChat';
import {
  Platform,
  View,
  Image,
  StyleSheet,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';

/** Matches tab bar height in screenOptions below (FAB sits just above the bar). */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
const CHEF_AI_FAB_SIZE = 56;

/** Create-tab FAB: one size + half radius keeps shadow + clip + image aligned. */
const CREATE_TAB_FAB_SIZE = 74;
const CREATE_TAB_FAB_RADIUS = CREATE_TAB_FAB_SIZE / 2;
/** Android elevation needs an opaque circle; smaller than the asset so less white peeks past the art. */
const CREATE_TAB_FAB_ANDROID_SHADOW_SIZE = 56;
const CREATE_TAB_FAB_ANDROID_SHADOW_RADIUS = CREATE_TAB_FAB_ANDROID_SHADOW_SIZE / 2;

export default function TabLayout() {
  const [createWebOpen, setCreateWebOpen] = useState(false);
  const [chefAiOpen, setChefAiOpen] = useState(false);

  const showCreateRecipeChoice = useCallback(() => {
    if (Platform.OS === 'web') {
      setCreateWebOpen(true);
      return;
    }
    Alert.alert('Create Recipe', 'How would you like to add your recipe?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Import from URL', onPress: () => router.push('/recipe/import') },
      { text: 'From Scratch', onPress: () => router.push('/recipe/new') },
    ]);
  }, []);

  return (
    <View style={styles.tabRoot}>
    <Tabs
      screenOptions={{
        ...TransitionPresets.FadeTransition,
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
          fontFamily: Fonts.bodyMedium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: () => (
            <View style={styles.fabShadow}>
              {Platform.OS === 'android' && <View style={styles.fabAndroidShadowCaster} />}
              <View style={styles.fabClip}>
                <Image
                  source={require('../../assets/images/create-tab-button.png')}
                  style={styles.fabImage}
                  resizeMode="cover"
                  accessibilityLabel="Create recipe"
                />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            showCreateRecipeChoice();
          },
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          href: null,
        }}
      />
    </Tabs>

    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        style={[styles.chefAiFab, { bottom: TAB_BAR_HEIGHT + 12 }]}
        onPress={() => setChefAiOpen(true)}
        activeOpacity={0.88}
        accessibilityLabel="Open Remy Rat"
        accessibilityHint="Opens the Remy Rat assistant chat"
      >
        {Platform.OS === 'android' && <View style={styles.chefAiFabAndroidShadow} />}
        <View style={styles.chefAiFabClip}>
          <Image
            source={require('../../assets/images/chef-ai-rat.png')}
            style={styles.chefAiFabImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      </TouchableOpacity>
    </View>

    <Modal
      visible={chefAiOpen}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={() => setChefAiOpen(false)}
    >
      <ChefAiChat embedded onClose={() => setChefAiOpen(false)} />
    </Modal>

    {Platform.OS === 'web' && (
      <Modal
        visible={createWebOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateWebOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCreateWebOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Recipe</Text>
            <Text style={styles.modalSub}>How would you like to add your recipe?</Text>
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => {
                setCreateWebOpen(false);
                router.push('/recipe/new');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnPrimaryText}>From Scratch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => {
                setCreateWebOpen(false);
                router.push('/recipe/import');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnSecondaryText}>Import from URL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnCancel}
              onPress={() => setCreateWebOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRoot: {
    flex: 1,
  },
  chefAiFab: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: Spacing.lg,
    zIndex: 100,
    ...Platform.select({
      android: { elevation: 14 },
      default: {},
    }),
  },
  /** Android: small disk so elevation reads as a round shadow under the circular image. */
  chefAiFabAndroidShadow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    bottom: 4,
    alignSelf: 'center',
    elevation: 12,
  },
  chefAiFabClip: {
    width: CHEF_AI_FAB_SIZE,
    height: CHEF_AI_FAB_SIZE,
    borderRadius: CHEF_AI_FAB_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      default: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  chefAiFabImage: {
    width: CHEF_AI_FAB_SIZE,
    height: CHEF_AI_FAB_SIZE,
  },
  /** Shadow on rounded outer layer so iOS draws a circular drop shadow (not a square). */
  fabShadow: {
    width: CREATE_TAB_FAB_SIZE,
    height: CREATE_TAB_FAB_SIZE,
    borderRadius: CREATE_TAB_FAB_RADIUS,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        backgroundColor: 'transparent',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        backgroundColor: 'transparent',
      },
      default: {
        backgroundColor: 'transparent',
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
    }),
  },
  /** Android: small white disk under the art so elevation casts a round shadow without a full 68px halo. */
  fabAndroidShadowCaster: {
    position: 'absolute',
    width: CREATE_TAB_FAB_ANDROID_SHADOW_SIZE,
    height: CREATE_TAB_FAB_ANDROID_SHADOW_SIZE,
    borderRadius: CREATE_TAB_FAB_ANDROID_SHADOW_RADIUS,
    backgroundColor: Colors.white,
    elevation: 8,
  },
  /** Clips the PNG to a circle so no square bounds show through. */
  fabClip: {
    width: CREATE_TAB_FAB_SIZE,
    height: CREATE_TAB_FAB_SIZE,
    borderRadius: CREATE_TAB_FAB_RADIUS,
    overflow: 'hidden',
    zIndex: 1,
  },
  fabImage: {
    width: CREATE_TAB_FAB_SIZE,
    height: CREATE_TAB_FAB_SIZE,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalBtnPrimaryText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
  },
  modalBtnSecondary: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalBtnSecondaryText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
  },
  modalBtnCancel: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
    fontWeight: '500',
    fontFamily: Fonts.bodyMedium,
  },
});

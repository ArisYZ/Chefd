import React, { useCallback, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/Colors';
import {
  Platform,
  View,
  StyleSheet,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';

export default function TabLayout() {
  const [createWebOpen, setCreateWebOpen] = useState(false);

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
    <>
    <Tabs
      screenOptions={{
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
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
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
            <View style={styles.fab}>
              <Ionicons name="add" size={28} color={Colors.white} />
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
            <Ionicons name="trophy-outline" size={size} color={color} />
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
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  },
  modalBtnCancel: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
});

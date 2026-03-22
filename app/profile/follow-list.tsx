import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { getUserById } from '@/constants/MockData';
import { useFollow } from '@/contexts/FollowContext';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'followers' | 'following';

function resolveDisplay(
  id: string,
  authUser: { id: string; displayName: string; username: string; avatarUri: string | null } | null,
) {
  const mock = getUserById(id);
  if (mock) {
    return { name: mock.name, username: mock.username, avatar: mock.avatar };
  }
  if (authUser?.id === id) {
    return {
      name: authUser.displayName,
      username: authUser.username,
      avatar: authUser.avatarUri ?? 'https://i.pravatar.cc/150?img=11',
    };
  }
  return {
    name: 'Chef',
    username: id.replace(/^u_/, ''),
    avatar: 'https://i.pravatar.cc/150?img=3',
  };
}

export default function FollowListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const { getFollowers, getFollowing } = useFollow();
  const params = useLocalSearchParams<{ userId?: string | string[]; mode?: string | string[] }>();

  const userId = (() => {
    const u = params.userId;
    if (Array.isArray(u)) return u[0] ?? '';
    return typeof u === 'string' ? u : '';
  })();
  const modeRaw = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const mode: Mode = modeRaw === 'following' ? 'following' : 'followers';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'followers' ? 'Followers' : 'Following',
    });
  }, [navigation, mode]);

  const ids = useMemo(() => {
    if (!userId) return [];
    const list = mode === 'followers' ? getFollowers(userId) : getFollowing(userId);
    return [...list].sort((a, b) => {
      const da = resolveDisplay(a, authUser);
      const db = resolveDisplay(b, authUser);
      return da.name.localeCompare(db.name, undefined, { sensitivity: 'base' });
    });
  }, [userId, mode, getFollowers, getFollowing, authUser]);

  if (!userId) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Text style={styles.emptyText}>Missing profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={ids}
        keyExtractor={(item) => item}
        contentContainerStyle={ids.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </Text>
            <Text style={styles.emptySub}>
              {mode === 'followers'
                ? 'When people follow this account, they will show up here.'
                : 'Accounts this user follows will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const d = resolveDisplay(item, authUser);
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => router.push(`/user/${item}`)}
            >
              <Avatar uri={d.avatar} size={48} />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={styles.rowUsername} numberOfLines={1}>
                  @{d.username}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appCanvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.appCanvas },
  listContent: { paddingVertical: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  rowUsername: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyList: { flexGrow: 1 },
  emptyText: { color: Colors.textSecondary },
});

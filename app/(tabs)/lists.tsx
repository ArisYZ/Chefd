import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { userLists } from '@/constants/MockData';
import { RecipeList } from '@/types';
import { RemoteImage } from '@/components/RemoteImage';

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

export default function ListsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Lists</Text>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>67</Text>
          <Text style={styles.statLabel}>Recipes Rated</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Lists Created</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>8.2</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <FlatList
        data={userLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListCard list={item} onPress={() => router.push(`/list/${item.id}`)} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appCanvas,
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
    fontFamily: Fonts.display,
    color: Colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    fontFamily: Fonts.bodyExtraBold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  listImage: {
    width: 80,
    height: 80,
    backgroundColor: '#E0E0E0',
  },
  listContent: {
    flex: 1,
    padding: Spacing.md,
  },
  listTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.text,
  },
  listDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  separator: {
    height: Spacing.md,
  },
});

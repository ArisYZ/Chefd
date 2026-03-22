import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { RecipeCard } from '@/components/RecipeCard';
import { RemoteImage } from '@/components/RemoteImage';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { BookmarkCollection, Recipe } from '@/types';

export default function SavedRecipesScreen() {
  const router = useRouter();
  const { bookmarkedIds, collections, isBookmarked, toggleBookmark, createCollection, deleteCollection } = useBookmarks();
  const { getRecipeById } = useRecipes();
  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');

  const activeIds = useMemo(() => {
    if (activeTab === 'all') return bookmarkedIds;
    const col = collections.find((c) => c.id === activeTab);
    return col ? col.recipeIds : [];
  }, [activeTab, bookmarkedIds, collections]);

  const recipes = useMemo(
    () => activeIds.map((id) => getRecipeById(id)).filter((r): r is Recipe => r != null),
    [activeIds, getRecipeById],
  );

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCollection(trimmed);
    setNewName('');
    setShowNewModal(false);
  };

  const handleDelete = (col: BookmarkCollection) => {
    Alert.alert('Delete collection', `Remove "${col.name}"? Recipes stay bookmarked.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCollection(col.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabChipText, activeTab === 'all' && styles.tabChipTextActive]}>
                  All Saved ({bookmarkedIds.length})
                </Text>
              </TouchableOpacity>
              {collections.map((col) => (
                <TouchableOpacity
                  key={col.id}
                  style={[styles.tabChip, activeTab === col.id && styles.tabChipActive]}
                  onPress={() => setActiveTab(col.id)}
                  onLongPress={() => handleDelete(col)}
                >
                  <Text style={[styles.tabChipText, activeTab === col.id && styles.tabChipTextActive]}>
                    {col.name} ({col.recipeIds.length})
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addChip} onPress={() => setShowNewModal(true)}>
                <Ionicons name="add" size={18} color={Colors.primary} />
                <Text style={styles.addChipText}>New</Text>
              </TouchableOpacity>
            </View>

            {collections.length > 0 && activeTab === 'all' && (
              <View style={styles.collectionsGrid}>
                {collections.map((col) => {
                  const thumbs = col.recipeIds.slice(0, 4).map((id) => getRecipeById(id));
                  return (
                    <TouchableOpacity
                      key={col.id}
                      style={styles.collectionCard}
                      onPress={() => setActiveTab(col.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.thumbGrid}>
                        {[0, 1, 2, 3].map((i) => {
                          const r = thumbs[i];
                          return r ? (
                            <RemoteImage key={i} uri={r.image} style={styles.thumbImg} />
                          ) : (
                            <View key={i} style={[styles.thumbImg, styles.thumbPlaceholder]} />
                          );
                        })}
                      </View>
                      <Text style={styles.collectionName} numberOfLines={1}>{col.name}</Text>
                      <Text style={styles.collectionCount}>{col.recipeIds.length} recipes</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
            onBookmarkPress={() => toggleBookmark(item.id)}
            isBookmarked={isBookmarked(item.id)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No saved recipes yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the bookmark icon on any recipe to save it here.
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={showNewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNewModal(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Collection name"
              placeholderTextColor={Colors.textTertiary}
              value={newName}
              onChangeText={(t) => setNewName(t.slice(0, 50))}
              maxLength={50}
              autoFocus
            />
            <Text style={styles.charCount}>{newName.length}/50</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNewModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreate, !newName.trim() && styles.modalCreateDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim()}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: Spacing.xxl },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.primary + '18',
    borderColor: Colors.primary,
  },
  tabChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textSecondary,
  },
  tabChipTextActive: {
    color: Colors.primary,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  collectionCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 100,
  },
  thumbImg: {
    width: '50%',
    height: 50,
    backgroundColor: '#E0E0E0',
  },
  thumbPlaceholder: {
    backgroundColor: Colors.surfaceElevated,
  },
  collectionName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.text,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  collectionCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textSecondary,
  },
  modalCreate: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  modalCreateDisabled: { opacity: 0.4 },
  modalCreateText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.white,
  },
});

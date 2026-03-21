import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { RECIPE_TAG_OPTIONS } from '@/constants/recipeTags';
import { MEASUREMENT_UNITS } from '@/constants/measurementUnits';
import { formatIngredientLine } from '@/lib/ingredients';
import type { IngredientMeasured } from '@/types';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export default function NewRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const { user, onUserCreatedRecipe } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Medium');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<
    { amount: string; unit: string; name: string }[]
  >([{ amount: '', unit: 'g', name: '' }]);
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null);
  const [instructions, setInstructions] = useState<string[]>(['']);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const copyPickedUriToDocuments = async (src: string) => {
    const base = documentDirectory;
    if (!base) {
      setImageUri(src);
      return;
    }
    const dest = `${base}recipe-${Date.now()}.jpg`;
    await copyAsync({ from: src, to: dest });
    setImageUri(dest);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take a recipe photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    await copyPickedUriToDocuments(result.assets[0].uri);
  };

  const openLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to add a recipe photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    await copyPickedUriToDocuments(result.assets[0].uri);
  };

  const pickImage = () => {
    Alert.alert('Add photo', 'Take a new picture or choose one from your library.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take photo', onPress: () => void openCamera() },
      { text: 'Choose from library', onPress: () => void openLibrary() },
    ]);
  };

  const updateIngredientName = (index: number, text: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: text };
      return next;
    });
  };

  const updateIngredientAmount = (index: number, text: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], amount: text };
      return next;
    });
  };

  const updateIngredientUnit = (index: number, unit: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unit };
      return next;
    });
  };

  const updateInstruction = (index: number, text: string) => {
    setInstructions((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const save = async () => {
    const prep = parseInt(prepTime, 10);
    const cook = parseInt(cookTime, 10);
    const serv = parseInt(servings, 10);

    if (!imageUri) {
      Alert.alert('Photo required', 'Add a photo for your recipe.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a recipe name.');
      return;
    }
    if (Number.isNaN(prep) || prep < 0 || Number.isNaN(cook) || cook < 0) {
      Alert.alert('Time', 'Enter valid prep and cook times in minutes (0 or more).');
      return;
    }
    if (Number.isNaN(serv) || serv < 1) {
      Alert.alert('Servings', 'Enter how many servings (at least 1).');
      return;
    }

    const ingMeasured: IngredientMeasured[] = ingredients
      .map((i) => ({
        name: i.name.trim(),
        amount: i.amount.trim(),
        unit: i.unit.trim(),
      }))
      .filter((i) => i.name || i.amount || i.unit);

    const steps = instructions.map((s) => s.trim()).filter(Boolean);
    if (!ingMeasured.length) {
      Alert.alert('Ingredients', 'Add at least one ingredient.');
      return;
    }
    for (const row of ingMeasured) {
      if (!row.amount || !row.unit || !row.name) {
        Alert.alert(
          'Ingredients',
          'Each ingredient needs an amount (e.g. 500), a unit (e.g. mL), and a name.',
        );
        return;
      }
    }
    if (!steps.length) {
      Alert.alert('Instructions', 'Add at least one step.');
      return;
    }

    const id = addRecipe({
      name: name.trim(),
      cuisine: cuisine.trim() || 'Other',
      category: category.trim() || 'General',
      tags: selectedTags,
      image: imageUri ?? '',
      prepTime: prep,
      cookTime: cook,
      servings: serv,
      difficulty,
      ingredients: ingMeasured.map((i) => formatIngredientLine(i)),
      ingredientsMeasured: ingMeasured,
      instructions: steps,
    });

    if (user) await onUserCreatedRecipe();
    router.replace(`/recipe/${id}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.photoBox} onPress={pickImage} activeOpacity={0.85}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.photoHint}>Tap to take or choose a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Recipe name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sheet-pan salmon"
          placeholderTextColor={Colors.textTertiary}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Cuisine</Text>
            <TextInput
              style={styles.input}
              value={cuisine}
              onChangeText={setCuisine}
              placeholder="Optional"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Type</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Dinner"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        <Text style={styles.label}>Time & servings</Text>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.sublabel}>Prep (min)</Text>
            <TextInput
              style={styles.input}
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.sublabel}>Cook (min)</Text>
            <TextInput
              style={styles.input}
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.sublabel}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.diffRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
              onPress={() => setDifficulty(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagsWrap}>
          {RECIPE_TAG_OPTIONS.map((tag) => {
            const on = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, on && styles.tagChipOn]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tagLabel, on && styles.tagLabelOn]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.label}>Ingredients</Text>
          <TouchableOpacity
            onPress={() => setIngredients((p) => [...p, { amount: '', unit: 'g', name: '' }])}
            hitSlop={8}
          >
            <Text style={styles.addLine}>+ Add line</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.ingredientHint}>Amount · unit · ingredient name</Text>
        {ingredients.map((line, i) => (
          <View key={`ing-${i}`} style={styles.ingredientRowForm}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={line.amount}
              onChangeText={(t) => updateIngredientAmount(i, t)}
              placeholder="500"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="default"
            />
            <TouchableOpacity
              style={[styles.input, styles.unitSelect]}
              onPress={() => setUnitPickerIndex(i)}
              activeOpacity={0.7}
            >
              <Text style={styles.unitSelectText} numberOfLines={1}>
                {line.unit || 'unit'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.ingredientNameInput]}
              value={line.name}
              onChangeText={(t) => updateIngredientName(i, t)}
              placeholder="flour"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        ))}

        <Modal visible={unitPickerIndex !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setUnitPickerIndex(null)} />
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Measurement</Text>
              <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                {MEASUREMENT_UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={styles.modalRow}
                    onPress={() => {
                      if (unitPickerIndex !== null) updateIngredientUnit(unitPickerIndex, u);
                      setUnitPickerIndex(null);
                    }}
                  >
                    <Text style={styles.modalRowText}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.sectionHead}>
          <Text style={styles.label}>Instructions</Text>
          <TouchableOpacity
            onPress={() => setInstructions((p) => [...p, ''])}
            hitSlop={8}
          >
            <Text style={styles.addLine}>+ Add step</Text>
          </TouchableOpacity>
        </View>
        {instructions.map((line, i) => (
          <View key={`step-${i}`} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{i + 1}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.stepInput]}
              value={line}
              onChangeText={(t) => updateInstruction(i, t)}
              placeholder={`Step ${i + 1}`}
              placeholderTextColor={Colors.textTertiary}
              multiline
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>Save recipe</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  photoBox: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#E0E0E0',
  },
  photoPlaceholder: {
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sublabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  lineInput: {
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  ingredientHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  ingredientRowForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  amountInput: {
    width: 72,
    marginBottom: 0,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  unitSelect: {
    width: 100,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  unitSelectText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  ingredientNameInput: {
    flex: 1,
    marginBottom: 0,
    paddingVertical: Spacing.sm,
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
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    color: Colors.text,
  },
  modalList: {
    maxHeight: 320,
  },
  modalRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalRowText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  diffRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  diffChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  diffChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  diffText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  diffTextActive: {
    color: Colors.primary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipOn: {
    backgroundColor: Colors.primary + '18',
    borderColor: Colors.primary + '40',
  },
  tagLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tagLabelOn: {
    color: Colors.primaryDark,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addLine: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  stepBadgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  stepInput: {
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

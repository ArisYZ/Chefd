import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { RECIPE_TAG_OPTIONS, MAX_RECIPE_TAGS, getTagConfig } from '@/constants/recipeTags';
import { FLAVOR_TAG_OPTIONS, MAX_FLAVOR_TAGS } from '@/constants/flavorTags';
import { MEASUREMENT_UNITS } from '@/constants/measurementUnits';
import { formatIngredientLine } from '@/lib/ingredients';
import type { IngredientMeasured, Recipe } from '@/types';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const MAX_TITLE = 100;
const MAX_DESC = 500;
const MAX_STEP = 300;
const MAX_ING_NAME = 50;

function isRecipeOwner(recipe: Recipe, userId: string | undefined, recipeId: string): boolean {
  if (!userId) return false;
  return (
    recipe.createdByUserId === userId ||
    (recipeId.startsWith('ur-') && recipe.createdByUserId == null)
  );
}

/** Stored times are minutes; map to form fields using saved display units. */
function minutesToFormField(
  minutes: number,
  storedUnit: 'minutes' | 'hours' | undefined,
): { value: string; unit: 'minutes' | 'hours' } {
  const u = storedUnit ?? 'minutes';
  if (u === 'hours') {
    const h = minutes / 60;
    const text = Number.isInteger(h) ? String(h) : String(Math.round(h * 10) / 10);
    return { value: text, unit: 'hours' };
  }
  return { value: String(Math.round(minutes)), unit: 'minutes' };
}

export default function NewRecipeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ editId?: string | string[] }>();
  const editIdRaw = params.editId;
  const editId = Array.isArray(editIdRaw) ? editIdRaw[0] : editIdRaw;
  const { addRecipe, updateRecipe, getRecipeById } = useRecipes();
  const { user, onUserCreatedRecipe } = useAuth();
  const lastHydratedEdit = useRef<string | null>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [prepUnit, setPrepUnit] = useState<'minutes' | 'hours'>('minutes');
  const [cookTime, setCookTime] = useState('');
  const [cookUnit, setCookUnit] = useState<'minutes' | 'hours'>('minutes');
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Medium');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<
    { amount: string; unit: string; name: string }[]
  >([{ amount: '', unit: 'g', name: '' }]);
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [sourceUrl, setSourceUrl] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editId ? 'Edit Recipe' : 'New Recipe',
    });
  }, [editId, navigation]);

  useEffect(() => {
    if (!editId) {
      lastHydratedEdit.current = null;
      return;
    }
    if (lastHydratedEdit.current === editId) return;
    const r = getRecipeById(editId);
    if (!r) {
      Alert.alert('Not found', 'This recipe could not be opened for editing.');
      router.back();
      return;
    }
    if (!user?.id) {
      Alert.alert('Sign in required', 'Sign in to edit your recipes.');
      router.back();
      return;
    }
    if (!isRecipeOwner(r, user.id, editId)) {
      Alert.alert('Cannot edit', 'You can only edit recipes you created.');
      router.back();
      return;
    }

    setImageUri(r.image || null);
    setName(r.name);
    setDescription(r.description ?? '');
    setCuisine(r.cuisine);
    setCategory(r.category);
    const prepF = minutesToFormField(r.prepTime, r.prepTimeUnit);
    const cookF = minutesToFormField(r.cookTime, r.cookTimeUnit);
    setPrepTime(prepF.value);
    setPrepUnit(prepF.unit);
    setCookTime(cookF.value);
    setCookUnit(cookF.unit);
    setServings(r.servings);
    setDifficulty(r.difficulty);
    setSelectedTags([...r.tags]);
    setSelectedFlavors(r.flavorTags ? [...r.flavorTags] : []);
    const ingRows =
      r.ingredientsMeasured && r.ingredientsMeasured.length > 0
        ? r.ingredientsMeasured.map((m) => ({
            amount: m.amount ?? '',
            unit: m.unit ?? 'g',
            name: m.name ?? '',
          }))
        : [{ amount: '', unit: 'g', name: '' }];
    setIngredients(ingRows);
    setInstructions(r.instructions.length > 0 ? [...r.instructions] : ['']);
    setSourceUrl(r.sourceUrl ?? '');
    lastHydratedEdit.current = editId;
  }, [editId, getRecipeById, user?.id, router]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_RECIPE_TAGS) {
        Alert.alert('Limit reached', `You can select up to ${MAX_RECIPE_TAGS} category tags.`);
        return prev;
      }
      return [...prev, tag];
    });
  };

  const toggleFlavor = (tag: string) => {
    setSelectedFlavors((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_FLAVOR_TAGS) {
        Alert.alert('Limit reached', `You can select up to ${MAX_FLAVOR_TAGS} flavor tags.`);
        return prev;
      }
      return [...prev, tag];
    });
  };

  const copyPickedUriToDocuments = async (src: string) => {
    const base = documentDirectory;
    if (!base) { setImageUri(src); return; }
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
      Alert.alert('Permission needed', 'Photo library access is required.');
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
      next[index] = { ...next[index], name: text.slice(0, MAX_ING_NAME) };
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

  const moveIngredient = (from: number, to: number) => {
    if (to < 0 || to >= ingredients.length) return;
    setIngredients((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, text: string) => {
    setInstructions((prev) => {
      const next = [...prev];
      next[index] = text.slice(0, MAX_STEP);
      return next;
    });
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= instructions.length) return;
    setInstructions((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeStep = (index: number) => {
    if (instructions.length <= 1) return;
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  const getTimeInMinutes = (value: string, unit: 'minutes' | 'hours') => {
    const num = parseInt(value, 10);
    if (Number.isNaN(num) || num < 0) return NaN;
    return unit === 'hours' ? num * 60 : num;
  };

  const save = async () => {
    const prep = getTimeInMinutes(prepTime, prepUnit);
    const cook = getTimeInMinutes(cookTime, cookUnit);

    const existingImage = editId ? getRecipeById(editId)?.image : undefined;
    const resolvedImage = (imageUri ?? existingImage ?? '').trim();
    if (!resolvedImage) {
      Alert.alert('Photo required', 'Add a photo for your recipe.');
      return;
    }
    if (!name.trim()) { Alert.alert('Name required', 'Enter a recipe name.'); return; }
    if (Number.isNaN(prep) || Number.isNaN(cook)) {
      Alert.alert('Time', 'Enter valid prep and cook times (0 or more).');
      return;
    }
    if (servings < 1) { Alert.alert('Servings', 'Enter at least 1 serving.'); return; }

    const ingMeasured: IngredientMeasured[] = ingredients
      .map((i) => ({ name: i.name.trim(), amount: i.amount.trim(), unit: i.unit.trim() }))
      .filter((i) => i.name || i.amount || i.unit);

    const steps = instructions.map((s) => s.trim()).filter(Boolean);
    if (!ingMeasured.length) { Alert.alert('Ingredients', 'Add at least one ingredient.'); return; }
    for (const row of ingMeasured) {
      if (!row.amount || !row.unit || !row.name) {
        Alert.alert('Ingredients', 'Each ingredient needs an amount, unit, and name.');
        return;
      }
    }
    if (!steps.length) { Alert.alert('Instructions', 'Add at least one step.'); return; }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      cuisine: cuisine.trim() || 'Other',
      category: category.trim() || 'General',
      tags: selectedTags,
      flavorTags: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      image: resolvedImage,
      prepTime: prep,
      cookTime: cook,
      prepTimeUnit: prepUnit,
      cookTimeUnit: cookUnit,
      servings,
      difficulty,
      ingredients: ingMeasured.map((i) => formatIngredientLine(i)),
      ingredientsMeasured: ingMeasured,
      instructions: steps,
      sourceUrl: sourceUrl.trim() || undefined,
    };

    if (editId) {
      const ok = await updateRecipe(editId, payload);
      if (!ok) {
        Alert.alert('Could not save', 'You may not have permission to edit this recipe.');
        return;
      }
      router.replace(`/recipe/${editId}`);
      return;
    }

    const id = addRecipe(payload);

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
        {/* Cover Photo */}
        <TouchableOpacity style={styles.photoBox} onPress={pickImage} activeOpacity={0.85}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.photoHint}>Tap to take or choose a photo</Text>
              <Text style={styles.photoReq}>Required · JPG, PNG, WebP · Max 10MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Recipe name *</Text>
          <Text style={styles.charCounter}>{name.length}/{MAX_TITLE}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => setName(t.slice(0, MAX_TITLE))}
          placeholder="e.g. Sheet-pan salmon"
          placeholderTextColor={Colors.textTertiary}
          maxLength={MAX_TITLE}
        />

        {/* Description */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.charCounter}>{description.length}/{MAX_DESC}</Text>
        </View>
        <TextInput
          style={[styles.input, styles.descInput]}
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, MAX_DESC))}
          placeholder="Backstory or context for your recipe (optional)"
          placeholderTextColor={Colors.textTertiary}
          multiline
          textAlignVertical="top"
          maxLength={MAX_DESC}
        />

        {/* Cuisine / Type */}
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

        {/* Time & Servings */}
        <Text style={styles.label}>Time & servings</Text>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.sublabel}>Prep time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity
                style={styles.unitToggle}
                onPress={() => setPrepUnit((u) => (u === 'minutes' ? 'hours' : 'minutes'))}
              >
                <Text style={styles.unitToggleText}>{prepUnit === 'minutes' ? 'min' : 'hrs'}</Text>
                <Ionicons name="swap-horizontal" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.sublabel}>Cook time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity
                style={styles.unitToggle}
                onPress={() => setCookUnit((u) => (u === 'minutes' ? 'hours' : 'minutes'))}
              >
                <Text style={styles.unitToggleText}>{cookUnit === 'minutes' ? 'min' : 'hrs'}</Text>
                <Ionicons name="swap-horizontal" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Serving Stepper */}
        <Text style={styles.sublabel}>Servings</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setServings((s) => Math.max(1, s - 1))}
            disabled={servings <= 1}
          >
            <Ionicons name="remove" size={20} color={servings <= 1 ? Colors.textTertiary : Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{servings}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setServings((s) => Math.min(20, s + 1))}
            disabled={servings >= 20}
          >
            <Ionicons name="add" size={20} color={servings >= 20 ? Colors.textTertiary : Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Difficulty */}
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

        {/* Category Tags */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Category Tags</Text>
          <Text style={styles.charCounter}>{selectedTags.length}/{MAX_RECIPE_TAGS}</Text>
        </View>
        <View style={styles.tagsWrap}>
          {RECIPE_TAG_OPTIONS.map((tag) => {
            const on = selectedTags.includes(tag.label);
            return (
              <TouchableOpacity
                key={tag.label}
                style={[
                  styles.tagChip,
                  on && { backgroundColor: tag.color + '18', borderColor: tag.color + '40' },
                ]}
                onPress={() => toggleTag(tag.label)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tag.icon as any}
                  size={14}
                  color={on ? tag.color : Colors.textTertiary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.tagLabel, on && { color: tag.color }]}>{tag.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Flavor Tags */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Flavor Profile</Text>
          <Text style={styles.charCounter}>{selectedFlavors.length}/{MAX_FLAVOR_TAGS}</Text>
        </View>
        <View style={styles.tagsWrap}>
          {FLAVOR_TAG_OPTIONS.map((tag) => {
            const on = selectedFlavors.includes(tag.label);
            return (
              <TouchableOpacity
                key={tag.label}
                style={[
                  styles.tagChip,
                  on && { backgroundColor: tag.color + '18', borderColor: tag.color + '40' },
                ]}
                onPress={() => toggleFlavor(tag.label)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tagLabel, on && { color: tag.color }]}>{tag.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ingredients */}
        <View style={styles.sectionHead}>
          <Text style={styles.label}>Ingredients</Text>
          <TouchableOpacity
            onPress={() => setIngredients((p) => [...p, { amount: '', unit: 'g', name: '' }])}
            hitSlop={8}
          >
            <Text style={styles.addLine}>+ Add ingredient</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.ingredientHint}>Amount · unit · ingredient name</Text>
        {ingredients.map((line, i) => (
          <View key={`ing-${i}`} style={styles.ingredientRowForm}>
            <View style={styles.reorderBtns}>
              <TouchableOpacity onPress={() => moveIngredient(i, i - 1)} disabled={i === 0} hitSlop={4}>
                <Ionicons name="chevron-up" size={16} color={i === 0 ? Colors.border : Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveIngredient(i, i + 1)}
                disabled={i === ingredients.length - 1}
                hitSlop={4}
              >
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={i === ingredients.length - 1 ? Colors.border : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
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
              maxLength={MAX_ING_NAME}
            />
            {ingredients.length > 1 && (
              <TouchableOpacity onPress={() => removeIngredient(i)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
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

        {/* Instructions */}
        <View style={styles.sectionHead}>
          <Text style={styles.label}>Instructions</Text>
          <TouchableOpacity onPress={() => setInstructions((p) => [...p, ''])} hitSlop={8}>
            <Text style={styles.addLine}>+ Add step</Text>
          </TouchableOpacity>
        </View>
        {instructions.map((line, i) => (
          <View key={`step-${i}`} style={styles.stepRow}>
            <View style={styles.reorderBtns}>
              <TouchableOpacity onPress={() => moveStep(i, i - 1)} disabled={i === 0} hitSlop={4}>
                <Ionicons name="chevron-up" size={16} color={i === 0 ? Colors.border : Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveStep(i, i + 1)}
                disabled={i === instructions.length - 1}
                hitSlop={4}
              >
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={i === instructions.length - 1 ? Colors.border : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{i + 1}</Text>
            </View>
            <View style={styles.stepInputWrap}>
              <TextInput
                style={[styles.input, styles.stepInput]}
                value={line}
                onChangeText={(t) => updateInstruction(i, t)}
                placeholder={`Step ${i + 1}`}
                placeholderTextColor={Colors.textTertiary}
                multiline
                maxLength={MAX_STEP}
              />
              <Text style={styles.stepCharCount}>{line.length}/{MAX_STEP}</Text>
            </View>
            {instructions.length > 1 && (
              <TouchableOpacity onPress={() => removeStep(i)} hitSlop={8} style={{ marginTop: 10 }}>
                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Source URL (for imported recipes) */}
        <Text style={styles.label}>Source URL (optional)</Text>
        <TextInput
          style={styles.input}
          value={sourceUrl}
          onChangeText={setSourceUrl}
          placeholder="Paste recipe URL if adapted from another source"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{editId ? 'Save changes' : 'Save recipe'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  photoBox: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E0E0E0' },
  photoPlaceholder: {
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoHint: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: '500', fontFamily: Fonts.bodyMedium },
  photoReq: { fontSize: FontSize.xs, color: Colors.textTertiary },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: { fontSize: FontSize.sm, fontWeight: '700', fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  charCounter: { fontSize: FontSize.xs, color: Colors.textTertiary },
  sublabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 4 },
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
  descInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.md },
  rowItem: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timeInput: { flex: 1 },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '12',
    marginBottom: Spacing.md,
  },
  unitToggleText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: FontSize.xl, fontWeight: '800', fontFamily: Fonts.bodyExtraBold, color: Colors.text, minWidth: 30, textAlign: 'center' },
  diffRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  diffChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  diffChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  diffText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary },
  diffTextActive: { color: Colors.primary },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagLabel: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addLine: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  ingredientHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.sm },
  ingredientRowForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reorderBtns: { alignItems: 'center', gap: 0 },
  amountInput: { width: 60, marginBottom: 0, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  unitSelect: {
    width: 80,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  unitSelectText: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.text },
  ingredientNameInput: { flex: 1, marginBottom: 0, paddingVertical: Spacing.sm },
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
    fontFamily: Fonts.bodyBold,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    color: Colors.text,
  },
  modalList: { maxHeight: 320 },
  modalRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalRowText: { fontSize: FontSize.md, color: Colors.text },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  stepBadgeText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700', fontFamily: Fonts.bodyBold },
  stepInputWrap: { flex: 1 },
  stepInput: { minHeight: 80, textAlignVertical: 'top' },
  stepCharCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', fontFamily: Fonts.bodyBold },
});

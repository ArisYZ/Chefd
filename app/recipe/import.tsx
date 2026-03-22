import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatIngredientLine } from '@/lib/ingredients';

interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  imageUrl: string;
  sourceName: string;
}

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const parts = host.split('.');
    return parts.length > 1 ? parts[parts.length - 2] : host;
  } catch {
    return 'web';
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ImportRecipeScreen() {
  const router = useRouter();
  const { addRecipe, recipes } = useRecipes();
  const { user, onUserCreatedRecipe } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    const existing = recipes.find((r) => r.sourceUrl === trimmed);
    if (existing) {
      Alert.alert(
        'Already imported',
        'This recipe already exists. View it or create your own version?',
        [
          { text: 'View', onPress: () => router.push(`/recipe/${existing.id}`) },
          { text: 'Create new', style: 'cancel' },
        ],
      );
      return;
    }

    setLoading(true);
    setError(null);
    setParsed(null);

    try {
      const resp = await fetch(trimmed);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
      let jsonLd: any = null;
      if (ldMatch) {
        for (const m of ldMatch) {
          try {
            const content = m.replace(/<script[^>]*>|<\/script>/gi, '');
            const obj = JSON.parse(content);
            const candidates = Array.isArray(obj) ? obj : [obj];
            for (const c of candidates) {
              if (c['@type'] === 'Recipe' || (Array.isArray(c['@type']) && c['@type'].includes('Recipe'))) {
                jsonLd = c;
                break;
              }
              if (c['@graph']) {
                const recipe = c['@graph'].find(
                  (g: any) => g['@type'] === 'Recipe' || (Array.isArray(g['@type']) && g['@type'].includes('Recipe')),
                );
                if (recipe) { jsonLd = recipe; break; }
              }
            }
            if (jsonLd) break;
          } catch { /* skip malformed JSON-LD */ }
        }
      }

      const title =
        jsonLd?.name ??
        (html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()) ??
        'Imported Recipe';

      const ingredients: string[] =
        jsonLd?.recipeIngredient ??
        [...(html.matchAll(/<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>(.*?)<\/li>/gi) ?? [])].map(
          (m) => m[1].replace(/<[^>]+>/g, '').trim(),
        );

      let instructions: string[] = [];
      if (jsonLd?.recipeInstructions) {
        if (typeof jsonLd.recipeInstructions === 'string') {
          instructions = jsonLd.recipeInstructions.split(/\n+/).filter(Boolean);
        } else if (Array.isArray(jsonLd.recipeInstructions)) {
          instructions = jsonLd.recipeInstructions.map((s: any) =>
            typeof s === 'string' ? s : s.text ?? '',
          ).filter(Boolean);
        }
      }

      const imageUrl =
        (typeof jsonLd?.image === 'string'
          ? jsonLd.image
          : Array.isArray(jsonLd?.image)
            ? jsonLd.image[0]
            : jsonLd?.image?.url) ??
        (html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1]) ??
        '';

      const sourceName = capitalize(extractDomain(trimmed));

      const result: ParsedRecipe = {
        title: title.slice(0, 100),
        ingredients: ingredients.map((i) => i.slice(0, 200)),
        instructions: instructions.map((i) => i.replace(/<[^>]+>/g, '').trim().slice(0, 300)),
        imageUrl,
        sourceName,
      };

      if (result.ingredients.length === 0 && result.instructions.length === 0) {
        setError("We couldn't parse this URL. Please enter recipe manually.");
      } else {
        setParsed(result);
      }
    } catch {
      setError("We couldn't parse this URL. Please check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    const id = addRecipe({
      name: parsed.title,
      cuisine: 'Other',
      category: 'General',
      tags: [],
      image: parsed.imageUrl || 'https://via.placeholder.com/400x300',
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      difficulty: 'Medium',
      ingredients: parsed.ingredients,
      ingredientsMeasured: parsed.ingredients.map((i) => ({ name: i })),
      instructions: parsed.instructions,
      sourceUrl: url.trim(),
      sourceName: parsed.sourceName,
    });
    if (user) await onUserCreatedRecipe();
    router.replace(`/recipe/${id}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.urlSection}>
        <Ionicons name="link-outline" size={24} color={Colors.primary} />
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="Paste recipe URL here (e.g., from AllRecipes, NYT Cooking)"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.parseBtn, (!url.trim() || loading) && styles.parseBtnDisabled]}
        onPress={handleParse}
        disabled={!url.trim() || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.parseBtnText}>Parse Recipe</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="warning-outline" size={20} color={Colors.heart} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {parsed && (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewSuccess}>
            We found {parsed.ingredients.length} ingredients and {parsed.instructions.length} steps
          </Text>

          <Text style={styles.previewLabel}>Title</Text>
          <Text style={styles.previewValue}>{parsed.title}</Text>

          {parsed.ingredients.length > 0 && (
            <>
              <Text style={styles.previewLabel}>
                Ingredients ({parsed.ingredients.length})
              </Text>
              {parsed.ingredients.slice(0, 5).map((ing, i) => (
                <Text key={i} style={styles.previewItem}>• {ing}</Text>
              ))}
              {parsed.ingredients.length > 5 && (
                <Text style={styles.previewMore}>
                  +{parsed.ingredients.length - 5} more...
                </Text>
              )}
            </>
          )}

          {parsed.instructions.length > 0 && (
            <>
              <Text style={styles.previewLabel}>
                Steps ({parsed.instructions.length})
              </Text>
              {parsed.instructions.slice(0, 3).map((step, i) => (
                <Text key={i} style={styles.previewItem} numberOfLines={2}>
                  {i + 1}. {step}
                </Text>
              ))}
              {parsed.instructions.length > 3 && (
                <Text style={styles.previewMore}>
                  +{parsed.instructions.length - 3} more steps...
                </Text>
              )}
            </>
          )}

          <Text style={styles.sourceAttrib}>
            Adapted from {parsed.sourceName}
          </Text>

          <TouchableOpacity style={styles.importBtn} onPress={handleImport} activeOpacity={0.8}>
            <Text style={styles.importBtnText}>Import & Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.manualLink}
        onPress={() => router.replace('/recipe/new')}
      >
        <Text style={styles.manualLinkText}>Or enter recipe manually</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xxl },
  urlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  urlInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  parseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  parseBtnDisabled: { opacity: 0.5 },
  parseBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.heart + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.heart + '30',
  },
  errorText: { flex: 1, fontSize: FontSize.sm, color: Colors.heart },
  previewSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  previewTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  previewSuccess: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  previewValue: { fontSize: FontSize.md, color: Colors.text },
  previewItem: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4, lineHeight: 20 },
  previewMore: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginTop: 4 },
  sourceAttrib: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  importBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  importBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  manualLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  manualLinkText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
});

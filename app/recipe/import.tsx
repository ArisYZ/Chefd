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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  extractImageFromHtml,
  extractPrepCookMinutes,
  pickRecipeImageUrl,
} from '@/lib/recipeImportExtract';
import { RemoteImage } from '@/components/RemoteImage';

interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  imageUrl: string;
  prepTime: number;
  cookTime: number;
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

/** URLs that list many recipes rarely expose a single Recipe JSON-LD block. */
function isLikelyCollectionOrTopicUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    return (
      /\/topics?\//i.test(p)
      || /\/collections?\//i.test(p)
      || /\/search/i.test(p)
      || /\/tags?\//i.test(p)
      || /\/recipes?\/$/i.test(p)
    );
  } catch {
    return false;
  }
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * recipeInstructions in JSON-LD can be a string, array, HowTo, HowToSection[], etc.
 */
function extractInstructionStrings(raw: unknown, depth = 0): string[] {
  if (raw == null || depth > 15) return [];
  if (typeof raw === 'string') {
    return raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string') out.push(item.trim());
      else if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        if (typeof o.text === 'string') out.push(String(o.text).trim());
        else
          out.push(
            ...extractInstructionStrings(o.itemListElement ?? o.step ?? o['@graph'], depth + 1),
          );
      }
    }
    return out.filter(Boolean);
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const t = o['@type'];
    const types = Array.isArray(t) ? t : t != null ? [t] : [];
    if (types.includes('HowTo') && o.step != null) {
      return extractInstructionStrings(o.step, depth + 1);
    }
    if (types.includes('HowToSection') || o.itemListElement != null) {
      return extractInstructionStrings(o.itemListElement, depth + 1);
    }
    if (typeof o.text === 'string') return [String(o.text).trim()];
  }
  return [];
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

    if (isLikelyCollectionOrTopicUrl(trimmed)) {
      setError(
        'This looks like a topic, search, or collection page — not one recipe. Open a single recipe, copy that page’s URL, then paste it here.',
      );
      setParsed(null);
      return;
    }

    setLoading(true);
    setError(null);
    setParsed(null);

    try {
      const resp = await fetch(trimmed, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': BROWSER_UA,
        },
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
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

      const rawIngredients = jsonLd?.recipeIngredient;
      let ingredients: string[] = [];
      if (Array.isArray(rawIngredients)) {
        ingredients = rawIngredients
          .map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'text' in (item as object)) {
              return String((item as { text?: string }).text ?? '');
            }
            return '';
          })
          .map((s) => s.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean);
      } else if (typeof rawIngredients === 'string') {
        ingredients = [rawIngredients.trim()].filter(Boolean);
      }
      if (ingredients.length === 0) {
        ingredients = [
          ...(html.matchAll(/<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>(.*?)<\/li>/gi) ?? []),
        ].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      }

      let instructions: string[] = extractInstructionStrings(jsonLd?.recipeInstructions);

      const { prepTime, cookTime } = extractPrepCookMinutes(jsonLd as Record<string, unknown>);

      const fromLd = pickRecipeImageUrl(jsonLd?.image, trimmed);
      const fromMeta = extractImageFromHtml(html, trimmed);
      const imageUrl = fromLd ?? fromMeta ?? '';

      const sourceName = capitalize(extractDomain(trimmed));

      const result: ParsedRecipe = {
        title: title.slice(0, 100),
        ingredients: ingredients.map((i) => i.slice(0, 200)),
        instructions: instructions.map((i) => i.replace(/<[^>]+>/g, '').trim().slice(0, 300)),
        imageUrl,
        prepTime,
        cookTime,
        sourceName,
      };

      if (result.ingredients.length === 0 && result.instructions.length === 0) {
        if (isLikelyCollectionOrTopicUrl(trimmed)) {
          setError(
            'This link looks like a topic or collection page, not a single recipe. Open one recipe from the list, copy that page’s URL, and try again — or enter the recipe manually.',
          );
        } else {
          setError(
            "We couldn't find recipe ingredients or steps on this page. Try a direct link to one article, or enter the recipe manually.",
          );
        }
      } else {
        setParsed(result);
      }
    } catch (e) {
      const failedFetch =
        e instanceof TypeError
        || (e instanceof Error && /network|failed to fetch|load failed/i.test(e.message));
      if (Platform.OS === 'web' && failedFetch) {
        setError(
          'Your browser blocked loading this page (common for recipe sites). Try again in the mobile app, or copy the recipe text and use “Enter recipe manually.”',
        );
      } else if (e instanceof Error && /^HTTP \d+$/.test(e.message)) {
        const code = e.message.replace(/^HTTP /, '');
        setError(
          `The page returned HTTP ${code}. It may require a login or block automated access. Try a direct recipe link or enter the recipe manually.`,
        );
      } else {
        setError("We couldn't load or parse this URL. Check your connection and try again, or enter the recipe manually.");
      }
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
      image: parsed.imageUrl?.trim() ?? '',
      prepTime: parsed.prepTime,
      cookTime: parsed.cookTime,
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
          placeholder="Paste a single recipe page URL (not a topic or search page)"
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

          <RemoteImage
            uri={parsed.imageUrl?.trim() ? parsed.imageUrl : ''}
            style={styles.previewImage}
            contentFit="cover"
          />

          <Text style={styles.previewLabel}>Title</Text>
          <Text style={styles.previewValue}>{parsed.title}</Text>

          <Text style={styles.previewLabel}>Time</Text>
          <Text style={styles.previewValue}>
            Prep {parsed.prepTime} min · Cook {parsed.cookTime} min
            {parsed.prepTime + parsed.cookTime > 0
              ? ` · Total ${parsed.prepTime + parsed.cookTime} min`
              : ''}
          </Text>

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
  container: { flex: 1, backgroundColor: Colors.appCanvas },
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
  parseBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', fontFamily: Fonts.bodyBold },
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
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  previewTitle: { fontSize: FontSize.lg, fontWeight: '700', fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  previewSuccess: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  previewValue: { fontSize: FontSize.md, color: Colors.text },
  previewItem: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4, lineHeight: 20 },
  previewMore: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', fontFamily: Fonts.bodySemiBold, marginTop: 4 },
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
  importBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', fontFamily: Fonts.bodyBold },
  manualLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  manualLinkText: { fontSize: FontSize.sm, fontWeight: '600', fontFamily: Fonts.bodySemiBold, color: Colors.primary },
});

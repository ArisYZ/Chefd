import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Fonts } from '@/constants/Colors';
import type { StoredUser } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { listUsersByRank } from '@/database/db';
import { fetchAsiOneChatCompletion, getAsiOneApiKey, type AsiChatMessage } from '@/lib/asiOne';
import {
  buildChefAiDataBlock,
  buildChefAiProfilesBlock,
  CHEF_AI_SYSTEM_PROMPT,
} from '@/lib/aiRecipeContext';

const MAX_THREAD_MESSAGES = 16;
/** Persisted history cap (UI + storage); API requests still slice to MAX_THREAD_MESSAGES. */
const MAX_STORED_MESSAGES = 120;
const REMY_RAT_CHAT_STORAGE_KEY = '@chefd_remy_rat_chat';

function remyRatChatStorageKey(userId: string | null): string {
  return userId ? `${REMY_RAT_CHAT_STORAGE_KEY}_${userId}` : `${REMY_RAT_CHAT_STORAGE_KEY}_anonymous`;
}

function parseStoredChatRows(raw: unknown): ChatRow[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatRow[] = [];
  for (const row of raw) {
    if (
      row &&
      typeof row === 'object' &&
      typeof (row as ChatRow).id === 'string' &&
      ((row as ChatRow).role === 'user' || (row as ChatRow).role === 'assistant') &&
      typeof (row as ChatRow).content === 'string'
    ) {
      out.push(row as ChatRow);
    }
  }
  return out;
}

export const REMY_RAT_TAGLINE = 'A Fetch AI Cooking Assistant';

export const CHEF_AI_SUGGEST_PROMPT =
  'Suggest several recipes I should try next from my not-yet-rated list. If it fits, recommend cooks to follow from NOTABLE_CREATORS (strong average encore). Use [[recipe:RECIPE_ID]] and [[profile:USER_ID]] for links.';

type ChatRow = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type RichSegment =
  | { type: 'text'; value: string }
  | { type: 'recipe'; value: string }
  | { type: 'profile'; value: string };

/**
 * Matches [[recipe:id]] / [[profile:id]] with optional spaces (models often emit [[ recipe:r1 ]]).
 */
function parseRichContent(content: string): RichSegment[] {
  const re = /\[\[\s*(recipe|profile)\s*:\s*([^\]]+?)\s*\]\]/gi;
  const out: RichSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) out.push({ type: 'text', value: content.slice(last, m.index) });
    const rawKind = (m[1] ?? '').toLowerCase();
    const kind = rawKind === 'profile' ? 'profile' : 'recipe';
    const id = (m[2] ?? '').trim();
    if (id.length > 0) {
      out.push({ type: kind, value: id });
    }
    last = m.index + m[0].length;
  }
  if (last < content.length) out.push({ type: 'text', value: content.slice(last) });
  return out;
}

/** Markdown-style **bold**: odd-index segments after splitting on `**` are emphasized. */
function splitBoldRuns(text: string): { bold: boolean; text: string }[] {
  if (!text.includes('**')) return [{ bold: false, text }];
  const parts = text.split('**');
  return parts.map((t, i) => ({ bold: i % 2 === 1, text: t }));
}

function MessageBody({
  content,
  getRecipeName,
  getProfileLabel,
  onRecipePress,
  onProfilePress,
  isUser,
}: {
  content: string;
  getRecipeName: (id: string) => string | undefined;
  getProfileLabel: (id: string) => string | undefined;
  onRecipePress: (id: string) => void;
  onProfilePress: (id: string) => void;
  isUser: boolean;
}) {
  const segments = useMemo(() => parseRichContent(content), [content]);

  if (segments.length === 0) {
    return (
      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
        {splitBoldRuns(content).map((run, j) => (
          <Text
            key={j}
            style={run.bold ? [styles.textBold, isUser && styles.textBoldUser] : undefined}
          >
            {run.text}
          </Text>
        ))}
      </Text>
    );
  }

  return (
    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
      {segments.map((s, i) => {
        if (s.type === 'text') {
          const runs = splitBoldRuns(s.value);
          return (
            <Text key={i}>
              {runs.map((run, j) => (
                <Text
                  key={`${i}-${j}`}
                  style={run.bold ? [styles.textBold, isUser && styles.textBoldUser] : undefined}
                >
                  {run.text}
                </Text>
              ))}
            </Text>
          );
        }
        if (s.type === 'recipe') {
          return (
            <Text
              key={i}
              style={[styles.recipeLink, isUser && styles.recipeLinkUser]}
              onPress={() => onRecipePress(s.value)}
              accessibilityRole="link"
            >
              {getRecipeName(s.value) ?? s.value}
            </Text>
          );
        }
        return (
          <Text
            key={i}
            style={[styles.profileLink, isUser && styles.profileLinkUser]}
            onPress={() => onProfilePress(s.value)}
            accessibilityRole="link"
          >
            {getProfileLabel(s.value) ?? `@${s.value.slice(0, 8)}…`}
          </Text>
        );
      })}
    </Text>
  );
}

export type ChefAiChatProps = {
  /** When true, show top bar with close (for modal). */
  embedded?: boolean;
  onClose?: () => void;
};

export function ChefAiChat({ embedded = false, onClose }: ChefAiChatProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { recipes, getRecipeById, getReviewsForRecipe } = useRecipes();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notableUsers, setNotableUsers] = useState<StoredUser[]>([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const hasKey = getAsiOneApiKey() != null;

  useEffect(() => {
    let cancelled = false;
    setStorageHydrated(false);
    const key = remyRatChatStorageKey(user?.id ?? null);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          setMessages(parseStoredChatRows(parsed).slice(-MAX_STORED_MESSAGES));
        } else {
          setMessages([]);
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setStorageHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!storageHydrated) return;
    const key = remyRatChatStorageKey(user?.id ?? null);
    const toSave = messages.slice(-MAX_STORED_MESSAGES);
    const t = setTimeout(() => {
      void AsyncStorage.setItem(key, JSON.stringify(toSave)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [messages, user?.id, storageHydrated]);

  useEffect(() => {
    let cancelled = false;
    listUsersByRank(120)
      .then((rows) => {
        if (!cancelled) setNotableUsers(rows);
      })
      .catch(() => {
        if (!cancelled) setNotableUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const profileLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of notableUsers) {
      const label = u.displayName?.trim() ? `${u.displayName} (@${u.username})` : `@${u.username}`;
      m.set(u.id, label);
    }
    return m;
  }, [notableUsers]);

  const systemBlock = useMemo(
    () =>
      `${CHEF_AI_SYSTEM_PROMPT}\n\n${buildChefAiDataBlock({
        userId: user?.id ?? null,
        recipes,
        getReviewsForRecipe,
      })}\n\n${buildChefAiProfilesBlock(notableUsers, user?.id ?? null)}`,
    [user?.id, recipes, getReviewsForRecipe, notableUsers],
  );

  const runCompletion = useCallback(
    async (thread: ChatRow[]) => {
      if (!hasKey) {
        Alert.alert(
          'API key',
          'Add secrets/asi-one.key with your ASI:One key (gitignored), or set EXPO_PUBLIC_ASI_ONE_API_KEY, then restart Expo.',
        );
        return;
      }

      const sliced = thread.slice(-MAX_THREAD_MESSAGES);
      const apiMessages: AsiChatMessage[] = [
        { role: 'system', content: systemBlock },
        ...sliced.map(({ role, content }) => ({ role, content })),
      ];

      setLoading(true);
      try {
        const reply = await fetchAsiOneChatCompletion(apiMessages);
        setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: reply }]);
      } catch (e) {
        Alert.alert('Remy Rat', e instanceof Error ? e.message : 'Request failed.');
      } finally {
        setLoading(false);
      }
    },
    [hasKey, systemBlock],
  );

  const onSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatRow = { id: newId(), role: 'user', content: text };
    setInput('');
    setMessages((prev) => {
      const next = [...prev, userMsg];
      void runCompletion(next);
      return next;
    });
  }, [input, loading, runCompletion]);

  const onSuggest = useCallback(() => {
    if (loading) return;
    const userMsg: ChatRow = { id: newId(), role: 'user', content: CHEF_AI_SUGGEST_PROMPT };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      void runCompletion(next);
      return next;
    });
  }, [loading, runCompletion]);

  const getRecipeName = useCallback((id: string) => getRecipeById(id)?.name, [getRecipeById]);

  const getProfileLabel = useCallback(
    (id: string) => profileLabelById.get(id),
    [profileLabelById],
  );

  const goRecipe = useCallback(
    (id: string) => {
      if (embedded) onClose?.();
      router.push(`/recipe/${id}`);
    },
    [router, embedded, onClose],
  );

  const goProfile = useCallback(
    (id: string) => {
      if (embedded) onClose?.();
      router.push(`/user/${id}`);
    },
    [router, embedded, onClose],
  );

  const clearChatNow = useCallback(async () => {
    setInput('');
    setLoading(false);
    setMessages([]);
    try {
      await AsyncStorage.removeItem(remyRatChatStorageKey(user?.id ?? null));
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  const confirmClearChat = useCallback(() => {
    if (messages.length === 0) return;
    Alert.alert(
      'Clear chat?',
      'Remove all messages with Remy Rat on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => void clearChatNow() },
      ],
    );
  }, [messages.length, clearChatNow]);

  useLayoutEffect(() => {
    if (embedded) return;
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerTitle: () => (
        <View style={styles.navHeaderTitleBlock}>
          <Text style={styles.navHeaderTitle}>Remy Rat</Text>
          <Text style={styles.navHeaderSubtitle}>{REMY_RAT_TAGLINE}</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={confirmClearChat}
          disabled={messages.length === 0}
          style={[styles.headerClearBtn, messages.length === 0 && styles.headerClearBtnDisabled]}
          accessibilityLabel="Clear chat"
          accessibilityState={{ disabled: messages.length === 0 }}
        >
          <Text style={styles.headerClearText}>Clear</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, embedded, confirmClearChat, messages.length]);

  const canClearChat = messages.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={embedded ? ['top', 'bottom'] : ['bottom']}>
      {embedded ? (
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTitleBlock}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              Remy Rat
            </Text>
            <Text style={styles.modalSubtitle}>{REMY_RAT_TAGLINE}</Text>
          </View>
          <View style={styles.modalHeaderActions}>
            <TouchableOpacity
              onPress={confirmClearChat}
              disabled={!canClearChat}
              style={[styles.modalClearBtn, !canClearChat && styles.modalClearBtnDisabled]}
              accessibilityLabel="Clear chat"
              accessibilityState={{ disabled: !canClearChat }}
            >
              <Text style={styles.modalClearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close Remy Rat"
            >
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (embedded ? 0 : 88) : 0}
      >
        {!hasKey ? (
          <View style={styles.banner}>
            <Ionicons name="key-outline" size={18} color={Colors.primaryDark} />
            <Text style={styles.bannerText}>
              Add secrets/asi-one.key with your API key (gitignored), or set EXPO_PUBLIC_ASI_ONE_API_KEY,
              then restart the dev server.
            </Text>
          </View>
        ) : null}

        {!user ? (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>Sign in to load recipes you have rated.</Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Remy Rat</Text>
              <Text style={styles.emptySubtitle}>{REMY_RAT_TAGLINE}</Text>
              <Text style={styles.emptyBody}>
                Ask cooking questions, get recipe ideas from what you have rated, or discover top cooks.
              </Text>
              <TouchableOpacity
                style={[styles.suggestBtn, (!hasKey || loading) && styles.suggestBtnDisabled]}
                onPress={onSuggest}
                disabled={!hasKey || loading}
                activeOpacity={0.85}
              >
                <Ionicons name="restaurant-outline" size={20} color={Colors.white} />
                <Text style={styles.suggestBtnText}>Suggest recipes for me</Text>
              </TouchableOpacity>
            </View>
          ) : (
            messages.map((m) => (
              <View
                key={m.id}
                style={[styles.row, m.role === 'user' ? styles.rowUser : styles.rowAssistant]}
              >
                <View
                  style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
                >
                  <MessageBody
                    content={m.content}
                    getRecipeName={getRecipeName}
                    getProfileLabel={getProfileLabel}
                    onRecipePress={goRecipe}
                    onProfilePress={goProfile}
                    isUser={m.role === 'user'}
                  />
                </View>
              </View>
            ))
          )}
          {loading ? (
            <View style={styles.thinking}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.thinkingText}>Thinking…</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TouchableOpacity
            style={[styles.iconSuggest, loading && styles.iconSuggestDisabled]}
            onPress={onSuggest}
            disabled={!hasKey || loading}
            accessibilityLabel="Suggest recipes"
          >
            <Ionicons name="sparkles" size={22} color={hasKey && !loading ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask a question…"
            placeholderTextColor={Colors.textTertiary}
            value={input}
            onChangeText={setInput}
            editable={!loading}
            multiline
            maxLength={2000}
            onSubmitEditing={onSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={!input.trim() || loading}
            accessibilityLabel="Send"
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.appCanvas,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  modalHeaderTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: Fonts.heading,
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.body,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  navHeaderTitleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navHeaderTitle: {
    fontSize: FontSize.lg,
    fontFamily: Fonts.heading,
    color: Colors.text,
  },
  navHeaderSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalClearBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  modalClearBtnDisabled: {
    opacity: 0.35,
  },
  modalClearText: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
  },
  headerClearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
  },
  headerClearBtnDisabled: {
    opacity: 0.35,
  },
  headerClearText: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
  },
  flex: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  hintBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  hintText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.body,
    color: Colors.textTertiary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontSize: FontSize.xl,
    fontFamily: Fonts.heading,
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: FontSize.md,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  suggestBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  suggestBtnDisabled: {
    opacity: 0.45,
  },
  suggestBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontFamily: Fonts.bodySemiBold,
  },
  row: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '92%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.sm,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  bubbleText: {
    fontSize: FontSize.md,
    fontFamily: Fonts.body,
    color: Colors.text,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: Colors.white,
  },
  textBold: {
    fontFamily: Fonts.bodyBold,
  },
  textBoldUser: {
    fontFamily: Fonts.bodyBold,
    color: Colors.white,
  },
  recipeLink: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primaryLight,
    textDecorationLine: 'underline',
  },
  recipeLinkUser: {
    color: Colors.accentLight,
  },
  profileLink: {
    fontSize: FontSize.md,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  profileLinkUser: {
    color: Colors.accentLight,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  thinkingText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.body,
    color: Colors.textTertiary,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  iconSuggest: {
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  iconSuggestDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: FontSize.md,
    fontFamily: Fonts.body,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
});

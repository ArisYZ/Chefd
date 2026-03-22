import Constants from 'expo-constants';

export type AsiChatRole = 'system' | 'user' | 'assistant';

export type AsiChatMessage = {
  role: AsiChatRole;
  content: string;
};

/**
 * Reads from `expo.extra.asiOneApiKey` (injected from gitignored `secrets/asi-one.key` via app.config.js),
 * then `EXPO_PUBLIC_ASI_ONE_API_KEY` as a fallback.
 * @see https://docs.asi1.ai/documentation/getting-started/quickstart
 */
export function getAsiOneApiKey(): string | null {
  const extra = Constants.expoConfig?.extra as { asiOneApiKey?: string } | undefined;
  const fromEnv =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_ASI_ONE_API_KEY : undefined;
  const raw = (extra?.asiOneApiKey ?? fromEnv ?? '').trim();
  return raw.length > 0 ? raw : null;
}

export async function fetchAsiOneChatCompletion(
  messages: AsiChatMessage[],
  options?: { model?: string; signal?: AbortSignal },
): Promise<string> {
  const apiKey = getAsiOneApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing ASI:One API key. Add secrets/asi-one.key (see repo) or set EXPO_PUBLIC_ASI_ONE_API_KEY.',
    );
  }

  const res = await fetch('https://api.asi1.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model ?? 'asi1',
      messages,
    }),
    signal: options?.signal,
  });

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? `ASI:One request failed (${res.status})`);
  }

  const text = json.choices?.[0]?.message?.content;
  if (text == null || String(text).trim() === '') {
    throw new Error('ASI:One returned an empty reply.');
  }

  return String(text);
}

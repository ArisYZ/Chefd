import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { parseJwtPayload } from '@/lib/jwt';

WebBrowser.maybeCompleteAuthSession();

function readGoogleExtra() {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return {
    webClientId: extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: extra?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  };
}

export function googleOAuthConfigured(): boolean {
  const c = readGoogleExtra();
  return Boolean(c.webClientId || c.iosClientId || c.androidClientId);
}

type Props = {
  busy: boolean;
  onIdToken: (token: string) => void;
};

export function GoogleAuthSection({ busy, onIdToken }: Props) {
  const { webClientId, iosClientId, androidClientId } = readGoogleExtra();
  const fallbackWeb = webClientId || iosClientId || androidClientId || '';
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: fallbackWeb,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken || typeof idToken !== 'string') {
      Alert.alert('Google', 'No ID token returned.');
      return;
    }
    onIdToken(idToken);
  }, [response, onIdToken]);

  return (
    <TouchableOpacity
      style={[styles.googleBtn, (!request || busy) && styles.disabled]}
      onPress={() => promptAsync()}
      disabled={!request || busy}
    >
      <Ionicons name="logo-google" size={22} color={Colors.text} />
      <Text style={styles.googleBtnText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  googleBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  disabled: { opacity: 0.6 },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { GoogleAuthSection, googleOAuthConfigured } from '@/components/GoogleAuthSection';
import { parseJwtPayload } from '@/lib/jwt';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const { ready, user, signIn, signUp, completeGoogleSignIn } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const hasGoogle = googleOAuthConfigured();

  useEffect(() => {
    if (ready && user) {
      router.replace('/(tabs)' as any);
    }
  }, [ready, user, router]);

  const onGoogleIdToken = useCallback(
    async (idToken: string) => {
      const payload = parseJwtPayload<{
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      }>(idToken);
      if (!payload?.sub || !payload?.email) {
        Alert.alert('Google', 'Could not read profile from token.');
        return;
      }
      setBusy(true);
      try {
        const res = await completeGoogleSignIn({
          idToken,
          sub: payload.sub,
          email: payload.email,
          name: (payload.name as string) || payload.email.split('@')[0],
          picture: payload.picture as string | undefined,
        });
        if (!res.ok) Alert.alert('Google sign-in', res.message);
        else router.replace('/(tabs)' as any);
      } finally {
        setBusy(false);
      }
    },
    [completeGoogleSignIn, router],
  );

  const onEmailAuth = async () => {
    setBusy(true);
    try {
      if (mode === 'signin') {
        const res = await signIn(username.trim() || email.trim(), password);
        if (!res.ok) Alert.alert('Sign in', res.message);
        else router.replace('/(tabs)' as any);
      } else {
        const res = await signUp(username.trim(), displayName.trim(), email.trim(), password);
        if (!res.ok) Alert.alert('Sign up', res.message);
        else router.replace('/(tabs)' as any);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.logo}>chef'd</Text>
          <Text style={styles.tagline}>Rank recipes. Cook better.</Text>

          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'signin' && styles.segmentActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'signup' && styles.segmentActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="chef_jamie"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jamie"
                placeholderTextColor={Colors.textTertiary}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </>
          )}

          {mode === 'signin' ? (
            <>
              <Text style={styles.label}>Username or email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={username}
                onChangeText={setUsername}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.disabled]}
            onPress={onEmailAuth}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Log in' : 'Create account'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {hasGoogle ? (
            <GoogleAuthSection busy={busy} onIdToken={onGoogleIdToken} />
          ) : (
            <View style={styles.googleInfoBox}>
              <Ionicons name="logo-google" size={22} color={Colors.textTertiary} style={styles.googleInfoIcon} />
              <Text style={styles.googleInfoTitle}>Google Sign-In not configured</Text>
              <Text style={styles.googleInfoBody}>
                Add OAuth client IDs from Google Cloud Console to app.json → expo.extra (googleWebClientId, etc.)
                or set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in a .env file. Restart Metro after changing.
              </Text>
              <Text style={styles.googleInfoBody}>
                You can still use email & password above — no Google setup required.
              </Text>
              <Text style={styles.googleInfoLink}>See docs/GOOGLE_SIGNIN.md in the project for step-by-step setup.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  logo: {
    fontSize: FontSize.display,
    fontWeight: '800',
    color: Colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  segmentActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  disabled: { opacity: 0.6 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  googleInfoBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  googleInfoIcon: {
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  googleInfoTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  googleInfoBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  googleInfoLink: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
});

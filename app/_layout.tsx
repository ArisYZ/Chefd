import { useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, GildaDisplay_400Regular } from '@expo-google-fonts/gilda-display';
import {
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';
import { SocialProvider } from '@/contexts/SocialContext';
import { FollowProvider } from '@/contexts/FollowContext';
import { AppBackground } from '@/components/AppBackground';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GildaDisplay_400Regular,
    HankenGrotesk_300Light,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  const onLayoutReady = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Platform.OS === 'web' ? 'transparent' : Colors.background,
      }}
      onLayout={onLayoutReady}
    >
      {Platform.OS === 'web' && (
        <>
          <AppBackground />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { zIndex: 1, backgroundColor: 'rgba(248, 248, 246, 0.76)' },
            ]}
          />
        </>
      )}
      <View style={{ flex: 1, zIndex: Platform.OS === 'web' ? 2 : 0 }}>
    <AuthProvider>
    <FollowProvider>
    <RecipeProvider>
    <BookmarkProvider>
    <SocialProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.appCanvas },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="recipe/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="list/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="recipe/new"
          options={{
            headerShown: true,
            title: 'New Recipe',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="saved"
          options={{
            headerShown: true,
            title: 'Saved Recipes',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Settings',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            title: 'Edit Profile',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="category/[slug]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="recipe/import"
          options={{
            headerShown: true,
            title: 'Import Recipe',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="profile/my-recipes"
          options={{
            headerShown: true,
            title: 'My recipes',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="profile/bookmarks"
          options={{
            headerShown: true,
            title: 'Bookmarks',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="profile/follow-list"
          options={{
            headerShown: true,
            title: 'Followers',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
            presentation: 'card',
          }}
        />
      </Stack>
    </SocialProvider>
    </BookmarkProvider>
    </RecipeProvider>
    </FollowProvider>
    </AuthProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

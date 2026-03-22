import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';
import { SocialProvider } from '@/contexts/SocialContext';

export default function RootLayout() {
  return (
    <AuthProvider>
    <RecipeProvider>
    <BookmarkProvider>
    <SocialProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
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
      </Stack>
    </SocialProvider>
    </BookmarkProvider>
    </RecipeProvider>
    </AuthProvider>
  );
}

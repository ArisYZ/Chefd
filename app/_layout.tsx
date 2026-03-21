import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
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
      </Stack>
    </>
  );
}

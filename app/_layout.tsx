import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  // Created once per app instance, not per render.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    },
  }));

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
            <Stack.Screen name="post/new" options={{ title: 'New Post', presentation: 'modal' }} />
            <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
            <Stack.Screen name="recipe/new" options={{ title: 'New Recipe', presentation: 'modal' }} />
            <Stack.Screen name="user/[id]" options={{ title: 'Profile' }} />
            <Stack.Screen name="collection/[id]" options={{ title: 'Collection' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

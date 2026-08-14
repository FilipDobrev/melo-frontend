import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { colors } from '../src/theme/theme';
import { useAppFonts } from '../src/theme/fonts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Mounted inside AuthProvider so it can read the session for the redirect. */
function RootNavigator() {
  const { session } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (session.status === 'signedOut' && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session.status === 'signedIn' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session.status, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }} />
  );
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppGate fontsLoaded={fontsLoaded} />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Waits on fonts and the session together before mounting the router. */
function AppGate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session } = useAuth();
  if (!fontsLoaded || session.status === 'loading') return null;

  return (
    <>
      <RootNavigator />
      <StatusBar style="dark" />
    </>
  );
}

import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { LoadingState } from '../../src/components/EmptyState';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }
  if (user) {
    return <Redirect href="/(tabs)/feed" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

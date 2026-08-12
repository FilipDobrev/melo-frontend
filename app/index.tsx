import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { LoadingState } from '../src/components/EmptyState';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  return <Redirect href={user ? '/(tabs)/feed' : '/(auth)/login'} />;
}

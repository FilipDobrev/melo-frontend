import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { LoadingState } from '../../src/components/EmptyState';

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#B5541A' }}>
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed', tabBarIcon: () => <TabIcon symbol="🍽️" /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: () => <TabIcon symbol="🔎" /> }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{ title: 'Cookbook', tabBarIcon: () => <TabIcon symbol="📖" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <TabIcon symbol="👤" /> }}
      />
    </Tabs>
  );
}

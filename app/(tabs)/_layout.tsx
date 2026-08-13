import { Redirect, Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { LoadingState } from '../../src/components/EmptyState';

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

// Raised circular action button that sits in the centre of the tab row.
// It is registered as a real Tabs.Screen (so the router lays it out in the
// middle of the bar), but its tabBarButton is replaced entirely and its
// tabPress is intercepted, so tapping it starts the posting flow instead of
// switching to a "post" tab.
function PostTabButton() {
  const router = useRouter();
  return (
    <View style={styles.postButtonSlot} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.postButton}
        onPress={() => router.push('/post/pick')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Post a recipe"
      >
        <Text style={styles.postButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
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
        name="post"
        options={{ title: '', tabBarButton: () => <PostTabButton /> }}
        listeners={{
          tabPress: (e) => {
            // Never switch to the placeholder "post" tab itself.
            e.preventDefault();
          },
        }}
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

const styles = StyleSheet.create({
  postButtonSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -18,
    backgroundColor: '#B5541A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFBF5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  postButtonText: {
    fontSize: 26,
    lineHeight: 26,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

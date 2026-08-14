import { Feather } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentUser } from '../../src/auth/AuthContext';
import { Avatar } from '../../src/ui/Avatar';
import { Sheet } from '../../src/ui/Sheet';
import { Text } from '../../src/ui/Text';
import { colors, space } from '../../src/theme/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const currentUser = useCurrentUser();

  function openScreen(pathname: '/recipe/new' | '/compose') {
    setCreateOpen(false);
    router.push(pathname);
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            borderTopWidth: 1,
            height: 56 + insets.bottom,
            paddingTop: space.sm,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="discover"
          options={{ tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ color, size }) => <Feather name="plus-square" color={color} size={size} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setCreateOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="cookbook"
          options={{ tabBarIcon: ({ color, size }) => <Feather name="bookmark" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <Avatar uri={currentUser?.profileImage} username={currentUser?.username ?? '?'} size={26} ring={focused} />
            ),
          }}
        />
      </Tabs>

      <Sheet visible={isCreateOpen} onClose={() => setCreateOpen(false)} heightRatio={0.32}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Write a recipe"
          style={styles.row}
          onPress={() => openScreen('/recipe/new')}
        >
          <Feather name="book-open" size={22} color={colors.text} />
          <View style={styles.rowText}>
            <Text variant="strong">Write a recipe</Text>
            <Text variant="bodySm" color="textMuted">
              Ingredients, steps, the numbers.
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a cook"
          style={styles.row}
          onPress={() => openScreen('/compose')}
        >
          <Feather name="camera" size={22} color={colors.text} />
          <View style={styles.rowText}>
            <Text variant="strong">Post a cook</Text>
            <Text variant="bodySm" color="textMuted">
              Show what you made.
            </Text>
          </View>
        </Pressable>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  rowText: {
    flex: 1,
  },
});

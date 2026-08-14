import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PublicUser, UserSummary } from '../../api/schemas';
import { Avatar } from '../../ui/Avatar';
import { Text } from '../../ui/Text';
import { space } from '../../theme/theme';

interface UserRowProps {
  user: UserSummary | PublicUser;
  right?: React.ReactNode;
  onPress?: () => void;
}

export function UserRow({ user, right, onPress }: UserRowProps) {
  const handlePress =
    onPress ?? (() => router.push({ pathname: '/user/[id]', params: { id: user.id } }));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={user.username}
      style={styles.row}
    >
      <Avatar uri={user.profileImage} username={user.username} size={44} />
      <Text variant="strong" style={styles.username}>
        {user.username}
      </Text>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  username: {
    flex: 1,
  },
});

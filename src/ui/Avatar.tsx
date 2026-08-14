import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';
import { Text } from './Text';

interface AvatarProps {
  uri: string | null | undefined;
  username: string;
  size?: number;
  ring?: boolean;
}

export function Avatar({ uri, username, size = 36, ring = false }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };
  const borderStyle = ring
    ? { borderWidth: 2, borderColor: colors.accent }
    : { borderWidth: 1, borderColor: colors.line };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        contentFit="cover"
        transition={150}
        accessible={false}
        style={[styles.base, dimensionStyle, borderStyle, { backgroundColor: colors.slab }]}
      />
    );
  }

  return (
    <View
      accessible={false}
      style={[styles.base, styles.fallback, dimensionStyle, borderStyle]}
    >
      <Text variant="displaySm" color="textMuted" style={{ fontSize: size * 0.42 }}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.slab,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

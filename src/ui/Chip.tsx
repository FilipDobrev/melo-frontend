import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected = false, onPress, size = 'md' }: ChipProps) {
  const content = (
    <Text
      variant={size === 'sm' ? 'bodySm' : 'body'}
      color={selected ? 'textInverse' : 'deep'}
    >
      {label}
    </Text>
  );

  const containerStyle = [
    styles.base,
    sizeStyles[size],
    selected ? styles.selected : styles.unselected,
  ];

  if (!onPress) {
    return (
      <View accessibilityRole="text" style={containerStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={containerStyle}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  selected: {
    backgroundColor: colors.deep,
  },
  unselected: {
    backgroundColor: colors.deepTint,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: 6,
    paddingHorizontal: space.md,
  },
  md: {
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
});

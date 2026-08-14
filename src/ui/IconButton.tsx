import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, HIT_SLOP, radius } from '../theme/theme';

interface IconButtonProps {
  name: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
  size?: number;
  color?: keyof typeof colors;
  disabled?: boolean;
}

export function IconButton({
  name,
  onPress,
  label,
  size = 22,
  color = 'text',
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.touchArea,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Feather name={name} size={size} color={colors[color]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  pressed: {
    backgroundColor: colors.slab,
  },
  disabled: {
    opacity: 0.4,
  },
});

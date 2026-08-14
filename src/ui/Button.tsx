import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  stretch?: boolean;
}

const LABEL_COLOR: Record<Variant, keyof typeof colors> = {
  primary: 'text',
  secondary: 'text',
  ghost: 'text',
  danger: 'danger',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  stretch = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const labelColor = LABEL_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && !isDisabled && pressedStyles[variant],
        stretch && styles.stretch,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[labelColor]} />
      ) : (
        <View style={styles.content}>
          {icon && <Feather name={icon} size={16} color={colors[labelColor]} />}
          <Text variant="strong" color={labelColor}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
});

const sizeStyles = StyleSheet.create({
  md: {
    height: 44,
    paddingHorizontal: space.lg,
  },
  lg: {
    height: 52,
    paddingHorizontal: space.xl,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.dangerTint,
  },
});

const pressedStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accentPressed,
  },
  secondary: {
    backgroundColor: colors.slab,
  },
  ghost: {
    backgroundColor: colors.slab,
  },
  // Deeper than dangerTint without inventing a new hex: same danger colour, low opacity.
  danger: {
    backgroundColor: `${colors.danger}26`,
  },
});

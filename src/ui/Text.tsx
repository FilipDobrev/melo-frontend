import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import { colors, type } from '../theme/theme';

type Variant = keyof typeof type;
type ColorName = keyof typeof colors;
type MonoVariant = 'readoutXl' | 'readoutLg' | 'readout' | 'readoutSm';

const variantStyles = StyleSheet.create(
  Object.fromEntries(
    Object.entries(type).map(([name, style]) => [name, style as TextStyle]),
  ) as Record<Variant, TextStyle>,
);

interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: Variant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'text',
  align,
  style,
  children,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[variantStyles[variant], { color: colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

interface ReadoutProps extends Omit<RNTextProps, 'style'> {
  variant?: MonoVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

/** For numbers only: forces a mono readout variant with non-jittering digits. */
export function Readout({ variant = 'readout', color, style, ...rest }: ReadoutProps) {
  return <Text variant={variant} color={color} style={[tabularNums, style]} {...rest} />;
}

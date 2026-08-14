import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, space, type } from '../theme/theme';
import { Text } from './Text';

interface FieldProps extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  rightSlot?: React.ReactNode;
}

export function Field({
  label,
  value,
  onChangeText,
  error,
  hint,
  multiline = false,
  rightSlot,
  ...rest
}: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? colors.danger : isFocused ? colors.accent : colors.line;

  return (
    <View>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <View style={styles.gap} />
      <View style={[styles.inputRow, multiline && styles.multilineRow, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={label}
          style={[type.body, styles.input, multiline && styles.multilineInput]}
          {...rest}
        />
        {rightSlot}
      </View>
      {error ? (
        <Text variant="bodySm" color="danger" style={styles.footer}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="bodySm" color="textMuted" style={styles.footer}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: space.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    minHeight: 46,
  },
  multilineRow: {
    minHeight: 110,
    alignItems: 'flex-start',
    paddingVertical: space.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 94,
  },
  footer: {
    marginTop: space.xs,
  },
});

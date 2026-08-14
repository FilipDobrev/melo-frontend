import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Readout, Text } from '../../ui/Text';
import { colors, cookColors, HIT_SLOP, radius, space } from '../../theme/theme';
import { formatQuantity } from '../../lib/format';
import type { Unit } from '../../api/schemas';

interface IngredientRowProps {
  name: string;
  quantity: number;
  unit: Unit;
  checked?: boolean;
  onToggle?: () => void;
  dark?: boolean;
}

interface Palette {
  text: string;
  textMuted: string;
  line: string;
  accent: string;
}

const LIGHT_PALETTE: Palette = {
  text: colors.text,
  textMuted: colors.textMuted,
  line: colors.line,
  accent: colors.accent,
};

const DARK_PALETTE: Palette = {
  text: cookColors.text,
  textMuted: cookColors.textMuted,
  line: cookColors.line,
  accent: cookColors.accent,
};

/** The signature dotted leader: name ······· quantity, on the text baseline. */
export function IngredientRow({ name, quantity, unit, checked, onToggle, dark }: IngredientRowProps) {
  const palette = dark ? DARK_PALETTE : LIGHT_PALETTE;
  const isChecked = checked ?? false;

  const row = (
    <View style={styles.row}>
      {onToggle && (
        <View
          style={[
            styles.checkbox,
            { borderColor: isChecked ? palette.accent : palette.line },
            isChecked && { backgroundColor: palette.accent },
          ]}
        >
          {isChecked && <Feather name="check" size={14} color={dark ? cookColors.ground : colors.ground} />}
        </View>
      )}
      <Text
        variant="body"
        numberOfLines={1}
        style={[
          styles.name,
          { color: isChecked ? palette.textMuted : palette.text },
          isChecked && styles.strikethrough,
        ]}
      >
        {name}
      </Text>
      <View style={[styles.leader, { borderBottomColor: palette.line }]} accessibilityElementsHidden />
      <Readout variant="readout" style={{ color: isChecked ? palette.textMuted : palette.text }}>
        {formatQuantity(quantity, unit)}
      </Readout>
    </View>
  );

  if (!onToggle) return row;

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={HIT_SLOP}
      accessibilityRole="checkbox"
      accessibilityLabel={name}
      accessibilityState={{ checked: isChecked }}
    >
      {row}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: space.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
    marginBottom: 3,
  },
  name: {
    flexShrink: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  // Android only honours borderStyle 'dotted' when every border width is
  // equal and non-zero, so the sides are drawn at 1px in transparent rather
  // than left at 0 - with borderBottomWidth alone the leader renders solid.
  leader: {
    flex: 1,
    minWidth: 12,
    height: 0,
    marginHorizontal: space.sm,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    borderStyle: 'dotted',
  },
});

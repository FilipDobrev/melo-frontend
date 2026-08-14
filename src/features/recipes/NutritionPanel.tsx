import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Readout, Text } from '../../ui/Text';
import { colors, radius, space } from '../../theme/theme';
import type { Nutrition } from '../../api/schemas';

interface NutritionPanelProps {
  nutrition: Nutrition;
}

const MACRO_COLUMNS: { key: keyof Omit<Nutrition, 'calories'>; label: string }[] = [
  { key: 'protein', label: 'PROTEIN' },
  { key: 'carbs', label: 'CARBS' },
  { key: 'fat', label: 'FAT' },
];

/** The kitchen-scale readout: totals for the whole recipe, not per serving. */
export function NutritionPanel({ nutrition }: NutritionPanelProps) {
  return (
    <View>
      <Text variant="label" color="textMuted" style={styles.eyebrow}>
        WHOLE RECIPE
      </Text>
      <View style={styles.panel}>
        <View style={styles.column}>
          <Readout variant="readoutXl" align="right">
            {Math.round(nutrition.calories)}
          </Readout>
          <Text variant="label" color="textMuted" align="right">
            KCAL
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.macros}>
          {MACRO_COLUMNS.map(({ key, label }) => (
            <View key={key} style={styles.column}>
              <Readout variant="readoutLg" align="right">
                {Math.round(nutrition[key])}
              </Readout>
              <Text variant="label" color="textMuted" align="right">
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slab,
    borderRadius: radius.md,
    padding: space.lg,
    marginHorizontal: space.lg,
  },
  column: {
    alignItems: 'flex-end',
  },
  rule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.lineStrong,
    marginHorizontal: space.lg,
  },
  macros: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

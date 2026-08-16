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
        <View style={styles.headline}>
          <Readout variant="readoutXl">{Math.round(nutrition.calories)}</Readout>
          <Text variant="label" color="textMuted" style={styles.headlineLabel}>
            KCAL
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.macros}>
          {MACRO_COLUMNS.map(({ key, label }, index) => (
            <React.Fragment key={key}>
              {index > 0 && <View style={styles.macroRule} />}
              <View style={styles.macroColumn}>
                <Readout variant="readoutLg">{Math.round(nutrition[key])} G</Readout>
                <Text variant="label" color="textMuted" numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </React.Fragment>
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
    backgroundColor: colors.slab,
    borderRadius: radius.md,
    padding: space.lg,
    marginHorizontal: space.lg,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // Offsets the label down off the number's cap height so it lands on its baseline instead.
  headlineLabel: {
    marginLeft: space.xs,
    marginBottom: space.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineStrong,
    marginVertical: space.md,
  },
  macros: {
    flexDirection: 'row',
  },
  // Equal flex on every column is what keeps the three figures aligned,
  // regardless of how long PROTEIN/CARBS/FAT's labels are.
  macroColumn: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
  },
  macroRule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.lineStrong,
  },
});

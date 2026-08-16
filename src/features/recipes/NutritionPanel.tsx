import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Readout, Text } from '../../ui/Text';
import { colors, macroColors, radius, space } from '../../theme/theme';
import type { Nutrition } from '../../api/schemas';

interface NutritionPanelProps {
  nutrition: Nutrition;
}

const MACRO_COLUMNS: {
  key: keyof Omit<Nutrition, 'calories'>;
  label: string;
  color: string;
}[] = [
  { key: 'protein', label: 'PROTEIN', color: macroColors.protein },
  { key: 'carbs', label: 'CARBS', color: macroColors.carbs },
  { key: 'fat', label: 'FAT', color: macroColors.fat },
];

const ENERGY_PER_GRAM: Record<'protein' | 'carbs' | 'fat', number> = {
  protein: 4,
  carbs: 4,
  fat: 9,
};

/** The kitchen-scale readout: totals for the whole recipe, not per serving. */
export function NutritionPanel({ nutrition }: NutritionPanelProps) {
  const energyByMacro = {
    protein: nutrition.protein * ENERGY_PER_GRAM.protein,
    carbs: nutrition.carbs * ENERGY_PER_GRAM.carbs,
    fat: nutrition.fat * ENERGY_PER_GRAM.fat,
  };
  const totalEnergy = energyByMacro.protein + energyByMacro.carbs + energyByMacro.fat;

  const accessibilityLabel =
    totalEnergy > 0
      ? `Energy split: ${Math.round((energyByMacro.protein / totalEnergy) * 100)}% protein, ` +
        `${Math.round((energyByMacro.carbs / totalEnergy) * 100)}% carbs, ` +
        `${Math.round((energyByMacro.fat / totalEnergy) * 100)}% fat`
      : 'No macro data';

  return (
    <View>
      <Text variant="label" color="textMuted" style={styles.eyebrow}>
        WHOLE RECIPE
      </Text>
      <View style={styles.panel}>
        <View style={styles.headline}>
          <View style={styles.calorieBlock}>
            <Readout variant="readoutXl">{Math.round(nutrition.calories)}</Readout>
            <Text variant="label" color="textMuted" style={styles.headlineLabel}>
              KCAL
            </Text>
          </View>

          <View
            style={styles.energyBar}
            accessibilityRole="image"
            accessibilityLabel={accessibilityLabel}
          >
            {/*
              This bar shows how the recipe's energy splits between protein,
              carbs and fat, normalised to 100% among just those three - it
              does NOT decompose the `calories` figure above. That number is
              computed independently by the backend from product data, so the
              two will not sum to match exactly. Never add a percentage or a
              caption that implies otherwise.
            */}
            {totalEnergy > 0 &&
              MACRO_COLUMNS.map(({ key, color }) => (
                <View
                  key={key}
                  style={[styles.energySegment, { flex: energyByMacro[key], backgroundColor: color }]}
                />
              ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.macros}>
          {MACRO_COLUMNS.map(({ key, label, color }, index) => (
            <React.Fragment key={key}>
              {index > 0 && <View style={styles.macroRule} />}
              <View style={styles.macroColumn}>
                <Readout variant="readoutLg">{Math.round(nutrition[key])} G</Readout>
                <View style={styles.macroLabelRow}>
                  <View style={[styles.macroDot, { backgroundColor: color }]} />
                  <Text variant="label" color="textMuted" numberOfLines={1}>
                    {label}
                  </Text>
                </View>
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
    alignItems: 'center',
  },
  calorieBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // Offsets the label down off the number's cap height so it lands on its baseline instead.
  headlineLabel: {
    marginLeft: space.xs,
    marginBottom: space.xs,
  },
  energyBar: {
    flex: 1,
    marginLeft: space.xl,
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.lineStrong,
    flexDirection: 'row',
    gap: 2,
  },
  energySegment: {
    height: '100%',
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
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    marginRight: space.xs,
  },
  macroRule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.lineStrong,
  },
});

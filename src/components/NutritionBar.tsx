import { StyleSheet, Text, View } from 'react-native';
import type { Nutrition } from '../api/schemas';

export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  const entries: Array<[string, number, string]> = [
    ['Calories', nutrition.calories, 'kcal'],
    ['Protein', nutrition.protein, 'g'],
    ['Carbs', nutrition.carbs, 'g'],
    ['Fat', nutrition.fat, 'g'],
  ];

  return (
    <View style={styles.row}>
      {entries.map(([label, value, unit]) => (
        <View key={label} style={styles.item}>
          <Text style={styles.value}>{Math.round(value)}{unit === 'kcal' ? '' : unit}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
  },
  item: {
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2620',
  },
  label: {
    fontSize: 12,
    color: '#6B6155',
    marginTop: 2,
  },
});

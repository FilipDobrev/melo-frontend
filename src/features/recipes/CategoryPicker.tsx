import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '../../ui/Chip';
import { Text } from '../../ui/Text';
import { space } from '../../theme/theme';
import { useCategories } from '../../api/catalog';

interface CategoryPickerProps {
  selected: string[];
  onChange: (slugs: string[]) => void;
}

export function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  const { data: categories } = useCategories();

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <View>
      <Text variant="label" color="textMuted" style={styles.label}>
        CATEGORIES
      </Text>
      <View style={styles.wrap}>
        {(categories ?? []).map((category) => (
          <Chip
            key={category.slug}
            label={category.name}
            selected={selected.includes(category.slug)}
            onPress={() => toggle(category.slug)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: space.sm,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});

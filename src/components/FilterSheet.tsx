import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Category } from '../api/schemas';
import type { RecipeSort } from '../api/recipes.api';

const SORT_OPTIONS: { value: RecipeSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most saved' },
];

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (slug: string) => void;
  onClearAll: () => void;
  // Sort section is only shown when both props are provided. The cookbook
  // screen has no sort param, so it omits them and only Tags renders.
  sort?: RecipeSort;
  onChangeSort?: (sort: RecipeSort) => void;
};

// Adding another filter type later means adding one more section below,
// following the same pattern as Sort/Tags - not building a generic
// section-list abstraction for filters that don't exist yet.
export function FilterSheet({
  visible,
  onClose,
  categories,
  selectedCategories,
  onToggleCategory,
  onClearAll,
  sort,
  onChangeSort,
}: FilterSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {sort && onChangeSort ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sort</Text>
                <View style={styles.tagGrid}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.chip, sort === option.value && styles.chipActive]}
                      onPress={() => onChangeSort(option.value)}
                    >
                      <Text style={[styles.chipText, sort === option.value && styles.chipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.chip, selectedCategories.includes(category.slug) && styles.chipActive]}
                    onPress={() => onToggleCategory(category.slug)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCategories.includes(category.slug) && styles.chipTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
            <Text style={styles.clearButtonText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type FilterButtonProps = {
  activeCount: number;
  onPress: () => void;
};

export function FilterButton({ activeCount, onPress }: FilterButtonProps) {
  return (
    <TouchableOpacity style={styles.filterButton} onPress={onPress}>
      <Text style={styles.filterIcon}>▽</Text>
      <Text style={styles.filterLabel}>Filter</Text>
      {activeCount > 0 ? (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F0E8',
    marginBottom: 12,
  },
  filterIcon: {
    fontSize: 13,
    color: '#6B6155',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#B5541A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 38, 32, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFBF5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5DDD0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2620',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#B5541A',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
    marginBottom: 10,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F0E8',
  },
  chipActive: {
    backgroundColor: '#B5541A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  clearButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DDD0',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6155',
  },
});

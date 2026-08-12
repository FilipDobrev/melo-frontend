import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCookbook } from '../../src/hooks/useCookbook';
import { useCategories } from '../../src/hooks/useCategories';
import { RecipeCard } from '../../src/components/RecipeCard';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';

export default function CookbookScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categoriesQuery = useCategories();
  const cookbookQuery = useCookbook(selectedCategories);

  function toggleCategory(slug: string) {
    setSelectedCategories((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
  }

  const recipes = cookbookQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cookbook</Text>

      {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
        <FlatList
          horizontal
          data={categoriesQuery.data}
          keyExtractor={(category) => category.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategories.includes(item.slug) && styles.chipActive]}
              onPress={() => toggleCategory(item.slug)}
            >
              <Text style={[styles.chipText, selectedCategories.includes(item.slug) && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : null}

      {cookbookQuery.isLoading ? (
        <LoadingState />
      ) : cookbookQuery.isError ? (
        <ErrorState
          message={cookbookQuery.error instanceof ApiError ? cookbookQuery.error.message : 'Could not load your cookbook.'}
          onRetry={cookbookQuery.refetch}
        />
      ) : recipes.length === 0 ? (
        <EmptyState title="No saved recipes yet" message="Save recipes you like to find them here." />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(recipe) => recipe.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (cookbookQuery.hasNextPage && !cookbookQuery.isFetchingNextPage) {
              cookbookQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={cookbookQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
    marginBottom: 12,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 12,
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
  list: {
    paddingBottom: 24,
  },
  footerSpinner: {
    marginVertical: 16,
  },
});

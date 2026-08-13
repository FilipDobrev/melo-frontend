import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { useCookbook } from '../../src/hooks/useCookbook';
import { useCategories } from '../../src/hooks/useCategories';
import { useCollections, useCreateCollection } from '../../src/hooks/useCollections';
import { RecipeCard } from '../../src/components/RecipeCard';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { FilterButton, FilterSheet } from '../../src/components/FilterSheet';
import { TextPromptModal } from '../../src/components/TextPromptModal';
import { CollectionPickerModal } from '../../src/components/CollectionPickerModal';
import { ApiError } from '../../src/api/client';

export default function CookbookScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);

  const categoriesQuery = useCategories();
  const cookbookQuery = useCookbook(selectedCategories);
  const collectionsQuery = useCollections();
  const createCollection = useCreateCollection();

  function toggleCategory(slug: string) {
    setSelectedCategories((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
  }

  const recipes = cookbookQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Cookbook</Text>
        <Link href="/recipe/new" asChild>
          <TouchableOpacity style={styles.newRecipeButton}>
            <Text style={styles.newRecipeButtonText}>+ New recipe</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <FilterButton activeCount={selectedCategories.length} onPress={() => setIsFilterVisible(true)} />

      <View style={styles.collectionsSection}>
        <Text style={styles.sectionLabel}>Collections</Text>
        <FlatList
          horizontal
          data={collectionsQuery.data ?? []}
          keyExtractor={(collection) => collection.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionsRow}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/collection/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity style={styles.collectionChip}>
                <Text style={styles.collectionName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.collectionCount}>{item.recipeCount}</Text>
              </TouchableOpacity>
            </Link>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.newCollectionChip} onPress={() => setIsCreatingCollection(true)}>
              <Text style={styles.newCollectionChipText}>+ New collection</Text>
            </TouchableOpacity>
          }
        />
      </View>

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
          renderItem={({ item }) => <RecipeCard recipe={item} onAddToCollection={() => setPickerRecipeId(item.id)} />}
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

      <FilterSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        categories={categoriesQuery.data ?? []}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onClearAll={() => setSelectedCategories([])}
      />

      <TextPromptModal
        visible={isCreatingCollection}
        title="New collection"
        submitLabel="Create"
        onClose={() => setIsCreatingCollection(false)}
        onSubmit={(name) => createCollection.mutateAsync(name)}
      />

      {pickerRecipeId ? (
        <CollectionPickerModal
          visible={pickerRecipeId !== null}
          recipeId={pickerRecipeId}
          onClose={() => setPickerRecipeId(null)}
        />
      ) : null}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
  },
  newRecipeButton: {
    backgroundColor: '#B5541A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newRecipeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collectionsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
    marginBottom: 8,
  },
  collectionsRow: {
    gap: 10,
  },
  collectionChip: {
    backgroundColor: '#F5F0E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 160,
  },
  collectionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2620',
  },
  collectionCount: {
    fontSize: 12,
    color: '#8A7F70',
    marginTop: 2,
  },
  newCollectionChip: {
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5DDD0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newCollectionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B5541A',
  },
  list: {
    paddingBottom: 24,
  },
  footerSpinner: {
    marginVertical: 16,
  },
});

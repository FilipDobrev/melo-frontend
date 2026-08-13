import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCollections, useCollectionRecipes, useRenameCollection, useDeleteCollection } from '../../src/hooks/useCollections';
import { RecipeCard } from '../../src/components/RecipeCard';
import { TextPromptModal } from '../../src/components/TextPromptModal';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const collectionsQuery = useCollections();
  const recipesQuery = useCollectionRecipes(id);
  const renameCollection = useRenameCollection(id);
  const deleteCollection = useDeleteCollection();

  const collection = collectionsQuery.data?.find((item) => item.id === id);
  const recipes = recipesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deleteCollection.mutateAsync(id);
      router.back();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this collection.');
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: collection?.name ?? 'Collection' }} />

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {collection?.name ?? 'Collection'}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => setIsRenaming(true)}>
            <Text style={styles.actionText}>Rename</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} disabled={deleteCollection.isPending}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}

      {recipesQuery.isLoading ? (
        <LoadingState />
      ) : recipesQuery.isError ? (
        <ErrorState
          message={recipesQuery.error instanceof ApiError ? recipesQuery.error.message : 'Could not load this collection.'}
          onRetry={recipesQuery.refetch}
        />
      ) : recipes.length === 0 ? (
        <EmptyState title="No recipes yet" message="Add recipes to this collection from your cookbook." />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(recipe) => recipe.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (recipesQuery.hasNextPage && !recipesQuery.isFetchingNextPage) {
              recipesQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={recipesQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        />
      )}

      <TextPromptModal
        visible={isRenaming}
        title="Rename collection"
        initialValue={collection?.name}
        submitLabel="Save"
        onClose={() => setIsRenaming(false)}
        onSubmit={(name) => renameCollection.mutateAsync(name)}
      />
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
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#2B2620',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B5541A',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C0392B',
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 24,
  },
  footerSpinner: {
    marginVertical: 16,
  },
});

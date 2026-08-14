import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { errorMessage } from '../../src/api/client';
import {
  useCollectionRecipes,
  useCollections,
  useRemoveRecipeFromCollection,
  useRenameCollection,
} from '../../src/api/cookbook';
import { flattenPages } from '../../src/api/paging';
import { RecipeTile } from '../../src/features/recipes/RecipeTile';
import { Button } from '../../src/ui/Button';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { EmptyState } from '../../src/ui/EmptyState';
import { Field } from '../../src/ui/Field';
import { IconButton } from '../../src/ui/IconButton';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { Sheet } from '../../src/ui/Sheet';
import { StateView } from '../../src/ui/StateView';
import { space } from '../../src/theme/theme';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const collections = useCollections();
  const collection = (collections.data ?? []).find((item) => item.id === id);
  const recipes = useCollectionRecipes(id);
  const removeRecipe = useRemoveRecipeFromCollection(id);
  const renameCollection = useRenameCollection();

  const [isRenameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(collection?.name ?? '');
  const [renameError, setRenameError] = useState<string>();
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const tileWidth = (width - space.lg * 2 - space.md) / 2;
  const recipeItems = flattenPages(recipes.data);

  function openRename() {
    setRenameValue(collection?.name ?? '');
    setRenameError(undefined);
    setRenameOpen(true);
  }

  async function handleRename() {
    setRenameError(undefined);
    try {
      await renameCollection.mutateAsync({ collectionId: id, name: renameValue });
      setRenameOpen(false);
    } catch (error) {
      setRenameError(errorMessage(error));
    }
  }

  function handleRemove() {
    if (removeTarget) removeRecipe.mutate(removeTarget);
    setRemoveTarget(null);
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader
        title={collection?.name}
        onBack={() => router.back()}
        right={<IconButton name="edit-3" label="Rename collection" onPress={openRename} />}
      />
      <StateView isLoading={recipes.isLoading} error={recipes.error} onRetry={() => recipes.refetch()}>
        <FlatList
          style={styles.list}
          data={recipeItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <RecipeTile
              recipe={item}
              width={tileWidth}
              onLongPress={() => setRemoveTarget(item.id)}
            />
          )}
          onEndReached={() => {
            if (recipes.hasNextPage && !recipes.isFetchingNextPage) recipes.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            recipes.isLoading ? null : (
              <EmptyState
                title="Nothing here yet"
                body="Add recipes to this collection from your cookbook."
              />
            )
          }
        />
      </StateView>

      <Sheet visible={isRenameOpen} onClose={() => setRenameOpen(false)} title="Rename collection" heightRatio={0.4}>
        <View style={styles.sheetContent}>
          <Field label="Name" value={renameValue} onChangeText={setRenameValue} error={renameError} maxLength={60} />
          <Button title="Save" onPress={handleRename} loading={renameCollection.isPending} stretch />
        </View>
      </Sheet>

      <ConfirmDialog
        visible={removeTarget !== null}
        title="Remove from collection"
        body="It stays in your cookbook."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  row: {
    gap: space.md,
  },
  sheetContent: {
    padding: space.lg,
    gap: space.lg,
  },
});

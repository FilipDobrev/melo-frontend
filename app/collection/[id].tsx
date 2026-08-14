import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import {
  useCollectionRecipes,
  useCollections,
  useRemoveRecipeFromCollection,
  useRenameCollection,
} from '../../src/api/cookbook';
import { flattenPages } from '../../src/api/paging';
import { useDeleteRecipe } from '../../src/api/recipes';
import { useCurrentUser } from '../../src/auth/AuthContext';
import { CollectionPickerSheet } from '../../src/features/collections/CollectionPickerSheet';
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
import { Text } from '../../src/ui/Text';
import { colors, space } from '../../src/theme/theme';
import { useContentWidth } from '../../src/theme/layout';

/** Row height (56) x visible row count, so the sheet fits its rows without scrolling. */
const ACTION_ROW_HEIGHT = 56;

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const collections = useCollections();
  const collection = (collections.data ?? []).find((item) => item.id === id);
  const recipes = useCollectionRecipes(id);
  const removeRecipe = useRemoveRecipeFromCollection(id);
  const renameCollection = useRenameCollection();
  const deleteRecipe = useDeleteRecipe();
  const currentUser = useCurrentUser();

  const [isRenameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(collection?.name ?? '');
  const [renameError, setRenameError] = useState<string>();
  const [actionsRecipeId, setActionsRecipeId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const width = useContentWidth();
  const tileWidth = Math.floor((width - space.lg * 2 - space.md) / 2);
  const recipeItems = flattenPages(recipes.data);

  const actionsRecipe = recipeItems.find((item) => item.id === actionsRecipeId) ?? null;
  // A collection can hold recipes saved from other users too, so edit/delete
  // must only show for a recipe the viewer actually owns.
  const isOwner = !!actionsRecipe && !!currentUser && actionsRecipe.owner.id === currentUser.id;
  const visibleRowCount = isOwner ? 4 : 2;

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

  function handleDelete() {
    if (confirmDeleteId) deleteRecipe.mutate(confirmDeleteId);
    setConfirmDeleteId(null);
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
              onLongPress={() => setActionsRecipeId(item.id)}
              onOpenActions={() => setActionsRecipeId(item.id)}
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

      <Sheet
        visible={actionsRecipeId !== null}
        onClose={() => setActionsRecipeId(null)}
        // 2 rows for a recipe you don't own, 4 for one you do; scale the sheet
        // to that instead of hardcoding one height for both cases.
        heightRatio={0.14 + visibleRowCount * 0.07}
      >
        {/* Distinct from "Delete recipe" below: this only takes the recipe out
            of this collection, it stays saved in the cookbook and any other collection. */}
        <RowAction
          icon="bookmark"
          label="Remove from this collection"
          danger
          onPress={() => {
            setRemoveTarget(actionsRecipeId);
            setActionsRecipeId(null);
          }}
        />
        <RowAction
          icon="folder-plus"
          label="Add to a collection"
          onPress={() => {
            setPickerRecipeId(actionsRecipeId);
            setActionsRecipeId(null);
          }}
        />
        {isOwner && (
          <RowAction
            icon="edit-3"
            label="Edit recipe"
            onPress={() => {
              const recipeId = actionsRecipeId;
              setActionsRecipeId(null);
              if (recipeId) router.push({ pathname: '/recipe/[id]/edit', params: { id: recipeId } });
            }}
          />
        )}
        {isOwner && (
          <RowAction
            icon="trash-2"
            label="Delete recipe"
            danger
            onPress={() => {
              const recipeId = actionsRecipeId;
              setActionsRecipeId(null);
              setConfirmDeleteId(recipeId);
            }}
          />
        )}
      </Sheet>

      <CollectionPickerSheet recipeId={pickerRecipeId} onClose={() => setPickerRecipeId(null)} />

      <ConfirmDialog
        visible={removeTarget !== null}
        title="Remove from collection"
        body="It stays in your cookbook."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        visible={confirmDeleteId !== null}
        title="Delete recipe"
        body="This also removes it from everyone's cookbooks."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </Screen>
  );
}

function RowAction({
  label,
  onPress,
  danger,
  icon,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}) {
  return (
    <Pressable style={styles.actionRow} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {icon && <Feather name={icon} size={18} color={danger ? colors.danger : colors.text} />}
      <Text variant="strong" color={danger ? 'danger' : 'text'}>
        {label}
      </Text>
    </Pressable>
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
  actionRow: {
    height: ACTION_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
  },
});

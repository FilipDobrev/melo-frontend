import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import {
  useAddRecipeToCollection,
  useCollections,
  useCreateCollection,
} from '../../api/cookbook';
import type { Collection } from '../../api/schemas';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Sheet } from '../../ui/Sheet';
import { Readout, Text } from '../../ui/Text';
import { colors, space } from '../../theme/theme';

interface CollectionPickerSheetProps {
  recipeId: string | null;
  onClose: () => void;
}

export function CollectionPickerSheet({ recipeId, onClose }: CollectionPickerSheetProps) {
  const collections = useCollections();
  const createCollection = useCreateCollection();

  // The API exposes no "is this recipe already in this collection" flag, so
  // rows are marked "Added" only locally, after a successful add in this
  // session - never rendered as a pre-existing checked state.
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState<string>();

  function handleClose() {
    setAddedIds(new Set());
    setNewName('');
    setNewError(undefined);
    onClose();
  }

  async function handleCreateAndAdd() {
    if (!recipeId) return;
    setNewError(undefined);
    try {
      const collection = await createCollection.mutateAsync(newName);
      setNewName('');
      setAddedIds((prev) => new Set(prev).add(collection.id));
    } catch (error) {
      setNewError(errorMessage(error));
    }
  }

  return (
    <Sheet
      visible={recipeId !== null}
      onClose={handleClose}
      title="Save to a collection"
      heightRatio={0.6}
      footer={
        <View style={styles.newRow}>
          <Field label="New collection" value={newName} onChangeText={setNewName} error={newError} maxLength={60} />
          <Button
            title="Create and save"
            onPress={handleCreateAndAdd}
            loading={createCollection.isPending}
            stretch
          />
        </View>
      }
    >
      <FlatList
        style={styles.list}
        data={collections.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CollectionRow
            collection={item}
            recipeId={recipeId}
            isAdded={addedIds.has(item.id)}
            onAdded={() => setAddedIds((prev) => new Set(prev).add(item.id))}
          />
        )}
      />
    </Sheet>
  );
}

function CollectionRow({
  collection,
  recipeId,
  isAdded,
  onAdded,
}: {
  collection: Collection;
  recipeId: string | null;
  isAdded: boolean;
  onAdded: () => void;
}) {
  const addToCollection = useAddRecipeToCollection(collection.id);

  async function handlePress() {
    if (!recipeId || isAdded) return;
    await addToCollection.mutateAsync(recipeId);
    onAdded();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={collection.name}
      style={styles.row}
      onPress={handlePress}
      disabled={addToCollection.isPending}
    >
      <Text variant="body" style={styles.rowName}>
        {collection.name}
      </Text>
      {isAdded ? (
        <View style={styles.addedTag}>
          <Feather name="check" size={14} color={colors.deep} />
          <Text variant="strongSm" color="deep">
            Added
          </Text>
        </View>
      ) : (
        <Readout variant="readoutSm" color="textMuted">
          {`${collection.recipeCount} saved`}
        </Readout>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowName: {
    flex: 1,
  },
  addedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  newRow: {
    padding: space.lg,
    gap: space.md,
  },
});

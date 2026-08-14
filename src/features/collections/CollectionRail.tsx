import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useRenameCollection,
} from '../../api/cookbook';
import type { Collection } from '../../api/schemas';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Field } from '../../ui/Field';
import { Readout, Text } from '../../ui/Text';
import { Sheet } from '../../ui/Sheet';
import { colors, radius, space } from '../../theme/theme';

interface CollectionRailProps {
  onOpenCollection: (id: string) => void;
}

export function CollectionRail({ onOpenCollection }: CollectionRailProps) {
  const collections = useCollections();
  const createCollection = useCreateCollection();
  const renameCollection = useRenameCollection();
  const deleteCollection = useDeleteCollection();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState<string>();

  const [actionsFor, setActionsFor] = useState<Collection | null>(null);
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  async function handleCreate() {
    setCreateError(undefined);
    try {
      await createCollection.mutateAsync(createName);
      setCreateName('');
      setCreateOpen(false);
    } catch (error) {
      setCreateError(errorMessage(error));
    }
  }

  async function handleRename() {
    if (!renameTarget) return;
    setRenameError(undefined);
    try {
      await renameCollection.mutateAsync({ collectionId: renameTarget.id, name: renameValue });
      setRenameTarget(null);
    } catch (error) {
      setRenameError(errorMessage(error));
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteCollection.mutate(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.railScroll}
        contentContainerStyle={styles.rail}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New collection"
          style={styles.newTile}
          onPress={() => setCreateOpen(true)}
        >
          <Feather name="plus" size={20} color={colors.textMuted} />
        </Pressable>
        {(collections.data ?? []).map((collection) => (
          <Pressable
            key={collection.id}
            accessibilityRole="button"
            accessibilityLabel={collection.name}
            style={styles.tile}
            onPress={() => onOpenCollection(collection.id)}
            onLongPress={() => setActionsFor(collection)}
            delayLongPress={400}
          >
            <Text variant="displaySm" numberOfLines={2}>
              {collection.name}
            </Text>
            <Readout variant="readoutSm" color="textMuted">
              {`${collection.recipeCount} saved`}
            </Readout>
          </Pressable>
        ))}
      </ScrollView>

      <Sheet visible={isCreateOpen} onClose={() => setCreateOpen(false)} title="New collection" heightRatio={0.4}>
        <View style={styles.sheetContent}>
          <Field label="Name" value={createName} onChangeText={setCreateName} error={createError} maxLength={60} />
          <Button
            title="Create collection"
            onPress={handleCreate}
            loading={createCollection.isPending}
            stretch
          />
        </View>
      </Sheet>

      <Sheet visible={actionsFor !== null} onClose={() => setActionsFor(null)} heightRatio={0.3}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rename"
          style={styles.actionRow}
          onPress={() => {
            if (actionsFor) {
              setRenameValue(actionsFor.name);
              setRenameTarget(actionsFor);
            }
            setActionsFor(null);
          }}
        >
          <Text variant="strong">Rename</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete"
          style={styles.actionRow}
          onPress={() => {
            setDeleteTarget(actionsFor);
            setActionsFor(null);
          }}
        >
          <Text variant="strong" color="danger">
            Delete
          </Text>
        </Pressable>
      </Sheet>

      <Sheet visible={renameTarget !== null} onClose={() => setRenameTarget(null)} title="Rename collection" heightRatio={0.4}>
        <View style={styles.sheetContent}>
          <Field label="Name" value={renameValue} onChangeText={setRenameValue} error={renameError} maxLength={60} />
          <Button title="Save" onPress={handleRename} loading={renameCollection.isPending} stretch />
        </View>
      </Sheet>

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete collection"
        body="The recipes stay in your cookbook."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // A ScrollView defaults to flexGrow 1, so a horizontal one in a column
  // layout stretches vertically and opens a gap beneath the rail.
  railScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  rail: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  tile: {
    width: 128,
    height: 88,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    justifyContent: 'space-between',
  },
  newTile: {
    width: 128,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    padding: space.lg,
    gap: space.lg,
  },
  actionRow: {
    height: 56,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
});

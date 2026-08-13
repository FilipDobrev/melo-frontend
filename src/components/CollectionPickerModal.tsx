import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCollections, useCreateCollection, useAddRecipeToCollection } from '../hooks/useCollections';
import { ApiError } from '../api/client';
import { TextPromptModal } from './TextPromptModal';
import type { Collection } from '../api/schemas';

type CollectionPickerModalProps = {
  visible: boolean;
  recipeId: string;
  onClose: () => void;
};

export function CollectionPickerModal({ visible, recipeId, onClose }: CollectionPickerModalProps) {
  const collectionsQuery = useCollections();
  const createCollection = useCreateCollection();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add to collection</Text>

          <FlatList
            data={collectionsQuery.data ?? []}
            keyExtractor={(collection) => collection.id}
            style={styles.list}
            renderItem={({ item }) => <CollectionOption collection={item} recipeId={recipeId} onDone={onClose} />}
            ListEmptyComponent={<Text style={styles.emptyText}>You don't have any collections yet.</Text>}
          />

          <TouchableOpacity style={styles.newCollectionButton} onPress={() => setIsCreating(true)}>
            <Text style={styles.newCollectionText}>+ New collection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextPromptModal
        visible={isCreating}
        title="New collection"
        submitLabel="Create"
        onClose={() => setIsCreating(false)}
        onSubmit={(name) => createCollection.mutateAsync(name)}
      />
    </Modal>
  );
}

function CollectionOption({
  collection,
  recipeId,
  onDone,
}: {
  collection: Collection;
  recipeId: string;
  onDone: () => void;
}) {
  const addToCollection = useAddRecipeToCollection(collection.id);
  const [error, setError] = useState<string | null>(null);

  async function handlePress() {
    setError(null);
    try {
      await addToCollection.mutateAsync(recipeId);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add recipe to this collection.');
    }
  }

  return (
    <View>
      <TouchableOpacity style={styles.option} onPress={handlePress} disabled={addToCollection.isPending}>
        <Text style={styles.optionName}>{collection.name}</Text>
        <Text style={styles.optionCount}>{collection.recipeCount}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.optionError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 38, 32, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2620',
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5DDD0',
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2620',
  },
  optionCount: {
    fontSize: 13,
    color: '#8A7F70',
  },
  optionError: {
    color: '#C0392B',
    fontSize: 12,
    paddingBottom: 8,
  },
  emptyText: {
    color: '#8A7F70',
    paddingVertical: 12,
  },
  newCollectionButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  newCollectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B5541A',
  },
  cancelButton: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6155',
  },
});

import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useCategories } from '../../src/api/catalog';
import { useCookbook, useToggleSave } from '../../src/api/cookbook';
import { flattenPages } from '../../src/api/paging';
import { CollectionPickerSheet } from '../../src/features/collections/CollectionPickerSheet';
import { CollectionRail } from '../../src/features/collections/CollectionRail';
import { RecipeTile } from '../../src/features/recipes/RecipeTile';
import { Chip } from '../../src/ui/Chip';
import { EmptyState } from '../../src/ui/EmptyState';
import { Screen } from '../../src/ui/Screen';
import { Sheet } from '../../src/ui/Sheet';
import { StateView } from '../../src/ui/StateView';
import { Text } from '../../src/ui/Text';
import { space } from '../../src/theme/theme';

export default function CookbookScreen() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [longPressedRecipeId, setLongPressedRecipeId] = useState<string | null>(null);
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const tileWidth = (width - space.lg * 2 - space.md) / 2;

  const categories = useCategories();
  const cookbook = useCookbook(selectedSlugs);
  const recipeItems = flattenPages(cookbook.data);
  const toggleSave = useToggleSave();

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function handleRemove() {
    if (longPressedRecipeId) toggleSave.mutate({ recipeId: longPressedRecipeId, saved: false });
    setLongPressedRecipeId(null);
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Text variant="displayLg">Cookbook</Text>
      </View>

      <CollectionRail
        onOpenCollection={(id) => router.push({ pathname: '/collection/[id]', params: { id } })}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {(categories.data ?? []).map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            selected={selectedSlugs.includes(category.slug)}
            onPress={() => toggleSlug(category.slug)}
          />
        ))}
      </ScrollView>

      <StateView isLoading={cookbook.isLoading} error={cookbook.error} onRetry={() => cookbook.refetch()}>
        <FlatList
          style={styles.list}
          data={recipeItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipeGrid}
          columnWrapperStyle={styles.recipeRow}
          renderItem={({ item }) => (
            <RecipeTile
              recipe={item}
              width={tileWidth}
              onLongPress={() => setLongPressedRecipeId(item.id)}
            />
          )}
          onEndReached={() => {
            if (cookbook.hasNextPage && !cookbook.isFetchingNextPage) cookbook.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            cookbook.isLoading ? null : (
              <EmptyState
                title="Nothing saved yet"
                body="Tap the bookmark on any recipe to keep it here."
                actionLabel="Browse recipes"
                onAction={() => router.push('/discover')}
              />
            )
          }
        />
      </StateView>

      <Sheet
        visible={longPressedRecipeId !== null}
        onClose={() => setLongPressedRecipeId(null)}
        heightRatio={0.28}
      >
        <RowAction
          label="Add to a collection"
          onPress={() => {
            setPickerRecipeId(longPressedRecipeId);
            setLongPressedRecipeId(null);
          }}
        />
        <RowAction label="Remove from cookbook" danger onPress={handleRemove} />
      </Sheet>

      <CollectionPickerSheet recipeId={pickerRecipeId} onClose={() => setPickerRecipeId(null)} />
    </Screen>
  );
}

function RowAction({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.actionRow} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Text variant="strong" color={danger ? 'danger' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  // A ScrollView defaults to flexGrow 1, so a horizontal one in a column
  // layout stretches vertically and opens a gap under the chips.
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  list: {
    flex: 1,
  },
  recipeGrid: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  recipeRow: {
    gap: space.md,
  },
  actionRow: {
    height: 56,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
});

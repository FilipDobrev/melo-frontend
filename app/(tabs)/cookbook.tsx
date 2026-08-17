import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useCategories } from '../../src/api/catalog';
import { useCollections, useCookbook, useToggleSave } from '../../src/api/cookbook';
import { flattenPages } from '../../src/api/paging';
import { useDeleteRecipe } from '../../src/api/recipes';
import { useCurrentUser } from '../../src/auth/AuthContext';
import { CollectionPickerSheet } from '../../src/features/collections/CollectionPickerSheet';
import { CollectionRail } from '../../src/features/collections/CollectionRail';
import { RecipeTile } from '../../src/features/recipes/RecipeTile';
import { Chip } from '../../src/ui/Chip';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { EmptyState } from '../../src/ui/EmptyState';
import { IconButton } from '../../src/ui/IconButton';
import { Screen } from '../../src/ui/Screen';
import { Sheet } from '../../src/ui/Sheet';
import { StateView } from '../../src/ui/StateView';
import { Text } from '../../src/ui/Text';
import { colors, space } from '../../src/theme/theme';
import { useContentWidth } from '../../src/theme/layout';

/** Row height (56) x visible row count, so the sheet fits its rows without scrolling. */
const ACTION_ROW_HEIGHT = 56;

export default function CookbookScreen() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [longPressedRecipeId, setLongPressedRecipeId] = useState<string | null>(null);
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const width = useContentWidth();
  const tileWidth = Math.floor((width - space.lg * 2 - space.md) / 2);

  const categories = useCategories();
  const cookbook = useCookbook(selectedSlugs);
  const recipeItems = flattenPages(cookbook.data);
  const toggleSave = useToggleSave();
  const deleteRecipe = useDeleteRecipe();
  const currentUser = useCurrentUser();
  const collections = useCollections();

  const longPressedRecipe = recipeItems.find((item) => item.id === longPressedRecipeId) ?? null;
  // A cookbook holds recipes saved from other users too, so edit/delete must
  // only show for a recipe the viewer actually owns.
  const isOwner = !!longPressedRecipe && !!currentUser && longPressedRecipe.owner.id === currentUser.id;
  const visibleRowCount = isOwner ? 4 : 2;

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function handleRemove() {
    const id = longPressedRecipeId;
    setLongPressedRecipeId(null);
    if (!id) return;
    // No endpoint exposes which collections contain a given recipe, and
    // checking would mean fetching every collection's recipe list. So this
    // proxies "is this recipe filed anywhere" with "does this user have any
    // collections at all" - a user with none has nothing to lose from an
    // unprompted removal. Tighten this to a real per-recipe check if the
    // API ever exposes one.
    if ((collections.data ?? []).length > 0) {
      setConfirmRemoveId(id);
    } else {
      toggleSave.mutate({ recipeId: id, saved: false });
    }
  }

  function handleConfirmRemove() {
    if (confirmRemoveId) toggleSave.mutate({ recipeId: confirmRemoveId, saved: false });
    setConfirmRemoveId(null);
  }

  function handleDelete() {
    if (confirmDeleteId) deleteRecipe.mutate(confirmDeleteId);
    setConfirmDeleteId(null);
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Text variant="displayLg" style={styles.titleText}>
          Cookbook
        </Text>
        <IconButton
          name="plus"
          label="Write a recipe"
          onPress={() => router.push('/recipe/new')}
        />
      </View>

      <Text variant="label" color="textMuted" style={styles.sectionHeader}>
        COLLECTIONS
      </Text>
      <CollectionRail
        onOpenCollection={(id) => router.push({ pathname: '/collection/[id]', params: { id } })}
      />

      <Text variant="label" color="textMuted" style={styles.sectionHeader}>
        ALL SAVED RECIPES
      </Text>
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
              onOpenActions={() => setLongPressedRecipeId(item.id)}
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
        // 2 rows for a recipe you don't own, 4 for one you do; scale the sheet
        // to that instead of hardcoding one height for both cases.
        heightRatio={0.14 + visibleRowCount * 0.07}
      >
        <RowAction
          icon="folder-plus"
          label="Add to a collection"
          onPress={() => {
            setPickerRecipeId(longPressedRecipeId);
            setLongPressedRecipeId(null);
          }}
        />
        {isOwner && (
          <RowAction
            icon="edit-3"
            label="Edit recipe"
            onPress={() => {
              const id = longPressedRecipeId;
              setLongPressedRecipeId(null);
              if (id) router.push({ pathname: '/recipe/[id]/edit', params: { id } });
            }}
          />
        )}
        {/* Distinct from "Delete recipe" below: this only unsaves it from the
            viewer's own cookbook, it does not touch the recipe itself. */}
        <RowAction icon="bookmark" label="Remove from cookbook" danger onPress={handleRemove} />
        {isOwner && (
          <RowAction
            icon="trash-2"
            label="Delete recipe"
            danger
            onPress={() => {
              const id = longPressedRecipeId;
              setLongPressedRecipeId(null);
              setConfirmDeleteId(id);
            }}
          />
        )}
      </Sheet>

      <CollectionPickerSheet recipeId={pickerRecipeId} onClose={() => setPickerRecipeId(null)} />

      <ConfirmDialog
        visible={confirmDeleteId !== null}
        title="Delete recipe"
        body="This also removes it from everyone's cookbooks."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmDialog
        visible={confirmRemoveId !== null}
        title="Remove from your cookbook?"
        body="This also removes it from any collections you've filed it in. You can save it again, but you'll need to re-add it to those collections."
        confirmLabel="Remove"
        destructive
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveId(null)}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  titleText: {
    flex: 1,
  },
  sectionHeader: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    marginBottom: space.sm,
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
    height: ACTION_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
  },
});

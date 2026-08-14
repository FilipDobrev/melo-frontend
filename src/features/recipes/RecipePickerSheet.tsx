import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useCookbook } from '../../api/cookbook';
import { flattenPages } from '../../api/paging';
import type { SavedRecipe } from '../../api/schemas';
import { colors, radius, space } from '../../theme/theme';
import { EmptyState } from '../../ui/EmptyState';
import { Field } from '../../ui/Field';
import { Sheet } from '../../ui/Sheet';
import { StateView } from '../../ui/StateView';
import { Text } from '../../ui/Text';

// This duplicates the list in app/compose/index.tsx almost exactly. Left
// duplicated deliberately - unify the two only if a third caller shows up.
interface RecipePickerSheetProps {
  visible: boolean;
  onClose(): void;
  onPick(recipe: { id: string; title: string }): void;
}

export function RecipePickerSheet({ visible, onClose, onPick }: RecipePickerSheetProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const cookbook = useCookbook([]);
  const recipes = flattenPages(cookbook.data);

  const filteredRecipes = useMemo(
    () =>
      debouncedSearch.length === 0
        ? recipes
        : recipes.filter((recipe) => recipe.title.toLowerCase().includes(debouncedSearch)),
    [recipes, debouncedSearch],
  );

  function handlePick(recipe: SavedRecipe) {
    onPick({ id: recipe.id, title: recipe.title });
    onClose();
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Choose a recipe" heightRatio={0.85}>
      <View style={styles.searchField}>
        <Field
          label="Search"
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search your recipes"
        />
      </View>
      <StateView
        isLoading={cookbook.isLoading}
        error={cookbook.error}
        onRetry={() => cookbook.refetch()}
        emptyWhen={filteredRecipes.length === 0}
        empty={
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Nothing to cook from yet"
              body="Save a recipe to your cookbook, or write your own."
            />
          </View>
        }
      >
        <FlatList
          data={filteredRecipes}
          keyExtractor={(recipe) => recipe.id}
          onEndReached={() => {
            if (cookbook.hasNextPage && !cookbook.isFetchingNextPage) cookbook.fetchNextPage();
          }}
          renderItem={({ item }) => <RecipeRow recipe={item} onPress={() => handlePick(item)} />}
        />
      </StateView>
    </Sheet>
  );
}

function RecipeRow({ recipe, onPress }: { recipe: SavedRecipe; onPress: () => void }) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Choose ${recipe.title}`}
    >
      <Image source={{ uri: recipe.imageUrl }} contentFit="cover" style={styles.thumbnail} />
      <View style={styles.rowBody}>
        <Text variant="displaySm" numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text variant="bodySm" color="textMuted">
          {recipe.owner.username}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchField: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.slab,
  },
  rowBody: {
    flex: 1,
    gap: space.hair,
  },
});

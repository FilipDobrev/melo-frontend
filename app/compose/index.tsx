import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useCookbook } from '../../src/api/cookbook';
import { flattenPages } from '../../src/api/paging';
import type { SavedRecipe } from '../../src/api/schemas';
import { colors, radius, space } from '../../src/theme/theme';
import { EmptyState } from '../../src/ui/EmptyState';
import { Field } from '../../src/ui/Field';
import { Screen } from '../../src/ui/Screen';
import { ScreenHeader } from '../../src/ui/ScreenHeader';
import { StateView } from '../../src/ui/StateView';
import { Text } from '../../src/ui/Text';

export default function ComposePickRecipeScreen() {
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

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="What did you cook?" onBack={() => router.back()} />
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
              actionLabel="Browse recipes"
              onAction={() => router.push('/discover')}
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
          renderItem={({ item }) => <RecipeRow recipe={item} />}
        />
      </StateView>
    </Screen>
  );
}

function RecipeRow({ recipe }: { recipe: SavedRecipe }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/compose/[recipeId]', params: { recipeId: recipe.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Post a cook of ${recipe.title}`}
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
    paddingTop: space.lg,
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

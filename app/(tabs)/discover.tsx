import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useCategories } from '../../src/api/catalog';
import { flattenPages } from '../../src/api/paging';
import { useRecipeSearch, type RecipeSort } from '../../src/api/recipes';
import { useUserSearch } from '../../src/api/users';
import { RecipeTile } from '../../src/features/recipes/RecipeTile';
import { UserRow } from '../../src/features/users/UserRow';
import { Chip } from '../../src/ui/Chip';
import { EmptyState } from '../../src/ui/EmptyState';
import { Field } from '../../src/ui/Field';
import { Screen } from '../../src/ui/Screen';
import { SegmentedControl } from '../../src/ui/SegmentedControl';
import { StateView } from '../../src/ui/StateView';
import { space } from '../../src/theme/theme';

type DiscoverTab = 'recipes' | 'people';

const TAB_OPTIONS: { value: DiscoverTab; label: string }[] = [
  { value: 'recipes', label: 'Recipes' },
  { value: 'people', label: 'People' },
];

const SORT_OPTIONS: { value: RecipeSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Popular' },
];

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tab, setTab] = useState<DiscoverTab>('recipes');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [sort, setSort] = useState<RecipeSort>('newest');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { width } = useWindowDimensions();
  const tileWidth = (width - space.lg * 2 - space.md) / 2;

  const categories = useCategories();
  const recipes = useRecipeSearch(debouncedSearch, selectedSlugs, sort);
  const recipeItems = flattenPages(recipes.data);

  const users = useUserSearch(debouncedSearch);
  const userItems = flattenPages(users.data);

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <Screen>
      <View style={styles.searchWrap}>
        <Field
          label="Search"
          placeholder="Recipes, or people"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(value) => setTab(value as DiscoverTab)} />
      </View>

      {tab === 'recipes' ? (
        <>
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

          <View style={[styles.chipRow, styles.sortRow]}>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={sort === option.value}
                onPress={() => setSort(option.value)}
              />
            ))}
          </View>

          <StateView isLoading={recipes.isLoading} error={recipes.error} onRetry={() => recipes.refetch()}>
            <FlatList
              style={styles.list}
              data={recipeItems}
              numColumns={2}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.recipeGrid}
              columnWrapperStyle={styles.recipeRow}
              renderItem={({ item }) => <RecipeTile recipe={item} width={tileWidth} />}
              onEndReached={() => {
                if (recipes.hasNextPage && !recipes.isFetchingNextPage) recipes.fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                recipes.isLoading ? null : (
                  <EmptyState title="No recipes match" body="Try fewer filters, or a different word." />
                )
              }
            />
          </StateView>
        </>
      ) : debouncedSearch.length === 0 ? (
        <EmptyState title="Find people to follow" body="Search for a cook by username." />
      ) : (
        <StateView isLoading={users.isLoading} error={users.error} onRetry={() => users.refetch()}>
          <FlatList
            style={styles.list}
            data={userItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <UserRow user={item} />}
            onEndReached={() => {
              if (users.hasNextPage && !users.isFetchingNextPage) users.fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
          />
        </StateView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  segmentWrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  // A ScrollView defaults to flexGrow 1, so a horizontal one in a column
  // layout stretches vertically and opens a gap under the chips. It should
  // only ever be as tall as one row of chips.
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
  sortRow: {
    paddingBottom: space.md,
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
});

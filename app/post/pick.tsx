import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCookbook } from '../../src/hooks/useCookbook';
import { useRecipes } from '../../src/hooks/useRecipes';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';
import type { RecipeSummary } from '../../src/api/schemas';

type Source = 'cookbook' | 'all';

export default function PickRecipeScreen() {
  const router = useRouter();
  const [source, setSource] = useState<Source>('cookbook');
  const [search, setSearch] = useState('');

  const cookbookQuery = useCookbook([]);
  const allRecipesQuery = useRecipes(search, []);

  const query = source === 'cookbook' ? cookbookQuery : allRecipesQuery;
  const recipes = query.data?.pages.flatMap((page) => page.items) ?? [];

  function selectRecipe(recipe: RecipeSummary) {
    router.push({ pathname: '/cook/[recipeId]', params: { recipeId: recipe.id } });
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Cook a recipe' }} />
      <Text style={styles.title}>Pick a recipe to cook</Text>

      <View style={styles.sourceRow}>
        <SourceButton label="My cookbook" active={source === 'cookbook'} onPress={() => setSource('cookbook')} />
        <SourceButton label="All recipes" active={source === 'all'} onPress={() => setSource('all')} />
      </View>

      {source === 'all' ? (
        <TextInput
          style={styles.input}
          placeholder="Search recipes"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      ) : null}

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          message={query.error instanceof ApiError ? query.error.message : 'Could not load recipes.'}
          onRetry={query.refetch}
        />
      ) : recipes.length === 0 ? (
        <EmptyState
          title={source === 'cookbook' ? 'No saved recipes yet' : 'No recipes found'}
          message={
            source === 'cookbook' ? 'Save recipes to your cookbook, or browse all recipes.' : 'Try a different search.'
          }
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(recipe) => recipe.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.recipeRow} onPress={() => selectRecipe(item)}>
              <View style={styles.recipeRowText}>
                <Text style={styles.recipeTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.recipeAuthor}>by {item.owner.username}</Text>
              </View>
              <Text style={styles.recipeChevron}>{'>'}</Text>
            </TouchableOpacity>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} /> : null}
        />
      )}
    </View>
  );
}

function SourceButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.sourceButton, active && styles.sourceButtonActive]} onPress={onPress}>
      <Text style={[styles.sourceButtonText, active && styles.sourceButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
    marginBottom: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sourceButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F0E8',
  },
  sourceButtonActive: {
    backgroundColor: '#B5541A',
  },
  sourceButtonText: {
    fontWeight: '600',
    color: '#6B6155',
  },
  sourceButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 24,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5DDD0',
  },
  recipeRowText: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2620',
  },
  recipeAuthor: {
    fontSize: 12,
    color: '#8A7F70',
    marginTop: 4,
  },
  recipeChevron: {
    fontSize: 16,
    color: '#B5541A',
    marginLeft: 8,
  },
  footerSpinner: {
    marginVertical: 16,
  },
});

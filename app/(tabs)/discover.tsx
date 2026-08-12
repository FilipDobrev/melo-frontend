import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { useRecipes } from '../../src/hooks/useRecipes';
import { useUserSearch } from '../../src/hooks/useUserSearch';
import { useCategories } from '../../src/hooks/useCategories';
import { RecipeCard } from '../../src/components/RecipeCard';
import { Avatar } from '../../src/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';

type Mode = 'recipes' | 'users';

export default function DiscoverScreen() {
  const [mode, setMode] = useState<Mode>('recipes');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categoriesQuery = useCategories();
  const recipesQuery = useRecipes(search, selectedCategories);
  const usersQuery = useUserSearch(search);

  function toggleCategory(slug: string) {
    setSelectedCategories((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
  }

  const recipes = recipesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const users = usersQuery.data?.items ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>

      <View style={styles.modeRow}>
        <ModeButton label="Recipes" active={mode === 'recipes'} onPress={() => setMode('recipes')} />
        <ModeButton label="Users" active={mode === 'users'} onPress={() => setMode('users')} />
      </View>

      <TextInput
        style={styles.input}
        placeholder={mode === 'recipes' ? 'Search recipes' : 'Search users'}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {mode === 'recipes' && categoriesQuery.data && categoriesQuery.data.length > 0 ? (
        <FlatList
          horizontal
          data={categoriesQuery.data}
          keyExtractor={(category) => category.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategories.includes(item.slug) && styles.chipActive]}
              onPress={() => toggleCategory(item.slug)}
            >
              <Text style={[styles.chipText, selectedCategories.includes(item.slug) && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : null}

      {mode === 'recipes' ? (
        recipesQuery.isLoading ? (
          <LoadingState />
        ) : recipesQuery.isError ? (
          <ErrorState
            message={recipesQuery.error instanceof ApiError ? recipesQuery.error.message : 'Could not search recipes.'}
            onRetry={recipesQuery.refetch}
          />
        ) : recipes.length === 0 ? (
          <EmptyState title="No recipes found" message="Try a different search or category." />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(recipe) => recipe.id}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (recipesQuery.hasNextPage && !recipesQuery.isFetchingNextPage) {
                recipesQuery.fetchNextPage();
              }
            }}
            ListFooterComponent={recipesQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} /> : null}
          />
        )
      ) : usersQuery.isLoading ? (
        <LoadingState />
      ) : usersQuery.isError ? (
        <ErrorState
          message={usersQuery.error instanceof ApiError ? usersQuery.error.message : 'Could not search users.'}
          onRetry={usersQuery.refetch}
        />
      ) : search.length === 0 ? (
        <EmptyState title="Search for people" message="Type a username to find them." />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(user) => user.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/user/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity style={styles.userRow}>
                <Avatar uri={item.profileImage} username={item.username} size="small" />
                <Text style={styles.username}>{item.username}</Text>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}
    </View>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.modeButton, active && styles.modeButtonActive]} onPress={onPress}>
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>{label}</Text>
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F0E8',
  },
  modeButtonActive: {
    backgroundColor: '#B5541A',
  },
  modeButtonText: {
    fontWeight: '600',
    color: '#6B6155',
  },
  modeButtonTextActive: {
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
  chipRow: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F0E8',
  },
  chipActive: {
    backgroundColor: '#B5541A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: 24,
  },
  footerSpinner: {
    marginVertical: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2620',
  },
});

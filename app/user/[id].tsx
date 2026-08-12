import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUserProfile, useUserPosts, useUserRecipes, useToggleFollow } from '../../src/hooks/useUserProfile';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { PostCard } from '../../src/components/PostCard';
import { RecipeCard } from '../../src/components/RecipeCard';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';

type Tab = 'posts' | 'recipes';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('posts');

  const profileQuery = useUserProfile(id);
  const postsQuery = useUserPosts(id);
  const recipesQuery = useUserRecipes(id);
  const toggleFollow = useToggleFollow(id);

  if (profileQuery.isLoading) {
    return <LoadingState />;
  }
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        message={profileQuery.error instanceof ApiError ? profileQuery.error.message : 'Could not load this profile.'}
        onRetry={profileQuery.refetch}
      />
    );
  }

  const profile = profileQuery.data;
  const isOwnProfile = currentUser?.id === profile.id;
  const posts = postsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const recipes = recipesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profile.profileImage} username={profile.username} size="large" />
        <Text style={styles.username}>{profile.username}</Text>

        <View style={styles.countsRow}>
          <View style={styles.countItem}>
            <Text style={styles.countValue}>{profile.followerCount}</Text>
            <Text style={styles.countLabel}>Followers</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.countValue}>{profile.followingCount}</Text>
            <Text style={styles.countLabel}>Following</Text>
          </View>
        </View>

        {!isOwnProfile && profile.isFollowing !== undefined ? (
          <TouchableOpacity
            style={[styles.followButton, profile.isFollowing && styles.followButtonActive]}
            onPress={() => toggleFollow.mutate(profile.isFollowing ?? false)}
            disabled={toggleFollow.isPending}
          >
            <Text style={[styles.followButtonText, profile.isFollowing && styles.followButtonTextActive]}>
              {profile.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        <TabButton label="Posts" active={tab === 'posts'} onPress={() => setTab('posts')} />
        <TabButton label="Recipes" active={tab === 'recipes'} onPress={() => setTab('recipes')} />
      </View>

      {tab === 'posts' ? (
        postsQuery.isLoading ? (
          <LoadingState />
        ) : posts.length === 0 ? (
          <EmptyState title="No posts yet" />
        ) : (
          <View style={styles.list}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {postsQuery.hasNextPage ? (
              <TouchableOpacity onPress={() => postsQuery.fetchNextPage()} style={styles.loadMore}>
                {postsQuery.isFetchingNextPage ? <ActivityIndicator /> : <Text style={styles.loadMoreText}>Load more</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        )
      ) : recipesQuery.isLoading ? (
        <LoadingState />
      ) : recipes.length === 0 ? (
        <EmptyState title="No recipes yet" />
      ) : (
        <View style={styles.list}>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
          {recipesQuery.hasNextPage ? (
            <TouchableOpacity onPress={() => recipesQuery.fetchNextPage()} style={styles.loadMore}>
              {recipesQuery.isFetchingNextPage ? <ActivityIndicator /> : <Text style={styles.loadMoreText}>Load more</Text>}
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2B2620',
    marginTop: 10,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 14,
  },
  countItem: {
    alignItems: 'center',
  },
  countValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B2620',
  },
  countLabel: {
    fontSize: 12,
    color: '#6B6155',
  },
  followButton: {
    marginTop: 16,
    backgroundColor: '#B5541A',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  followButtonActive: {
    backgroundColor: '#F5F0E8',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  followButtonTextActive: {
    color: '#B5541A',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5DDD0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#B5541A',
  },
  tabButtonText: {
    color: '#6B6155',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#B5541A',
  },
  list: {
    padding: 16,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
    color: '#B5541A',
    fontWeight: '600',
  },
});

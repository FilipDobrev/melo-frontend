import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useCurrentUser } from '../../auth/AuthContext';
import { useProfile, useUserPosts, useUserRecipes } from '../../api/users';
import { flattenPages } from '../../api/paging';
import type { Post, RecipeSummary } from '../../api/schemas';
import { formatCount } from '../../lib/format';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { IconButton } from '../../ui/IconButton';
import { Readout, Text } from '../../ui/Text';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { StateView } from '../../ui/StateView';
import { colors, space } from '../../theme/theme';
import { FollowButton } from './FollowButton';

interface ProfileViewProps {
  userId: string;
}

type ProfileTab = 'posts' | 'recipes';

const TAB_OPTIONS: { value: ProfileTab; label: string }[] = [
  { value: 'posts', label: 'Posts' },
  { value: 'recipes', label: 'Recipes' },
];

export function ProfileView({ userId }: ProfileViewProps) {
  const currentUser = useCurrentUser();
  const isMe = currentUser?.id === userId;

  const profile = useProfile(userId);
  const posts = useUserPosts(userId);
  const recipes = useUserRecipes(userId);
  const [tab, setTab] = useState<ProfileTab>('posts');

  const { width } = useWindowDimensions();
  const tileSize = Math.floor((width - 2) / 3);

  const postItems = flattenPages(posts.data);
  const recipeItems = flattenPages(recipes.data);
  const postCountLabel = posts.hasNextPage ? `${formatCount(postItems.length)}+` : formatCount(postItems.length);

  const header = profile.data ? (
    <View>
      <View style={styles.headerRow}>
        <Avatar uri={profile.data.profileImage} username={profile.data.username} size={84} />
        <View style={styles.statsRow}>
          <StatBlock value={postCountLabel} label="POSTS" />
          <Pressable
            style={styles.statBlock}
            accessibilityRole="button"
            accessibilityLabel="Followers"
            onPress={() => router.push({ pathname: '/user/[id]/followers', params: { id: userId } })}
          >
            <Readout variant="readoutLg">{formatCount(profile.data.followerCount)}</Readout>
            <Text variant="label" color="textMuted">
              FOLLOWERS
            </Text>
          </Pressable>
          <Pressable
            style={styles.statBlock}
            accessibilityRole="button"
            accessibilityLabel="Following"
            onPress={() => router.push({ pathname: '/user/[id]/following', params: { id: userId } })}
          >
            <Readout variant="readoutLg">{formatCount(profile.data.followingCount)}</Readout>
            <Text variant="label" color="textMuted">
              FOLLOWING
            </Text>
          </Pressable>
        </View>
      </View>

      <Text variant="displayLg" style={styles.username}>
        {profile.data.username}
      </Text>

      <View style={styles.actionRow}>
        {isMe ? (
          <>
            <View style={styles.editButton}>
              <Button
                title="Edit profile"
                variant="secondary"
                stretch
                onPress={() => router.push('/settings/profile')}
              />
            </View>
            <IconButton name="settings" label="Settings" onPress={() => router.push('/settings')} />
          </>
        ) : (
          <View style={styles.followWrap}>
            <FollowButton userId={userId} isFollowing={profile.data.isFollowing ?? false} />
          </View>
        )}
      </View>

      <View style={styles.segmentWrap}>
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(value) => setTab(value as ProfileTab)} />
      </View>
    </View>
  ) : null;

  const isPostsTab = tab === 'posts';
  const isLoadingGrid = isPostsTab ? posts.isLoading : recipes.isLoading;

  return (
    <View style={styles.container}>
      <StateView isLoading={profile.isLoading} error={profile.error} onRetry={() => profile.refetch()}>
        {isPostsTab ? (
          <FlatList
            key="posts"
            style={styles.container}
            data={postItems}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostCell post={item} size={tileSize} />}
            ListHeaderComponent={header}
            onEndReached={() => {
              if (posts.hasNextPage && !posts.isFetchingNextPage) posts.fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              isLoadingGrid || !profile.data ? null : <PostsEmptyState isMe={isMe} />
            }
          />
        ) : (
          <FlatList
            key="recipes"
            style={styles.container}
            data={recipeItems}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RecipeCell recipe={item} size={tileSize} />}
            ListHeaderComponent={header}
            onEndReached={() => {
              if (recipes.hasNextPage && !recipes.isFetchingNextPage) recipes.fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              isLoadingGrid || !profile.data ? null : <RecipesEmptyState isMe={isMe} />
            }
          />
        )}
      </StateView>
    </View>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Readout variant="readoutLg">{value}</Readout>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

function PostCell({ post, size }: { post: Post; size: number }) {
  const firstImage = post.images[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open post"
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={{ width: size, height: size }}
    >
      <Image
        source={firstImage ? { uri: firstImage.url } : undefined}
        contentFit="cover"
        style={[styles.cellImage, { backgroundColor: colors.slab }]}
      />
      {post.images.length > 1 && (
        <View style={styles.layersBadge}>
          <Feather name="layers" size={14} color={colors.textInverse} />
        </View>
      )}
    </Pressable>
  );
}

function RecipeCell({ recipe, size }: { recipe: RecipeSummary; size: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
      style={{ width: size, height: size }}
    >
      <Image source={{ uri: recipe.imageUrl }} contentFit="cover" style={[styles.cellImage, { backgroundColor: colors.slab }]} />
      <View style={styles.recipeTitleBand}>
        <Text variant="bodySm" color="textInverse" numberOfLines={2}>
          {recipe.title}
        </Text>
      </View>
    </Pressable>
  );
}

function PostsEmptyState({ isMe }: { isMe: boolean }) {
  return (
    <EmptyState
      title="No cooks yet"
      body="Post a photo of something you made."
      actionLabel={isMe ? 'Post a cook' : undefined}
      onAction={isMe ? () => router.push('/compose') : undefined}
    />
  );
}

function RecipesEmptyState({ isMe }: { isMe: boolean }) {
  return (
    <EmptyState
      title="No recipes yet"
      actionLabel={isMe ? 'Write a recipe' : undefined}
      onAction={isMe ? () => router.push('/recipe/new') : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.lg,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
  },
  username: {
    marginTop: space.lg,
    marginHorizontal: space.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    marginHorizontal: space.lg,
  },
  editButton: {
    flex: 1,
  },
  followWrap: {
    flex: 1,
  },
  segmentWrap: {
    marginTop: space.lg,
    marginHorizontal: space.lg,
    marginBottom: space.hair,
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  layersBadge: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
  },
  recipeTitleBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrimSoft,
    paddingHorizontal: space.xs,
    paddingVertical: space.xs,
  },
});
